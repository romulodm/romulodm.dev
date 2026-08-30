import "server-only";

import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { prisma } from "@romulo/database";
import { VIEWS_BUFFER_KEY } from "@romulo/queues";

import { authOptions } from "@/lib/auth";
import { getRedis } from "@/lib/redis";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";
import { getOrCreateVisitorId } from "@/lib/visitor";

/**
 * Core of the post view counter.
 *
 * Views are not written straight to the database. They are accumulated in a
 * single Redis hash (`VIEWS_BUFFER_KEY`, field = postId, value = counter) that
 * a background worker periodically flushes into Postgres. One page load
 * therefore costs a handful of Redis round-trips and zero writes to the
 * database.
 *
 * `registerPostView` is the only way in, and it applies four checks in
 * increasing order of cost:
 *
 *   1. postId shape          — pure regex, no I/O
 *   2. per-IP rate limit     — one Redis command
 *   3. post really exists    — cached SET lookup, Postgres at most every 5 min
 *   4. per-identity cooldown — SET NX EX, 30 minutes
 *
 * This module deliberately has NO `"use server"` directive. Everything
 * exported from a `"use server"` module becomes a public HTTP endpoint
 * callable with arbitrary arguments, so the identity and the post id have to
 * be resolved in here and must never arrive from the outside. The thin
 * `"use server"` wrapper lives in the actions file.
 */

const VIEW_DEDUPE_TTL_SECONDS = 30 * 60;

// Per-IP ceiling. Not the main defence (deduplication is); this is the
// backstop that stops someone from cycling the visitor cookie in a loop to
// inflate the counter.
const VIEW_IP_MAX = 60;
const VIEW_IP_WINDOW_SECONDS = 60;

const POST_IDS_KEY = "posts:published:ids";
const POST_IDS_TTL_SECONDS = 300;

type ViewRecordResult = {
  counted: boolean;
  reason?: "cooldown" | "rate_limited" | "invalid_post";
};

/**
 * Post.id is a cuid (`@default(cuid())`): the letter "c" followed by
 * lowercase alphanumerics. Rejecting anything else here means garbage input
 * never reaches Redis or Postgres.
 */
function isValidPostId(postId: unknown): postId is string {
  return typeof postId === "string" && /^c[a-z0-9]{20,30}$/.test(postId);
}

/**
 * Checks that the post exists and is published.
 *
 * This matters beyond correctness: the view buffer is a single Redis hash, so
 * without this check a caller could add unlimited junk fields to one key —
 * unbounded writes into a structure that never expires.
 *
 * The ids of all published posts are cached in a Redis SET, which turns the
 * check into an O(1) SISMEMBER and hits Postgres at most once every
 * POST_IDS_TTL_SECONDS. A non-existent id creates no key at all.
 *
 * If Redis is unreachable, this falls back to Postgres. Note that this makes
 * every single page view issue a query while Redis is down — see the
 * follow-ups noted in the review if that load ever becomes a concern.
 */
export async function postExists(postId: string): Promise<boolean> {
  try {
    const redis = getRedis();

    if ((await redis.exists(POST_IDS_KEY)) === 1) {
      return (await redis.sismember(POST_IDS_KEY, postId)) === 1;
    }
  } catch {
    // Redis unavailable: fall through to Prisma below.
  }

  const published = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true },
  });

  if (published.length > 0) {
    try {
      const redis = getRedis();
      // NOTE: SADD and EXPIRE are two separate commands. A crash in between
      // leaves the set without a TTL, and newly published posts would then be
      // rejected until `invalidatePostIdsCache` runs. Worth folding into a
      // single Lua script / MULTI, the same way `rate-limit.ts` does.
      await redis.sadd(POST_IDS_KEY, ...published.map((post) => post.id));
      await redis.expire(POST_IDS_KEY, POST_IDS_TTL_SECONDS);
    } catch {
      // The cache is an optimisation; on failure we still have the Prisma
      // result to answer with.
    }
  }

  return published.some((post) => post.id === postId);
}

/**
 * Drops the cached id set. Call whenever a post is published or unpublished,
 * otherwise the change takes up to POST_IDS_TTL_SECONDS to be visible.
 */
export async function invalidatePostIdsCache(): Promise<void> {
  try {
    await getRedis().del(POST_IDS_KEY);
  } catch {
    // The 5-minute TTL takes care of it on its own.
  }
}

/** Adds one to the post's field in the buffer the flush worker drains. */
async function incrementBufferedView(postId: string): Promise<ViewRecordResult> {
  await getRedis().hincrby(VIEWS_BUFFER_KEY, postId, 1);
  return { counted: true };
}

/**
 * The single code path that records a view, shared by the Server Action and
 * the HTTP route. It resolves the identity internally:
 *
 *   authenticated session  →  userId
 *   anonymous visitor      →  signed cookie issued by the server
 *
 * Returns whether the view was counted and, if not, why. Callers may surface
 * the reason or ignore it, but must never let the caller *choose* any of the
 * inputs beyond `postId`.
 */
export async function registerPostView(
  postId: unknown,
): Promise<ViewRecordResult> {
  if (!isValidPostId(postId)) {
    return { counted: false, reason: "invalid_post" };
  }

  const ip = getRequestIp(await headers());

  // A view counter is cosmetic: if Redis is down the in-memory fallback is
  // good enough, and blocking a legitimate reader would be the worse outcome.
  // Hence "open" rather than "closed".
  const limited = await rateLimit(
    `views:ip:${ip}`,
    VIEW_IP_MAX,
    VIEW_IP_WINDOW_SECONDS,
    "open",
  );

  if (limited) {
    return { counted: false, reason: "rate_limited" };
  }

  if (!(await postExists(postId))) {
    return { counted: false, reason: "invalid_post" };
  }

  const session = await getServerSession(authOptions);
  const identifier = session?.user?.id ?? (await getOrCreateVisitorId());

  // SET NX EX is the deduplication itself: the first request wins and creates
  // the key, every later request within the window finds it already there.
  // Doing this as GET-then-SET would let concurrent requests both pass.
  const cooldownKey = `view:cooldown:${postId}:${identifier}`;
  const wasSet = await getRedis().set(
    cooldownKey,
    "1",
    "EX",
    VIEW_DEDUPE_TTL_SECONDS,
    "NX",
  );

  if (wasSet !== "OK") {
    return { counted: false, reason: "cooldown" };
  }

  return incrementBufferedView(postId);
}