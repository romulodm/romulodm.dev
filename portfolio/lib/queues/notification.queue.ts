import {
    createQueue,
    notificationJobOptions,
    QUEUE_NOTIFICATIONS,
    type NotificationJob,
} from "@romulo/queues";
import { getRedis } from "../redis";

const redis = getRedis();

export const notificationQueue = createQueue<NotificationJob>(QUEUE_NOTIFICATIONS, redis, {
    defaultJobOptions: notificationJobOptions,
});

export type { NotificationJob };
