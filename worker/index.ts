/**
 * index.ts — Worker process entry point.
 *
 * Responsible for:
 *   1. Verifying external service connectivity (email SMTP).
 *   2. Instantiating all BullMQ workers by calling their factory functions.
 *   3. Registering repeatable cron/interval jobs (daily-status, views-flush).
 *   4. Attaching structured-log listeners to every worker.
 *   5. Starting the health monitor loop.
 *   6. Handling graceful shutdown on SIGTERM / SIGINT.
 *
 * Why factories instead of top-level exports?
 * Workers and queues must be created AFTER all modules have finished loading.
 * Instantiating them at module level causes circular-dependency crashes where
 * `queueRuntimeConfig` (from @romulo/queues) is still `undefined` at import time.
 * All worker files export factory functions; this file calls them once, here,
 * inside `main()`.
 */

import "./env";

import { createQueue, QUEUE_CAMPAIGN, QUEUE_NOTIFICATIONS, QUEUE_TRANSACTIONAL } from "@romulo/queues";
import { prisma } from "@romulo/database";
import type { Worker } from "bullmq";

import { emailService } from "./lib/email/email.service";
import { redis } from "./lib/redis";
import {
  createFailureTracker,
  logWorkerEvent,
  recordQueueFailure,
  startWorkerHealthMonitor,
} from "./lib/worker-observability";

// Factory functions — nothing is instantiated until called inside main()
import { startEmailWorkers } from "./workers/email.worker";
import { startNotificationWorker, scheduleDailyStatus } from "./workers/notification.worker";
import { scheduleViewsFlush } from "./workers/views.worker";

// ── Monitoring queues ─────────────────────────────────────────────────────────
// These queue instances are used only for health monitoring (job counts, lag).
// They are separate from the workers' internal connections.
const monitoringQueues = {
  [QUEUE_TRANSACTIONAL]: createQueue(QUEUE_TRANSACTIONAL, redis),
  [QUEUE_CAMPAIGN]: createQueue(QUEUE_CAMPAIGN, redis),
  [QUEUE_NOTIFICATIONS]: createQueue(QUEUE_NOTIFICATIONS, redis),
};

const failureTracker = createFailureTracker();
let healthMonitor: ReturnType<typeof startWorkerHealthMonitor> | null = null;

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  logWorkerEvent("info", "worker.starting");

  // Verify SMTP connectivity at startup — log a warning but don't abort if it fails,
  // since the worker can still process jobs when the connection recovers.
  await emailService.verify().catch((err) => {
    logWorkerEvent("warn", "worker.email_verify_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  });

  // Instantiate workers — must happen after all imports have resolved
  const { transactionalWorker, campaignWorker } = startEmailWorkers(redis);
  const notificationWorker = startNotificationWorker(redis);

  // Register repeatable jobs (idempotent — safe to call on every restart)
  await scheduleDailyStatus(redis);
  await scheduleViewsFlush(redis);

  // Attach structured logging to every worker
  attachLogger(transactionalWorker, QUEUE_TRANSACTIONAL);
  attachLogger(campaignWorker, QUEUE_CAMPAIGN);
  attachLogger(notificationWorker, QUEUE_NOTIFICATIONS);

  // Start the periodic health monitor (queue lag, failure rates, redis ping)
  healthMonitor = startWorkerHealthMonitor({
    queues: monitoringQueues,
    redis,
    failureTracker,
  });
  await healthMonitor.runCheck();

  logWorkerEvent("info", "worker.ready", {
    queues: Object.keys(monitoringQueues),
  });

  // ── Graceful shutdown ───────────────────────────────────────────────────────
  // Defined inside main() so it closes over the worker instances above.
  // Waits for in-flight jobs to finish before exiting.
  async function shutdown(signal: string): Promise<never> {
    logWorkerEvent("info", "worker.shutdown_requested", { signal });

    healthMonitor?.stop();

    await Promise.allSettled([
      transactionalWorker.close(),
      campaignWorker.close(),
      notificationWorker.close(),
      ...Object.values(monitoringQueues).map((queue) => queue.close()),
    ]);

    await prisma.$disconnect();
    redis.disconnect();

    logWorkerEvent("info", "worker.shutdown_complete");
    process.exit(0);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// ── Structured log helper ─────────────────────────────────────────────────────

/**
 * Attaches `completed`, `failed`, and `error` event listeners to a worker.
 * All events are forwarded to the structured logger with queue context.
 */
function attachLogger(worker: Worker, queueName: string) {
  worker.on("completed", (job) => {
    logWorkerEvent("info", "worker.job_completed", {
      queue: queueName,
      jobId: job?.id ?? null,
      jobName: job?.name ?? null,
      attemptsMade: job?.attemptsMade ?? null,
    });
  });

  worker.on("failed", (job, err) => {
    recordQueueFailure(failureTracker, queueName, job?.id, err);
    logWorkerEvent("error", "worker.job_failed", {
      queue: queueName,
      jobId: job?.id ?? null,
      jobName: job?.name ?? null,
      attemptsMade: job?.attemptsMade ?? null,
      failedReason: err.message,
      errorType: err.name,
    });
  });

  worker.on("error", (err) => {
    logWorkerEvent("error", "worker.runtime_error", {
      queue: queueName,
      failedReason: err.message,
      errorType: err.name,
    });
  });
}

// ── Heartbeat ─────────────────────────────────────────────────────────────────
// Emits a log line every 30 s so that log-based uptime monitors can detect
// a silent process hang (no events, but process still alive).
setInterval(() => {
  logWorkerEvent("info", "worker.heartbeat");
}, 30_000);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
main().catch((err) => {
  logWorkerEvent("error", "worker.fatal_startup_error", {
    failedReason: err instanceof Error ? err.message : String(err),
    errorType: err instanceof Error ? err.name : "Error",
  });
  process.exit(1);
});