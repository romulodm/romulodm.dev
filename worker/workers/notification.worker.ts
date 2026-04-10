/**
 * notification.worker.ts
 *
 * Handles all jobs on the QUEUE_NOTIFICATIONS queue. Currently three job types
 * are supported:
 *
 *   "comment"      — Sends a WhatsApp notification when a new comment is posted.
 *   "daily-status" — Sends a daily blog stats summary via WhatsApp at 08:00 BRT.
 *                    Scheduled as a repeatable cron job via `scheduleDailyStatus`.
 *   "flush-views"  — Drains the Redis view-count buffer into Postgres.
 *                    Scheduled as a repeatable interval job via `scheduleViewsFlush`
 *                    (in views.worker.ts). The actual flush logic lives in
 *                    `flushViewsBuffer` (views.worker.ts) and is called here
 *                    because this worker owns the queue processor.
 *
 * Like the other workers, nothing is instantiated at module level.
 * Call `startNotificationWorker(redis)` and `scheduleDailyStatus(redis)`
 * explicitly from index.ts after all imports have resolved.
 */

import { Worker } from "bullmq";
import type { Redis } from "ioredis";

import {
  buildNotificationJobId,
  createQueue,
  DAILY_STATUS_JOB_NAME,
  notificationJobOptions,
  queueRuntimeConfig,
  QUEUE_NOTIFICATIONS,
  type NotificationJob,
} from "@romulo/queues";

import { notifyComment, sendDailyStatus } from "../lib/whatsapp";
import { flushViewsBuffer } from "./views.worker";

// ── Worker factory ────────────────────────────────────────────────────────────

/**
 * Creates and returns the notification BullMQ worker.
 *
 * The worker processes one job type at a time (concurrency is typically 1
 * for notifications to avoid duplicate WhatsApp messages). It receives the
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
        // Fired when a reader posts a comment — triggers a WhatsApp alert
        case "comment":
          await notifyComment(job.data);
          break;

        // Fired by the daily cron at 08:00 BRT — sends blog stats via WhatsApp
        case "daily-status":
          await sendDailyStatus();
          break;

        // Fired by the views-flush repeatable job — drains Redis view counters
        // into Postgres in batches. Logic lives in views.worker.ts.
        case "flush-views":
          await flushViewsBuffer(redis);
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
      // Low concurrency is intentional: WhatsApp notifications must not be
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

  const repeatableJobs = await notificationQueue.getRepeatableJobs();
  const alreadyScheduled = repeatableJobs.some((j) => j.name === DAILY_STATUS_JOB_NAME);

  if (alreadyScheduled) {
    console.log("[NotificationWorker] Daily-status cron already registered — skipping.");
    await notificationQueue.close();
    return;
  }

  await notificationQueue.add(
    DAILY_STATUS_JOB_NAME,
    { type: "daily-status" },
    {
      ...notificationJobOptions,
      jobId: buildNotificationJobId({ type: "daily-status" }),
      repeat: {
        pattern: "0 8 * * *", // Every day at 08:00
        tz: "America/Sao_Paulo",
      },
    },
  );

  await notificationQueue.close();
  console.log("[NotificationWorker] Daily-status cron registered at 08:00 BRT.");
}