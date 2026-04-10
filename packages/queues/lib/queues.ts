import { createHash } from "node:crypto";

import { Queue, type JobsOptions, type QueueOptions } from "bullmq";
import type { Redis } from "ioredis";

export const QUEUE_TRANSACTIONAL = "newsletter-transactional";
export const QUEUE_CAMPAIGN = "newsletter-campaign";
export const QUEUE_NOTIFICATIONS = "notifications";
export const DAILY_STATUS_JOB_NAME = "daily-status-cron";

// ── Views ────────────────────────────────────────────────────────────────────
export const VIEWS_BUFFER_KEY = "views:buffer";
export const FLUSH_VIEWS_JOB_NAME = "flush-views-cron";

function readPositiveIntegerEnv(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) return fallback;

    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const queueRuntimeConfig = {
    transactionalWorkerConcurrency: readPositiveIntegerEnv("WORKER_TRANSACTIONAL_CONCURRENCY", 8),
    campaignWorkerConcurrency: readPositiveIntegerEnv("WORKER_CAMPAIGN_CONCURRENCY", 12),
    campaignRateLimitMax: readPositiveIntegerEnv("WORKER_CAMPAIGN_RATE_LIMIT_MAX", 20),
    campaignRateLimitDurationMs: readPositiveIntegerEnv("WORKER_CAMPAIGN_RATE_LIMIT_DURATION_MS", 1_000),
    notificationWorkerConcurrency: readPositiveIntegerEnv("WORKER_NOTIFICATION_CONCURRENCY", 1),
    viewsFlushBatchSize: readPositiveIntegerEnv("WORKER_VIEWS_FLUSH_BATCH_SIZE", 100),
    viewsFlushIntervalMs: readPositiveIntegerEnv("WORKER_VIEWS_FLUSH_INTERVAL_MS", 120_000),
} as const;

export type TransactionalEmailJob =
    | { type: "CONFIRMATION"; email: string; confirmationUrl: string }
    | { type: "WELCOME"; email: string; unsubscribeUrl: string }
    | { type: "UNSUBSCRIBE_CONFIRM"; email: string; unsubscribeUrl: string }
    | { type: "PASSWORD_RESET"; email: string; code: string; expiresInMinutes?: number };

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
    | { type: "daily-status" }
    | { type: "flush-views" };  // ← novo

export const defaultJobOptions: QueueOptions["defaultJobOptions"] = {
    attempts: 5,
    backoff: { type: "exponential", delay: 2_000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
};

export const transactionalEmailJobOptions: JobsOptions = {
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
    priority: 1,
};

export const campaignEmailJobOptions: JobsOptions = {
    attempts: 3,
    backoff: { type: "exponential", delay: 30_000 },
    removeOnComplete: { count: 2_000 },
    removeOnFail: { age: 7 * 24 * 3600, count: 500 },
};

export const notificationJobOptions: JobsOptions = {
    attempts: 3,
    backoff: { type: "exponential", delay: 2_000 },
    removeOnComplete: { age: 24 * 3600, count: 1_000 },
    removeOnFail: { age: 7 * 24 * 3600 },
};

function buildStableSuffix(parts: Array<string | number | undefined | null>): string {
    return createHash("sha256")
        .update(parts.map((part) => String(part ?? "")).join("|"))
        .digest("hex")
        .slice(0, 24);
}

export function buildTransactionalJobId(job: TransactionalEmailJob): string {
    switch (job.type) {
        case "CONFIRMATION":
            return `txn:confirmation:${buildStableSuffix([job.email, job.confirmationUrl])}`;
        case "WELCOME":
            return `txn:welcome:${buildStableSuffix([job.email, job.unsubscribeUrl])}`;
        case "UNSUBSCRIBE_CONFIRM":
            return `txn:unsubscribe:${buildStableSuffix([job.email, job.unsubscribeUrl])}`;
        case "PASSWORD_RESET":
            return `txn:password-reset:${buildStableSuffix([job.email, job.code])}`;
        default:
            return `txn:unknown:${buildStableSuffix([JSON.stringify(job)])}`;
    }
}

export function buildCampaignJobId(job: CampaignEmailJob): string {
    return `campaign:${job.campaignId}:${job.recipientId}`;
}

export function buildNotificationJobId(job: NotificationJob): string {
    switch (job.type) {
        case "comment":
            return `notification:comment:${job.id}`;
        case "daily-status":
            return `notification:${DAILY_STATUS_JOB_NAME}`;
        case "flush-views":
            return `notification:${FLUSH_VIEWS_JOB_NAME}`;
        default:
            return `notification:${buildStableSuffix([JSON.stringify(job)])}`;
    }
}

export function buildEmailMessageId(scope: string, identity: string): string {
    return `<${scope}.${buildStableSuffix([identity])}@worker.romulodm.local>`;
}

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
