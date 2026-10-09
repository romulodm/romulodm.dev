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

/**
 * Sends the daily summary now, on top of the 08:00 schedule (/resumo on
 * Telegram).
 *
 * `enqueueNotification` cannot be used for this. `buildNotificationJobId` gives
 * "daily-status" a fixed id, and `notificationJobOptions` keeps completed jobs
 * around, so the second manual request would hit an existing id and BullMQ
 * would drop it without an error. The timestamp makes every request a new job,
 * the same reasoning as the "contact-flood" id.
 */
export async function enqueueDailyStatusNow() {
    const job: NotificationJob = { type: "daily-status" };
    return getNotificationQueue().add(job.type, job, {
        ...notificationJobOptions,
        jobId: `notification:daily-status-manual:${Date.now()}`,
    });
}
