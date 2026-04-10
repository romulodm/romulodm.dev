import "./env";

import { createQueue, QUEUE_CAMPAIGN, QUEUE_NOTIFICATIONS, QUEUE_TRANSACTIONAL } from "@romulo/queues";
import { prisma } from "@romulo/database";

import { emailService } from "./lib/email/email.service";
import { redis } from "./lib/redis";
import {
  createFailureTracker,
  logWorkerEvent,
  recordQueueFailure,
  startWorkerHealthMonitor,
} from "./lib/worker-observability";
import { campaignWorker, transactionalWorker } from "./workers/email.worker";
import { notificationWorker, scheduleDailyStatus } from "./workers/notification.worker";
import { scheduleViewsFlush } from "./workers/views.worker";

const monitoringQueues = {
  [QUEUE_TRANSACTIONAL]: createQueue(QUEUE_TRANSACTIONAL, redis),
  [QUEUE_CAMPAIGN]: createQueue(QUEUE_CAMPAIGN, redis),
  [QUEUE_NOTIFICATIONS]: createQueue(QUEUE_NOTIFICATIONS, redis),
};

const failureTracker = createFailureTracker();
let healthMonitor: ReturnType<typeof startWorkerHealthMonitor> | null = null;

async function main() {
  logWorkerEvent("info", "worker.starting");

  await emailService.verify().catch((err) => {
    logWorkerEvent("warn", "worker.email_verify_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  });

  await scheduleDailyStatus();
  await scheduleViewsFlush();

  attachLogger(transactionalWorker, QUEUE_TRANSACTIONAL);
  attachLogger(campaignWorker, QUEUE_CAMPAIGN);
  attachLogger(notificationWorker, QUEUE_NOTIFICATIONS);

  healthMonitor = startWorkerHealthMonitor({
    queues: monitoringQueues,
    redis,
    failureTracker,
  });
  await healthMonitor.runCheck();

  logWorkerEvent("info", "worker.ready", {
    queues: Object.keys(monitoringQueues),
  });
}

function attachLogger(worker: { on: Function }, queueName: string) {
  worker.on("completed", (job: any) => {
    logWorkerEvent("info", "worker.job_completed", {
      queue: queueName,
      jobId: job?.id ?? null,
      jobName: job?.name ?? null,
      attemptsMade: job?.attemptsMade ?? null,
    });
  });

  worker.on("failed", (job: any, err: Error) => {
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

  worker.on("error", (err: Error) => {
    logWorkerEvent("error", "worker.runtime_error", {
      queue: queueName,
      failedReason: err.message,
      errorType: err.name,
    });
  });
}

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

setInterval(() => {
  logWorkerEvent("info", "worker.heartbeat");
}, 30_000);

main().catch((err) => {
  logWorkerEvent("error", "worker.fatal_startup_error", {
    failedReason: err instanceof Error ? err.message : String(err),
    errorType: err instanceof Error ? err.name : "Error",
  });
  process.exit(1);
});

