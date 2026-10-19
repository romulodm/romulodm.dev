import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `registerPostView` resolves the reader identity by itself, so that a caller
 * can never choose it (see the note at the top of `lib/views-internal.ts`).
 * The test therefore cannot pass an identifier in; it has to provide a request
 * context instead.
 *
 * `vi.hoisted` is required here: `vi.mock` factories run while the imports
 * below are being resolved, which is before a plain module-level `const` would
 * be initialised.
 */
const requestContext = vi.hoisted(() => {
  const ip = "203.0.113.7";

  return {
    ip,
    // The signed `vid` cookie issued by `getOrCreateVisitorId` has to survive
    // between calls: without it every call looks like a brand new reader and
    // the per-reader cap never triggers.
    cookies: new Map<string, string>(),
    headers: new Headers({ "x-real-ip": ip }),
    session: null as { user?: { id?: string } } | null,
  };
});

vi.mock("next/headers", () => ({
  headers: async () => requestContext.headers,
  cookies: async () => ({
    get: (name: string) => {
      const value = requestContext.cookies.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => {
      requestContext.cookies.set(name, value);
    },
  }),
}));

// Mocked so a test can switch between "anonymous visitor" and "logged-in
// reader" without booting the whole NextAuth configuration.
vi.mock("next-auth", () => ({
  getServerSession: async () => requestContext.session,
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

import { prisma } from "@romulo/database";
import { VIEWS_BUFFER_KEY } from "@romulo/queues";
// A conexao saiu do pacote de filas para portfolio/lib/redis.ts.
import { getRedis } from "@/lib/redis";
import {
  cleanupIntegrationFixtures,
  createPublishedPost,
  createTestUser,
} from "../../../testing/integration/fixtures";
import {
  invalidatePostIdsCache,
  registerPostView,
} from "../../lib/views-internal";
import { flushViewsBuffer } from "../../../worker/workers/views.worker";

const POST_IDS_KEY = "posts:published:ids";
const GOOGLEBOT_UA =
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

async function cleanupRedis() {
  const redis = getRedis();
  await redis.del(
    VIEWS_BUFFER_KEY,
    POST_IDS_KEY,
    `views:ip:${requestContext.ip}`,
  );

  const capKeys = await redis.keys("views:cap:*");
  if (capKeys.length > 0) {
    await redis.del(...capKeys);
  }
}

describe("canonical view recording integration", () => {
  beforeEach(async () => {
    requestContext.cookies.clear();
    requestContext.session = null;
    requestContext.headers = new Headers({ "x-real-ip": requestContext.ip });

    // `postExists` caches the ids of every published post for 5 minutes. A set
    // left over from an earlier test would not contain the post created below,
    // and every view would be rejected as `invalid_post`.
    await invalidatePostIdsCache();
  });

  afterEach(async () => {
    await cleanupRedis();
    await cleanupIntegrationFixtures();
  });

  afterAll(async () => {
    await getRedis().quit();
  });

  it("counts every load and persists via the worker flush path", async () => {
    const redis = getRedis();

    const author = await createTestUser();
    const post = await createPublishedPost(author.id);

    // Same reader, same post, back to back: page views, not sessions, so both
    // loads count.
    await expect(registerPostView(post.id)).resolves.toEqual({ counted: true });
    await expect(registerPostView(post.id)).resolves.toEqual({ counted: true });

    expect(await redis.hget(VIEWS_BUFFER_KEY, post.id)).toBe("2");

    await flushViewsBuffer(redis);

    const refreshed = await prisma.post.findUnique({
      where: { id: post.id },
      select: { views: true },
    });

    expect(refreshed?.views).toBe(2);
    expect(await redis.hget(VIEWS_BUFFER_KEY, post.id)).toBeNull();
  });

  it("caps one reader at 20 views of the same post per hour", async () => {
    const redis = getRedis();

    const author = await createTestUser();
    const reader = await createTestUser();
    const post = await createPublishedPost(author.id);

    requestContext.session = { user: { id: reader.id } };

    for (let i = 0; i < 20; i++) {
      await expect(registerPostView(post.id)).resolves.toEqual({ counted: true });
    }

    await expect(registerPostView(post.id)).resolves.toEqual({
      counted: false,
      reason: "capped",
    });

    expect(await redis.hget(VIEWS_BUFFER_KEY, post.id)).toBe("20");
    expect(await redis.exists(`views:cap:reader:${post.id}:${reader.id}`)).toBe(1);
    // The identity came from the session, so no visitor cookie was issued.
    expect(requestContext.cookies.size).toBe(0);
  });

  it("caps one IP on the same post even when the reader cookie keeps changing", async () => {
    const redis = getRedis();

    const author = await createTestUser();
    const post = await createPublishedPost(author.id);

    // Stand-in for 120 earlier views from this IP. Driving 120 real calls
    // would trip the 60/min per-IP limit first.
    await redis.set(`views:cap:ip:${post.id}:${requestContext.ip}`, "120", "EX", 3600);

    // No cookie: to the server this is a reader it has never seen.
    await expect(registerPostView(post.id)).resolves.toEqual({
      counted: false,
      reason: "capped",
    });

    expect(await redis.hget(VIEWS_BUFFER_KEY, post.id)).toBeNull();
  });

  it("ignores crawlers that announce themselves", async () => {
    const redis = getRedis();

    const author = await createTestUser();
    const post = await createPublishedPost(author.id);

    requestContext.headers.set("user-agent", GOOGLEBOT_UA);

    await expect(registerPostView(post.id)).resolves.toEqual({
      counted: false,
      reason: "crawler",
    });

    expect(await redis.hlen(VIEWS_BUFFER_KEY)).toBe(0);
  });

  it("refuses an id that is not a post id, without touching redis", async () => {
    const redis = getRedis();

    await expect(registerPostView("not-a-post-id")).resolves.toEqual({
      counted: false,
      reason: "invalid_post",
    });

    expect(await redis.hlen(VIEWS_BUFFER_KEY)).toBe(0);
  });

  it("flush keeps the other posts' counts when a buffered post was deleted", async () => {
    const redis = getRedis();

    const author = await createTestUser();
    const post = await createPublishedPost(author.id);

    await redis.hset(VIEWS_BUFFER_KEY, {
      [post.id]: "3",
      // A well-formed cuid with no row behind it: the post was deleted after
      // its views were buffered.
      cdeletedpost0000000000000: "5",
    });

    await flushViewsBuffer(redis);

    const refreshed = await prisma.post.findUnique({
      where: { id: post.id },
      select: { views: true },
    });

    expect(refreshed?.views).toBe(3);
    expect(await redis.hlen(VIEWS_BUFFER_KEY)).toBe(0);
  });
});
