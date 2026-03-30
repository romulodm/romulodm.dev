import { Queue, type QueueOptions } from "bullmq";
import type { Redis } from "ioredis";

export const QUEUE_TRANSACTIONAL = "newsletter-transactional";
export const QUEUE_CAMPAIGN = "newsletter-campaign";
export const QUEUE_NOTIFICATIONS = "notifications";
export const DAILY_STATUS_JOB_NAME = "daily-status-cron";

export type TransactionalEmailJob =
    | { type: "CONFIRMATION"; email: string; confirmationUrl: string }
    | { type: "WELCOME"; email: string; unsubscribeUrl: string }
    | { type: "UNSUBSCRIBE_CONFIRM"; email: string; unsubscribeUrl: string };

export interface CampaignEmailJob {
    campaignId: string;
    recipientId: string;
    trackingId: string;
    email: string;
    subject: string;
    content: string;
    unsubscribeUrl: string;
    trackingPixelUrl: string;
}

export type NotificationJob =
    | { type: "comment"; id: string; author: string; postTitle: string; postSlug: string }
    | { type: "daily-status" };

export const defaultJobOptions: QueueOptions["defaultJobOptions"] = {
    attempts: 5,
    backoff: { type: "exponential", delay: 2_000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
};

export function createQueue<T>(
    name: string,
    connection: Redis,
    opts?: Partial<QueueOptions>,
): Queue<T> {
    return new Queue<T>(name, {
        connection,
        defaultJobOptions,
        ...opts,
    });
}