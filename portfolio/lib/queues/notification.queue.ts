import {
    buildNotificationJobId,
    createQueue,
    notificationJobOptions,
    QUEUE_NOTIFICATIONS,
    type NotificationJob,
} from "@romulo/queues";
import type { Queue } from "bullmq";
import { getRedis } from "../redis";

export type { NotificationJob };

let _notificationQueue: Queue<NotificationJob> | null = null;

function getNotificationQueue(): Queue<NotificationJob> {
    return (_notificationQueue ??= createQueue<NotificationJob>(
        QUEUE_NOTIFICATIONS,
        getRedis(),
        { defaultJobOptions: notificationJobOptions },
    ));
}

export async function enqueueNotification(job: NotificationJob) {
    return getNotificationQueue().add(job.type, job, {
        ...notificationJobOptions,
        jobId: buildNotificationJobId(job),
    });
}