import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { prisma } from "@romulo/database";
import { createRedisConnection, VIEWS_BUFFER_KEY } from "@romulo/queues";
import {
  cleanupIntegrationFixtures,
  createPublishedPost,
  createTestUser,
} from "../../../testing/integration/fixtures";
import { recordPostViewByIdentifier } from "../../lib/views";
import { flushViewsBuffer } from "../../../worker/workers/views.worker";

async function cleanupRedis() {
  const redis = createRedisConnection();

  await redis.connect().catch(() => undefined);
  await redis.del(VIEWS_BUFFER_KEY);

  const cooldownKeys = await redis.keys("view:cooldown:*");
  if (cooldownKeys.length > 0) {
    await redis.del(...cooldownKeys);
  }

  await redis.quit().catch(() => undefined);
}

describe("canonical view recording integration", () => {
  afterEach(async () => {
    await cleanupRedis();
    await cleanupIntegrationFixtures();
  });

  it("buffers through the shared redis key and persists via the worker flush path", async () => {
    const redis = createRedisConnection();
    await redis.connect();

    const author = await createTestUser();
    const post = await createPublishedPost(author.id);

    await expect(
      recordPostViewByIdentifier(post.id, `session:${post.id}`),
    ).resolves.toEqual({
      counted: true,
    });

    await expect(
      recordPostViewByIdentifier(post.id, `session:${post.id}`),
    ).resolves.toEqual({
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

    await redis.quit();
  });
});
