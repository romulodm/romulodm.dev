import "./env";

import { redis } from "./lib/redis";
import { prisma } from "@romulo/database";
import { emailService } from "./lib/email/email.service";

import { transactionalWorker, campaignWorker } from "./workers/email.worker";
import {
  notificationWorker,
  scheduleDailyStatus,
} from "./workers/notification.worker";

async function main() {
  console.log("[Worker] Worker Service starting…");

  await emailService.verify().catch((err) => {
    console.warn("[Startup] SMTP verification failed (continuing anyway):", err);
  });

  await scheduleDailyStatus();

  attachLogger(transactionalWorker, "email:transactional");
  attachLogger(campaignWorker, "email:campaign");
  attachLogger(notificationWorker, "notification");

  console.log("[Worker] Workers running:");
  console.log("    • newsletter:transactional");
  console.log("    • newsletter:campaign");
  console.log("    • notifications  (comment + daily-status @ 08:00 BRT)");
}

function attachLogger(worker: { on: Function }, name: string) {
  worker.on("completed", (job: any) => {
    console.log(`[${name}] ✅ Job ${job.id} completed`);
  });
  worker.on("failed", (job: any, err: Error) => {
    console.error(`[${name}] ❌ Job ${job?.id} failed: ${err.message}`);
  });
  worker.on("error", (err: Error) => {
    console.error(`[${name}] Worker error:`, err);
  });
}

async function shutdown(signal: string): Promise<never> {
  console.log(`\n[Worker] ${signal} received — shutting down gracefully…`);

  await Promise.allSettled([
    transactionalWorker.close(),
    campaignWorker.close(),
    notificationWorker.close(),
  ]);

  await prisma.$disconnect();
  redis.disconnect();

  console.log("[Worker] Shutdown complete.");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

setInterval(() => {
  console.log(`[Worker] 💓 ${new Date().toISOString()}`);
}, 30_000);

main().catch((err) => {
  console.error("[Worker] Fatal startup error:", err);
  process.exit(1);
});