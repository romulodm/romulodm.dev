import { afterEach, describe, expect, it } from "vitest";

import {
  createQueue,
  QUEUE_CAMPAIGN,
  QUEUE_NOTIFICATIONS,
  QUEUE_TRANSACTIONAL,
  type NotificationJob,
} from "@romulo/queues";
import { redis } from "../../lib/redis";
import {
  WORKER_HEALTH_KEY,
  captureWorkerHealthSnapshot,
  createFailureTracker,
  recordQueueFailure,
} from "../../lib/worker-observability";
import { scheduleDailyStatus } from "../../workers/notification.worker";
import { scheduleViewsFlush } from "../../workers/views.worker";

async function clearQueue(queueName: string) {
  const queue = createQueue(queueName, redis);
  await queue.drain(true);

  const repeatableJobs = await queue.getRepeatableJobs();
  await Promise.all(repeatableJobs.map((job) => queue.removeRepeatableByKey(job.key)));

  await queue.close();
}

describe("worker observability", () => {
  afterEach(async () => {
    await redis.del(WORKER_HEALTH_KEY);
    await clearQueue(QUEUE_TRANSACTIONAL);
    await clearQueue(QUEUE_CAMPAIGN);
    await clearQueue(QUEUE_NOTIFICATIONS);
  });

  it("surfaces degraded queue health when failures accumulate and repeatable jobs are missing", async () => {
    const failureTracker = createFailureTracker();
    const notificationQueue = createQueue<NotificationJob>(QUEUE_NOTIFICATIONS, redis);

    recordQueueFailure(failureTracker, QUEUE_NOTIFICATIONS, "job-1", new Error("boom-1"));
    recordQueueFailure(failureTracker, QUEUE_NOTIFICATIONS, "job-2", new Error("boom-2"));
    recordQueueFailure(failureTracker, QUEUE_NOTIFICATIONS, "job-3", new Error("boom-3"));

    const snapshot = await captureWorkerHealthSnapshot(
      { [QUEUE_NOTIFICATIONS]: notificationQueue },
      redis,
      failureTracker,
    );
    const persisted = await redis.get(WORKER_HEALTH_KEY);

    expect(snapshot.status).toBe("degraded");
    expect(snapshot.queues[0]).toMatchObject({
      queue: QUEUE_NOTIFICATIONS,
      status: "degraded",
      recentFailures: 3,
    });
    expect(Array.isArray(snapshot.queues[0].missingRepeatableJobs)).toBe(true);
    expect(persisted).toContain("\"status\":\"degraded\"");

    await notificationQueue.close();
  });

  it("persists a healthy snapshot once repeatable worker jobs are scheduled", async () => {
    const failureTracker = createFailureTracker();
    const queues = {
      [QUEUE_TRANSACTIONAL]: createQueue(QUEUE_TRANSACTIONAL, redis),
      [QUEUE_CAMPAIGN]: createQueue(QUEUE_CAMPAIGN, redis),
      [QUEUE_NOTIFICATIONS]: createQueue<NotificationJob>(QUEUE_NOTIFICATIONS, redis),
    };

    await scheduleDailyStatus(redis);
    await scheduleViewsFlush(redis);

    const snapshot = await captureWorkerHealthSnapshot(queues, redis, failureTracker);

    expect(snapshot.status).toBe("healthy");
    expect(snapshot.queues.every((queue) => queue.status === "healthy")).toBe(true);

    await Promise.all(Object.values(queues).map((queue) => queue.close()));
  });
});
