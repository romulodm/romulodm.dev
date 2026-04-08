// apps/worker/src/workers/notification.worker.ts  (ATUALIZADO)
//
// Adiciona o case "flush-views" ao switch existente.

import { Worker } from "bullmq";

import {
  createRedisConnection,
  createQueue,
  QUEUE_NOTIFICATIONS,
  DAILY_STATUS_JOB_NAME,
  FLUSH_VIEWS_JOB_NAME,
  type NotificationJob,
} from "@romulo/queues";

import { notifyComment, sendDailyStatus } from "../lib/whatsapp";
import { flushViewsBuffer } from "./views.worker";

const redis = createRedisConnection();

export const notificationWorker = new Worker<NotificationJob>(
  QUEUE_NOTIFICATIONS,
  async (job) => {
    console.log(`[NotificationWorker] Processing: ${job.data.type} (id: ${job.id})`);

    switch (job.data.type) {
      case "comment":
        await notifyComment(job.data);
        break;

      case "daily-status":
        await sendDailyStatus();
        break;

      // ── Novo ────────────────────────────────────────────────────────────
      case "flush-views":
        await flushViewsBuffer(redis);
        break;

      default:
        throw new Error(`Unknown notification job type: ${(job.data as any).type}`);
    }

    console.log(`[NotificationWorker] Done: ${job.id}`);
  },
  { connection: redis, concurrency: 1 },
);

const notificationQueue = createQueue<NotificationJob>(QUEUE_NOTIFICATIONS, redis, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2_000 },
    removeOnComplete: { age: 24 * 3600, count: 1_000 },
    removeOnFail: { age: 7 * 24 * 3600 },
  },
});

export async function scheduleDailyStatus(): Promise<void> {
  const repeatableJobs = await notificationQueue.getRepeatableJobs();
  const alreadyScheduled = repeatableJobs.some((j) => j.name === DAILY_STATUS_JOB_NAME);

  if (alreadyScheduled) {
    console.log("[NotificationWorker] Daily-status cron already scheduled — skipping.");
    return;
  }

  await notificationQueue.add(
    DAILY_STATUS_JOB_NAME,
    { type: "daily-status" },
    {
      repeat: {
        pattern: "0 8 * * *",
        tz: "America/Sao_Paulo",
      },
    },
  );

  console.log("[NotificationWorker] Daily-status cron scheduled at 08:00 BRT ✅");
}

// ─── apps/worker/src/main.ts  (trecho a adicionar) ───────────────────────────
//
// import { scheduleViewsFlush } from "./workers/views.worker";
//
// async function main() {
//   ...
//   await scheduleDailyStatus();
//   await scheduleViewsFlush();        // ← adicione esta linha
//   ...
//   console.log("    • views flush   (a cada 60 s)");
// }