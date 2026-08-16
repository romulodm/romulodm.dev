import * as Sentry from "@sentry/nextjs";

import { getRedis } from "@/lib/redis";

/**
 * Fixed-window rate limiter backed by Redis, with an in-process fallback.
 *
 * One counter per key per window: INCR on every call, EXPIRE set on the first
 * one. It is deliberately simple — no sliding window, no token bucket —
 * because the point is to stop abuse cheaply, not to meter usage precisely.
 *
 * The file also owns `getRequestIp`, since the client IP is the key most
 * callers rate limit on.
 */

/**
 * What to do when Redis does not answer.
 *
 * - "open"   → fall back to the process-local counter. Use on cosmetic
 *              endpoints (views, likes) where turning a reader away is worse
 *              than counting wrong.
 * - "closed" → block. Use on auth and payments, where being unable to count
 *              is reason enough to refuse.
 */
export type RateLimitFailMode = "open" | "closed";

/**
 * A rate limit check is infrastructure: it must never cost more than the work
 * it protects. If Redis has not answered within this budget it is sick and not
 * worth waiting for — without the timeout, a slow Redis (swap, BGSAVE, network
 * trouble) stalls the event loop and drains the request pool, which is a worse
 * failure than having no rate limit at all.
 */
const REDIS_TIMEOUT_MS = 150;

/**
 * INCR + EXPIRE as one atomic operation.
 *
 * Issued as two separate commands, a failure in between (crash, reconnect,
 * timeout) leaves the key without a TTL forever — and the client stays blocked
 * permanently from the first time it crosses the limit.
 */
const INCR_WITH_TTL = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
`;

// ── In-memory fallback ───────────────────────────────────────────────────────
// Worse than Redis (not shared across instances, lost on restart), but far
// better than letting everything through: even a per-process limit still stops
// brute force.

type LocalBucket = { count: number; resetAt: number };

const LOCAL_MAX_KEYS = 10_000;
const localBuckets = new Map<string, LocalBucket>();

function localRateLimit(key: string, max: number, windowSec: number): boolean {
  const now = Date.now();
  const bucket = localBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    // Memory ceiling. The fallback is temporary, so fine-grained eviction is
    // not worth the complexity: once it is full, wipe it.
    if (localBuckets.size >= LOCAL_MAX_KEYS) {
      localBuckets.clear();
    }

    localBuckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return false;
  }

  bucket.count += 1;
  return bucket.count > max;
}

// ── Observability ────────────────────────────────────────────────────────────
// When Redis goes down, EVERY request lands here. Reporting without throttling
// floods Sentry at exactly the worst moment.

const REPORT_INTERVAL_MS = 60_000;
let lastReportedAt = 0;

function reportThrottled(error: unknown) {
  const now = Date.now();
  if (now - lastReportedAt < REPORT_INTERVAL_MS) return;
  lastReportedAt = now;

  Sentry.withScope((scope) => {
    scope.setTag("api_context", "rate-limit");
    scope.setLevel("warning");
    // A fixed fingerprint collapses the whole outage into a single Sentry
    // issue instead of one per call site.
    scope.setFingerprint(["rate-limit", "redis-unavailable"]);
    Sentry.captureException(
      error instanceof Error ? error : new Error(String(error)),
    );
  });
}

/** Rejects with an error once `ms` elapse, whatever the wrapped promise does. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Redis timed out after ${ms}ms`)),
      ms,
    );

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Returns `true` when the request MUST be blocked.
 *
 * @param key        Bucket key. Always include the right axis: IP for
 *                   anonymous callers, userId for authenticated ones, both
 *                   when you want to limit each dimension separately. Note
 *                   that the key ends up in Redis and in error messages, so
 *                   avoid putting anything more identifying than an IP in it.
 * @param max        Maximum number of requests allowed inside the window.
 * @param windowSec  Window size, in seconds.
 * @param onError    What to do if Redis does not answer. See RateLimitFailMode.
 */
export async function rateLimit(
  key: string,
  max: number,
  windowSec: number,
  onError: RateLimitFailMode = "open",
): Promise<boolean> {
  try {
    const current = (await withTimeout(
      // ioredis types `eval` as returning `unknown`; this script always
      // returns an integer.
      getRedis().eval(INCR_WITH_TTL, 1, key, String(windowSec)) as Promise<number>,
      REDIS_TIMEOUT_MS,
    )) as number;

    return current > max;
  } catch (error) {
    reportThrottled(error);

    if (onError === "closed") {
      return true;
    }

    return localRateLimit(key, max, windowSec);
  }
}

/** Anything with a `.get()` — Headers, Next's ReadonlyHeaders, and so on. */
type HeaderLike = { get(name: string): string | null };

/**
 * The client's real IP address.
 *
 * THIS FUNCTION IS ONLY AS TRUSTWORTHY AS THE PROXY IN FRONT OF IT. Both
 * headers it reads are trivially forged by the client
 * (`curl -H "X-Forwarded-For: 1.2.3.4"`), so the reverse proxy must overwrite
 * them on every request.
 *
 * nginx uses `$proxy_add_x_forwarded_for`, which APPENDS `$remote_addr` to
 * whatever the client sent. The last entry is therefore the only trustworthy
 * one — the first is chosen by the attacker.
 *
 * `x-real-ip` comes from `$remote_addr` and is preferred when present, which
 * assumes nginx always sets it (`proxy_set_header X-Real-IP $remote_addr`).
 * If that directive is ever missing, a client-supplied `x-real-ip` would be
 * trusted verbatim and the per-IP limit becomes bypassable.
 *
 * With Cloudflare in front, nginx additionally needs `set_real_ip_from` plus
 * `real_ip_header CF-Connecting-IP` so `$remote_addr` is the visitor's IP
 * again rather than the edge's.
 *
 * If the proxy ever changes (Traefik, a different ingress), revisit this
 * function: forwarded-header handling is proxy-specific and this logic does
 * not carry over unexamined.
 */
export function getRequestIp(source: Request | HeaderLike): string {
  // Duck-typing rather than `instanceof Headers`: Next's `headers()` returns a
  // ReadonlyHeaders, which is not necessarily an instance of Headers.
  const headers: HeaderLike = "headers" in source ? source.headers : source;

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const entries = forwardedFor.split(",");
    return entries[entries.length - 1]?.trim() || "anonymous";
  }

  // No proxy headers at all. Every such caller shares one bucket, which is
  // fine in development but means a misconfigured deployment silently rate
  // limits all visitors together.
  return "anonymous";
}