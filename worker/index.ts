import "./env";
import "./lib/sentry";

import {
  createQueue,
  QUEUE_BACKUPS,
  QUEUE_CAMPAIGN,
  QUEUE_NOTIFICATIONS,
  QUEUE_TRANSACTIONAL,
} from "@romulo/queues";
import { prisma } from "@romulo/database";
import type { Worker } from "bullmq";

import { sendWorkerAlert, sendWorkerAlertAsync } from "./lib/alerts";
import { emailService } from "./lib/email/email.service";
import { redis } from "./lib/redis";
import { flushSentry } from "./lib/sentry";
import {
  createFailureTracker,
  logWorkerError,
  logWorkerEvent,
  recordQueueFailure,
  setLogRedis,
  startWorkerHealthMonitor,
} from "./lib/worker-observability";

// Factory functions — nothing is instantiated until called inside main()
import { startEmailWorkers, scheduleTransactionalEmailSweep } from "./workers/email.worker";
import { startNotificationWorker, scheduleDailyStatus } from "./workers/notification.worker";
import { scheduleViewsFlush } from "./workers/views.worker";
import { startSearchConsumer, reindexAll } from "./workers/search.worker";
import { startMetricsWorker } from "./workers/metrics.worker";
import { startBackupWorker } from "./workers/backup.worker";
import { scheduleOnchainRetry } from "./workers/onchain.worker";
import {
  scheduleDonationsAudit,
  scheduleDonationsReconcile,
} from "./workers/donations.worker";

// ── Monitoring queues ─────────────────────────────────────────────────────────
// Used only for health monitoring (job counts, lag).
// Separate from workers' internal connections.
const monitoringQueues = {
  [QUEUE_TRANSACTIONAL]: createQueue(QUEUE_TRANSACTIONAL, redis),
  [QUEUE_CAMPAIGN]: createQueue(QUEUE_CAMPAIGN, redis),
  [QUEUE_NOTIFICATIONS]: createQueue(QUEUE_NOTIFICATIONS, redis),
  [QUEUE_BACKUPS]: createQueue(QUEUE_BACKUPS, redis),
};

const failureTracker = createFailureTracker();
let healthMonitor: ReturnType<typeof startWorkerHealthMonitor> | null = null;

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Enable log persistence to Redis as early as possible so startup events
  // (email verify, reindex, etc.) are captured in the ring buffer.
  setLogRedis(redis);
  logWorkerEvent("info", "worker.starting");

  // Verify SMTP connectivity — log a warning but don't abort if it fails.
  await emailService.verify().catch((err) => {
    logWorkerEvent("warn", "worker.email_verify_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  });

  // Pre-warm the transactional SMTP pool so the first real send does not pay
  // the TLS handshake cost. emailService is an alias for transactionalEmailService.
  // The campaign pool is intentionally not pre-warmed — it connects on first use.
  await emailService.warmUp().catch((err) => {
    logWorkerEvent("warn", "worker.email_warmup_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  });

  // ── Search: full reindex on startup ──────────────────────────────────────
  // The Go search service keeps its index in memory — it loses state on restart,
  // so we rebuild via POST /reindex on every worker startup.
  await reindexAll().catch((err: unknown) => {
    logWorkerEvent("warn", "worker.search_reindex_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  });

  // ── System metrics ────────────────────────────────────────────────────────
  if (process.env.ENABLE_METRICS !== "false") {
    startMetricsWorker().catch((err: unknown) => {
      logWorkerEvent("warn", "worker.metrics_start_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }

  // ── Workers ───────────────────────────────────────────────────────────────
  const { transactionalWorker, campaignWorker } = startEmailWorkers(redis);
  const notificationWorker = startNotificationWorker(redis);
  const searchConsumer = startSearchConsumer();
  const backupWorker = startBackupWorker(redis);

  // ── Repeatable jobs (idempotent — safe to call on every restart) ──────────
  await scheduleDailyStatus(redis);
  await scheduleViewsFlush(redis);
  await scheduleOnchainRetry(redis);
  await scheduleDonationsReconcile(redis);
  await scheduleDonationsAudit(redis);
  await scheduleTransactionalEmailSweep(redis);

  // ── Structured logging ────────────────────────────────────────────────────
  attachLogger(transactionalWorker, QUEUE_TRANSACTIONAL);
  attachLogger(campaignWorker, QUEUE_CAMPAIGN);
  attachLogger(notificationWorker, QUEUE_NOTIFICATIONS);
  attachLogger(backupWorker, QUEUE_BACKUPS);

  // ── Health monitor ────────────────────────────────────────────────────────
  healthMonitor = startWorkerHealthMonitor({
    queues: monitoringQueues,
    redis,
    failureTracker,
  });
  await healthMonitor.runCheck();

  logWorkerEvent("info", "worker.ready", {
    queues: Object.keys(monitoringQueues),
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  async function shutdown(signal: string): Promise<never> {
    logWorkerEvent("info", "worker.shutdown_requested", { signal });

    healthMonitor?.stop();
    searchConsumer.stop();

    await Promise.allSettled([
      transactionalWorker.close(),
      campaignWorker.close(),
      notificationWorker.close(),
      backupWorker.close(),
      ...Object.values(monitoringQueues).map((q) => q.close()),
    ]);

    await prisma.$disconnect();
    redis.disconnect();

    logWorkerEvent("info", "worker.shutdown_complete");

    await flushSentry();

    process.exit(0);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// ── Structured log helper ─────────────────────────────────────────────────────

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
    logWorkerError("worker.job_failed", err, {
      queue: queueName,
      jobId: job?.id ?? null,
      jobName: job?.name ?? null,
      attemptsMade: job?.attemptsMade ?? null,
    });

    const attempts = job?.opts?.attempts ?? 1;
    if ((job?.attemptsMade ?? 0) >= attempts) {
      sendWorkerAlertAsync({
        event: "worker.job_failed",
        error: err,
        queue: queueName,
        jobId: job?.id,
      });
    }
  });

  worker.on("error", (err) => {
    logWorkerError("worker.runtime_error", err, { queue: queueName });
    sendWorkerAlertAsync({ event: "worker.runtime_error", error: err, queue: queueName });
  });
}

// ── Heartbeat
// Emits a log line every 30s so uptime monitors detect silent hangs.
setInterval(() => {
  logWorkerEvent("info", "worker.heartbeat");
}, 30_000);

// ── Crash handlers
process.on("uncaughtException", (err) => {
  logWorkerError("worker.uncaught_exception", err);

  void (async () => {
    await sendWorkerAlert({ event: "worker.uncaught_exception", error: err });
    await flushSentry();
    process.exit(1);
  })();
});

process.on("unhandledRejection", (reason) => {
  logWorkerError("worker.unhandled_rejection", reason);
});

// ── Bootstrap
main().catch((err) => {
  logWorkerError("worker.fatal_startup_error", err);

  void (async () => {
    await sendWorkerAlert({ event: "worker.fatal_startup_error", error: err });
    await flushSentry();
    process.exit(1);
  })();
});