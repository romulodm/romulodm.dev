import { afterEach, describe, expect, it } from "vitest";

import { prisma } from "@romulo/database";
import {
  createQueue,
  FLUSH_VIEWS_JOB_NAME,
  QUEUE_NOTIFICATIONS,
  VIEWS_BUFFER_KEY,
  type NotificationJob,
} from "@romulo/queues";
// A conexao saiu do pacote de filas: o worker usa o singleton de lib/redis.
import { redis } from "../../lib/redis";
import {
  cleanupIntegrationFixtures,
  createPublishedPost,
  createTestUser,
} from "../../../testing/integration/fixtures";
import { flushViewsBuffer, scheduleViewsFlush } from "../../workers/views.worker";

describe("views worker integration", () => {
  afterEach(async () => {
    await redis.del(VIEWS_BUFFER_KEY);
    await cleanupIntegrationFixtures();
  });

  it("flushes buffered views from redis into postgres", async () => {

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
    const queue = createQueue<NotificationJob>(QUEUE_NOTIFICATIONS, redis);

    await scheduleViewsFlush(redis);

    const repeatJobs = await queue.getRepeatableJobs();
    expect(repeatJobs.some((job) => job.name === FLUSH_VIEWS_JOB_NAME)).toBe(true);

    await queue.close();
    await redis.quit();
  });
});
