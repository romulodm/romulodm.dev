import { afterEach, describe, expect, it } from "vitest";

import { prisma } from "@romulo/database";
import {
  createRedisConnection,
  createQueue,
  FLUSH_VIEWS_JOB_NAME,
  QUEUE_NOTIFICATIONS,
  VIEWS_BUFFER_KEY,
  type NotificationJob,
} from "@romulo/queues";
import {
  cleanupIntegrationFixtures,
  createPublishedPost,
  createTestUser,
} from "../../../testing/integration/fixtures";
import { flushViewsBuffer, scheduleViewsFlush } from "../../workers/views.worker";

describe("views worker integration", () => {
  afterEach(async () => {
    const redis = createRedisConnection();

    await redis.connect().catch(() => undefined);
    await redis.del(VIEWS_BUFFER_KEY);
    await redis.quit().catch(() => undefined);
    await cleanupIntegrationFixtures();
  });

  it("flushes buffered views from redis into postgres", async () => {
    const redis = createRedisConnection();
    await redis.connect();

    const author = await createTestUser();
    const post = await createPublishedPost(author.id);

    await redis.hset(VIEWS_BUFFER_KEY, post.id, "4");
    await flushViewsBuffer(redis);

    const refreshed = await prisma.post.findUnique({
      where: { id: post.id },
      select: { views: true },
    });

    expect(refreshed?.views).toBe(4);
    expect(await redis.hget(VIEWS_BUFFER_KEY, post.id)).toBeNull();

    await redis.quit();
  });

  it("registers the repeatable flush job in BullMQ", async () => {
    const redis = createRedisConnection();
    await redis.connect();
    const queue = createQueue<NotificationJob>(QUEUE_NOTIFICATIONS, redis);

    await scheduleViewsFlush(redis);

    const repeatJobs = await queue.getRepeatableJobs();
    expect(repeatJobs.some((job) => job.name === FLUSH_VIEWS_JOB_NAME)).toBe(true);

    await queue.close();
    await redis.quit();
  });
});
