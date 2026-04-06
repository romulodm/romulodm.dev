import { createRedisConnection, createQueue, QUEUE_NOTIFICATIONS, type NotificationJob } from "@romulo/queues";

const redis = createRedisConnection();

export const notificationQueue = createQueue<NotificationJob>(QUEUE_NOTIFICATIONS, redis, {
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { age: 24 * 3600, count: 1000 },
        removeOnFail: { age: 7 * 24 * 3600 },
    },
});

export type { NotificationJob };