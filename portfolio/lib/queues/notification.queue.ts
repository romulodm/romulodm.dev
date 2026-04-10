import {
    createRedisConnection,
    createQueue,
    notificationJobOptions,
    QUEUE_NOTIFICATIONS,
    type NotificationJob,
} from "@romulo/queues";

const redis = createRedisConnection();

export const notificationQueue = createQueue<NotificationJob>(QUEUE_NOTIFICATIONS, redis, {
    defaultJobOptions: notificationJobOptions,
});

export type { NotificationJob };
