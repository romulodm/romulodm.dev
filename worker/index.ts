// src/index.ts
//
// Entrypoint for the worker service.
// Starts all BullMQ workers, schedules repeatable jobs, and handles
// SIGTERM/SIGINT for graceful shutdown (zero job loss).
//

import "./env";

import { redis } from "./lib/redis";
import { prisma } from "@romulo/database";
import { emailService } from "./lib/email/email.service";

import { transactionalWorker, campaignWorker } from "./workers/email.worker";
import {
  notificationWorker,
  scheduleDailyStatus,
} from "./workers/notification.worker";

// ── Startup ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("[Worker] Worker Service starting…");

  // Verify SMTP connection on startup
  await emailService.verify().catch((err) => {
    console.warn("[Startup] SMTP verification failed (continuing anyway):", err);
  });

  // Schedule the daily WhatsApp status report
  await scheduleDailyStatus();

  // Attach event loggers to all workers
  attachLogger(transactionalWorker, "email:transactional");
  attachLogger(campaignWorker, "email:campaign");
  attachLogger(notificationWorker, "notification");

  console.log("[Worker] Workers running:");
  console.log("    • newsletter:transactional");
  console.log("    • newsletter:campaign");
  console.log("    • notifications  (comment + daily-status @ 08:00 BRT)");
}

// ── Event logging ─────────────────────────────────────────────────────────────

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

// ── Graceful shutdown ─────────────────────────────────────────────────────────

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

// ── Heartbeat ─────────────────────────────────────────────────────────────────

setInterval(() => {
  console.log(`[Worker] 💓 ${new Date().toISOString()}`);
}, 30_000);

// ── Boot ──────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error("[Worker] Fatal startup error:", err);
  process.exit(1);
});
