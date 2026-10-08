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
 * WHAT IS COUNTED
 * Page views, not sessions or unique readers: every load of a post counts,
 * reloads and repeat visits included. This is the same thing GA4 reports as
 * `screenPageViews`, so the two numbers should be comparable. Only abuse is
 * cut off, through caps that a human reader does not reach.
 *
 * Views are not written straight to the database. They are accumulated in a
 * single Redis hash (`VIEWS_BUFFER_KEY`, field = postId, value = counter) that
 * a background worker periodically flushes into Postgres. One page load
 * therefore costs a handful of Redis round-trips and zero writes to the
 * database.
 *
 * `registerPostView` is the only way in, and it applies these checks in
 * increasing order of cost:
 *
 *   1. postId shape            — pure regex, no I/O
 *   2. known crawler UA        — pure regex, no I/O
 *   3. per-IP rate limit       — 60 calls/min across all posts
 *   4. post really exists      — cached SET lookup, Postgres at most every 5 min
 *   5. per-reader cap          — 20 views/hour of the same post
 *   6. per-IP cap on the post  — 120 views/hour of the same post
 *
 * Check 5 stops one person from inflating a post by holding F5. Check 6 is
 * for a script that drops the visitor cookie on every request, which turns
 * each request into a "new reader"; it is set high enough that a classroom
 * or office behind one shared IP still counts in full.
 *
 * This module deliberately has NO `"use server"` directive. Everything
 * exported from a `"use server"` module becomes a public HTTP endpoint
 * callable with arbitrary arguments, so the identity and the post id have to
 * be resolved in here and must never arrive from the outside. The only caller
 * is the route handler at `app/api/posts/[id]/view/route.ts`.
 */

// Ceiling across all posts. Not the main defence; it keeps a single client
// from hammering the endpoint (and Redis) with any post id at all.
const VIEW_IP_MAX = 60;
const VIEW_IP_WINDOW_SECONDS = 60;

const VIEW_CAP_WINDOW_SECONDS = 60 * 60;
const VIEW_READER_POST_MAX = 20;
const VIEW_IP_POST_MAX = 120;

const POST_IDS_KEY = "posts:published:ids";
const POST_IDS_TTL_SECONDS = 300;

/**
 * Crawlers that execute JavaScript (Googlebot's renderer, Lighthouse, headless
 * browsers used for previews) would otherwise call the endpoint like a reader.
 * GA4 drops known bots too, so skipping them keeps the two counts aligned.
 * This only catches clients that announce themselves; it is not a defence.
 * "bot" needs a following "/" or word boundary ("Googlebot/2.1", "AhrefsBot/7")
 * because a bare substring match also hits phone models such as "CUBOT".
 */
const CRAWLER_UA =
  /(?:bot|crawler|spider)\/|\bbot\b|slurp|headlesschrome|lighthouse|pagespeed|facebookexternalhit/i;

type ViewRecordResult = {
  counted: boolean;
  reason?: "capped" | "rate_limited" | "invalid_post" | "crawler";
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
 * POST_IDS_TTL_SECONDS. A non-existent id creates no key at all. The admin
 * post routes call `invalidatePostIdsCache` on create, update and delete, so
 * a newly published post counts from its first view.
 *
 * If Redis is unreachable, this falls back to Postgres. Note that this makes
 * every single page view issue a query while Redis is down.
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
      // SADD and EXPIRE in one MULTI. As two separate commands, a failure in
      // between left the set without a TTL, and every post published after
      // that was rejected as `invalid_post` until someone deleted the key.
      await getRedis()
        .multi()
        .sadd(POST_IDS_KEY, ...published.map((post) => post.id))
        .expire(POST_IDS_KEY, POST_IDS_TTL_SECONDS)
        .exec();
    } catch {
      // The cache is an optimisation; on failure we still have the Prisma
      // result to answer with.
    }
  }

  return published.some((post) => post.id === postId);
}

/**
 * Drops the cached id set. Call whenever a post is created, published,
 * unpublished or deleted, otherwise the change takes up to
 * POST_IDS_TTL_SECONDS to be visible.
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
 * The single code path that records a view. It resolves the reader identity
 * internally:
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

  const requestHeaders = await headers();

  if (CRAWLER_UA.test(requestHeaders.get("user-agent") ?? "")) {
    return { counted: false, reason: "crawler" };
  }

  const ip = getRequestIp(requestHeaders);

  // A view counter is cosmetic: if Redis is down the in-memory fallback is
  // good enough, and blocking a legitimate reader would be the worse outcome.
  // Hence "open" rather than "closed" on every limit below.
  if (await rateLimit(`views:ip:${ip}`, VIEW_IP_MAX, VIEW_IP_WINDOW_SECONDS, "open")) {
    return { counted: false, reason: "rate_limited" };
  }

  // Before the per-post caps, so an unknown id never creates a cap key.
  if (!(await postExists(postId))) {
    return { counted: false, reason: "invalid_post" };
  }

  const session = await getServerSession(authOptions);
  const reader = session?.user?.id ?? (await getOrCreateVisitorId());

  // The reader cap runs first: a reader who is already capped should not also
  // eat into the budget the rest of their IP shares.
  if (
    await rateLimit(
      `views:cap:reader:${postId}:${reader}`,
      VIEW_READER_POST_MAX,
      VIEW_CAP_WINDOW_SECONDS,
      "open",
    )
  ) {
    return { counted: false, reason: "capped" };
  }

  if (
    await rateLimit(
      `views:cap:ip:${postId}:${ip}`,
      VIEW_IP_POST_MAX,
      VIEW_CAP_WINDOW_SECONDS,
      "open",
    )
  ) {
    return { counted: false, reason: "capped" };
  }

  return incrementBufferedView(postId);
}
