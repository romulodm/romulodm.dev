// src/lib/rate-limit.ts
//
// Simple sliding-window rate limiter backed by Redis.
// Falls back to allowing requests if Redis is unavailable (fail-open).
//

import IORedis from "ioredis";

let _redis: IORedis | null = null;

function getRedis(): IORedis {
  if (!_redis) {
    _redis = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    _redis.on("error", () => {
      // Silently discard — rate-limit is best-effort
    });
  }
  return _redis;
}

/**
 * Returns `true` if the caller is rate-limited (should be blocked).
 *
 * @param key    Unique key (e.g. "newsletter:subscribe:127.0.0.1")
 * @param max    Maximum requests allowed in the window
 * @param windowSec  Window length in seconds
 */
export async function rateLimit(
  key: string,
  max: number,
  windowSec: number,
): Promise<boolean> {
  try {
    const redis = getRedis();
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSec);
    }
    return current > max;
  } catch {
    // Fail-open: if Redis is down, let the request through
    return false;
  }
}
