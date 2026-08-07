import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { prisma } from "@romulo/database";
import { VIEWS_BUFFER_KEY } from "@romulo/queues";
// A conexao saiu do pacote de filas para portfolio/lib/redis.ts.
import { getRedis } from "@/lib/redis";
import {
  cleanupIntegrationFixtures,
  createPublishedPost,
  createTestUser,
} from "../../../testing/integration/fixtures";
import { recordPostViewByIdentifier } from "../../lib/views";
import { flushViewsBuffer } from "../../../worker/workers/views.worker";

async function cleanupRedis() {
  const redis = getRedis();
  await redis.del(VIEWS_BUFFER_KEY);

  const cooldownKeys = await redis.keys("view:cooldown:*");
  if (cooldownKeys.length > 0) {
    await redis.del(...cooldownKeys);
  }
}

describe("canonical view recording integration", () => {
  afterEach(async () => {
    await cleanupRedis();
    await cleanupIntegrationFixtures();
  });

  it("buffers through the shared redis key and persists via the worker flush path", async () => {
    const redis = getRedis();

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
