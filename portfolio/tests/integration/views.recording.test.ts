import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `registerPostView` resolves the visitor identity by itself — that is the
 * whole point of the change that removed `recordPostViewByIdentifier` (see the
 * security note at the top of `lib/views.ts`). The test therefore cannot pass
 * an identifier in; it has to provide a request context instead.
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
    // between calls: without it every call looks like a brand new visitor and
    // the cooldown never triggers.
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

async function cleanupRedis() {
  const redis = getRedis();
  await redis.del(
    VIEWS_BUFFER_KEY,
    POST_IDS_KEY,
    `views:ip:${requestContext.ip}`,
  );

  const cooldownKeys = await redis.keys("view:cooldown:*");
  if (cooldownKeys.length > 0) {
    await redis.del(...cooldownKeys);
  }
}

describe("canonical view recording integration", () => {
  beforeEach(async () => {
    requestContext.cookies.clear();
    requestContext.session = null;

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

  it("buffers through the shared redis key and persists via the worker flush path", async () => {
    const redis = getRedis();

    const author = await createTestUser();
    const post = await createPublishedPost(author.id);

    await expect(registerPostView(post.id)).resolves.toEqual({
      counted: true,
    });

    // Same visitor cookie, same post, inside the 30-minute window: the SET NX
    // finds the cooldown key already there.
    await expect(registerPostView(post.id)).resolves.toEqual({
      counted: false,
      reason: "cooldown",
    });

    expect(await redis.hget(VIEWS_BUFFER_KEY, post.id)).toBe("1");

    await flushViewsBuffer(redis);

    const refreshed = await prisma.post.findUnique({
      where: { id: post.id },
      select: { views: true },
    });

    expect(refreshed?.views).toBe(1);
    expect(await redis.hget(VIEWS_BUFFER_KEY, post.id)).toBeNull();
  });

  it("keys the cooldown on the session user when the reader is logged in", async () => {
    const redis = getRedis();

    const author = await createTestUser();
    const reader = await createTestUser();
    const post = await createPublishedPost(author.id);

    requestContext.session = { user: { id: reader.id } };

    await expect(registerPostView(post.id)).resolves.toEqual({
      counted: true,
    });
    await expect(registerPostView(post.id)).resolves.toEqual({
      counted: false,
      reason: "cooldown",
    });

    expect(await redis.exists(`view:cooldown:${post.id}:${reader.id}`)).toBe(1);
    // The identity came from the session, so no visitor cookie was issued.
    expect(requestContext.cookies.size).toBe(0);
  });

  it("refuses an id that is not a post id, without touching redis", async () => {
    const redis = getRedis();

    await expect(registerPostView("not-a-post-id")).resolves.toEqual({
      counted: false,
      reason: "invalid_post",
    });

    expect(await redis.hlen(VIEWS_BUFFER_KEY)).toBe(0);
  });
});
