/**
 * notification.worker.ts
 *
 * Handles all jobs on the QUEUE_NOTIFICATIONS queue. The name is historical:
 * only three of these job types end in a message. The rest are periodic work
 * that rides the same queue because this worker already owns its processor.
 *
 * Delivery is Telegram, not WhatsApp — the WhatsApp path was replaced and the
 * docs here had not caught up.
 *
 *   "comment"              — Telegram alert when a reader posts a comment.
 *   "contact"              — Telegram alert for a new contact-form message.
 *   "contact-flood"        — One-off warning that the hourly cap was reached.
 *   "daily-status"         — Previous day's blog stats at 08:00 BRT.
 *                            Repeatable, via `scheduleDailyStatus` below.
 *   "flush-views"          — Drains the Redis view-count buffer into Postgres.
 *                            Repeatable, via `scheduleViewsFlush` (views.worker.ts);
 *                            the logic lives in `flushViewsBuffer` there.
 *   "retry-onchain"        — Retries pending on-chain donations.
 *   "reconcile-donations"  — Safety net for a PIX/Stripe webhook that never arrived.
 *   "audit-donations"      — Previous day's two-way settlement check.
 *   "retry-transactional-email" — Retries transactional email jobs still failed after
 *                            the BullMQ retry burst. Repeatable, via
 *                            `scheduleTransactionalEmailSweep` (email.worker.ts).
 *
 * Like the other workers, nothing is instantiated at module level.
 * Call `startNotificationWorker(redis)` and `scheduleDailyStatus(redis)`
 * explicitly from index.ts after all imports have resolved.
 */

import { Worker } from "bullmq";
import type { Redis } from "ioredis";

import {
  registerRepeatable,
  createQueue,
  DAILY_STATUS_JOB_NAME,
  notificationJobOptions,
  queueRuntimeConfig,
  QUEUE_NOTIFICATIONS,
  type NotificationJob,
} from "@romulo/queues";

import {
  notifyComment,
  notifyContact,
  notifyContactFlood,
  sendDailyStatus,
} from "../lib/telegram";
import { flushViewsBuffer } from "./views.worker";
import { retryPendingOnchain } from "./onchain.worker";
import { auditDonations, reconcilePendingDonations } from "./donations.worker";
import { sweepFailedTransactionalEmails } from "./email.worker";

// ── Worker factory ────────────────────────────────────────────────────────────

/**
 * Creates and returns the notification BullMQ worker.
 *
 * The worker processes one job type at a time (concurrency is typically 1
 * for notifications to avoid duplicate Telegram messages). It receives the
 * shared `redis` connection from the caller so the app controls its lifecycle.
 *
 * @param redis - Shared ioredis connection from index.ts.
 */
export function startNotificationWorker(redis: Redis) {
  const notificationWorker = new Worker<NotificationJob>(
    QUEUE_NOTIFICATIONS,
    async (job) => {
      console.log(`[NotificationWorker] Processing: ${job.data.type} (id: ${job.id})`);

      switch (job.data.type) {
        // Fired when a reader posts a comment — triggers a Telegram alert
        case "comment":
          await notifyComment(job.data);
          break;

        // Fired by the daily cron at 08:00 BRT — sends the previous day's stats
        case "daily-status":
          await sendDailyStatus();
          break;

        // Fired by the views-flush repeatable job — drains Redis view counters
        // into Postgres in batches. Logic lives in views.worker.ts.
        case "flush-views":
          await flushViewsBuffer(redis);
          break;

        /*
         * Este case estava faltando. `scheduleOnchainRetry` registra o job a
         * cada 5 min desde que foi escrito, mas sem um case aqui ele caia no
         * `default`, lancava "Unknown job type", esgotava as 3 tentativas e ia
         * para a fila de falhas. Ou seja: a reconciliacao on-chain nunca rodou.
         */
        case "retry-onchain":
          await retryPendingOnchain();
          break;

        // Reconciliacao PIX/Stripe — rede de seguranca para webhook perdido.
        case "reconcile-donations":
          await reconcilePendingDonations();
          break;

        // Conciliacao contabil do dia anterior, nos dois sentidos.
        case "audit-donations":
          await auditDonations();
          break;

        // Rede de seguranca do email transacional: tenta de novo os jobs que
        // ja esgotaram os 3 retries do BullMQ mas ainda estao dentro da
        // janela do sweep. Ver sweepFailedTransactionalEmails em email.worker.ts.
        case "retry-transactional-email":
          await sweepFailedTransactionalEmails(redis);
          break;

        // Mensagem nova no formulario de contato. A mensagem ja esta no
        // Postgres quando este job roda — a notificacao e conveniencia, e
        // falhar aqui nunca perde o contato.
        case "contact":
          await notifyContact(job.data);
          break;

        // O teto global por hora foi atingido: ou e ataque, ou algo seu
        // viralizou. Nos dois casos voce quer saber, e uma vez so.
        case "contact-flood":
          await notifyContactFlood(job.data);
          break;

        default:
          throw new Error(
            `[NotificationWorker] Unknown job type: ${(job.data as { type: string }).type}`,
          );
      }

      console.log(`[NotificationWorker] Done: ${job.id}`);
    },
    {
      connection: redis,
      // Low concurrency is intentional: Telegram notifications must not be
      // sent in parallel to avoid rate limits and duplicate messages.
      concurrency: queueRuntimeConfig.notificationWorkerConcurrency,
    },
  );

  return notificationWorker;
}

// ── Daily-status cron scheduling ──────────────────────────────────────────────

/**
 * Registers a BullMQ repeatable cron job that fires `daily-status` every day
 * at 08:00 BRT (America/Sao_Paulo).
 *
 * Idempotent: if the job is already registered (e.g. from a previous process
 * start), it skips re-registration to avoid accumulating duplicate cron entries.
 *
 * The queue is kept open after scheduling because it is reused by the worker
 * itself at runtime — unlike the scheduling queue in views.worker.ts which is
 * closed immediately after use.
 *
 * @param redis - Shared ioredis connection from index.ts.
 */
export async function scheduleDailyStatus(redis: Redis): Promise<void> {
  const notificationQueue = createQueue<NotificationJob>(QUEUE_NOTIFICATIONS, redis, {
    defaultJobOptions: notificationJobOptions,
  });

  try {
    const result = await registerRepeatable(notificationQueue, {
      name: DAILY_STATUS_JOB_NAME,
      data: { type: "daily-status" },
      repeat: {
        pattern: "0 8 * * *", // Every day at 08:00
        tz: "America/Sao_Paulo",
      },
      jobOptions: notificationJobOptions,
    });

    console.log(
      `[NotificationWorker] Daily-status cron at 08:00 BRT — ${result.action}.`,
    );
  } finally {
    await notificationQueue.close();
  }
}