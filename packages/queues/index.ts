import { Queue, type QueueOptions } from "bullmq";
import IORedis from "ioredis";

// ── Conexão ──────────────────────────────────────────────────────────────────

export function createRedisConnection(): IORedis {
    return new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
    });
}

// ── Nomes das filas ───────────────────────────────────────────────────────────

export const QUEUE_TRANSACTIONAL = "newsletter-transactional";
export const QUEUE_CAMPAIGN = "newsletter-campaign";
export const QUEUE_NOTIFICATIONS = "notifications";
export const DAILY_STATUS_JOB_NAME = "daily-status-cron";

// ── Tipos de job ─────────────────────────────────────────────────────────────

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
    | { type: "comment"; author: string; postTitle: string; postSlug: string }
    | { type: "daily-status" };

// ── Opções padrão ─────────────────────────────────────────────────────────────

export const defaultJobOptions: QueueOptions["defaultJobOptions"] = {
    attempts: 5,
    backoff: { type: "exponential", delay: 2_000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
};

// ── Factory de fila ───────────────────────────────────────────────────────────
// Cada serviço cria suas próprias instâncias — nunca compartilha objetos Queue.

export function createQueue<T>(
    name: string,
    connection: IORedis,
    opts?: Partial<QueueOptions>,
): Queue<T> {
    return new Queue<T>(name, {
        connection,
        defaultJobOptions,
        ...opts,
    });
}