import type { Queue } from "bullmq";
import type { Redis } from "ioredis";

import {
  DAILY_STATUS_JOB_NAME,
  FLUSH_VIEWS_JOB_NAME,
  QUEUE_CAMPAIGN,
  QUEUE_NOTIFICATIONS,
  QUEUE_TRANSACTIONAL,
} from "@romulo/queues";

import { addWorkerBreadcrumb, captureWorkerException } from "./sentry";

export const WORKER_HEALTH_KEY = "worker:health:latest";

// ── Log persistence ───────────────────────────────────────────────────────────
const LOG_KEY = "worker:logs:recent";
const MAX_LOGS = 200;

let _redis: Redis | null = null;

/** Call once in main() to enable log persistence to Redis. */
export function setLogRedis(r: Redis) {
  _redis = r;
}

type LogLevel = "info" | "warn" | "error";

interface FailureRecord {
  timestamps: number[];
  lastError?: string;
  lastJobId?: string;
}

export interface QueueHealthSummary {
  queue: string;
  status: "healthy" | "degraded";
  backlog: number;
  waiting: number;
  delayed: number;
  active: number;
  failed: number;
  recentFailures: number;
  lastFailureAt: string | null;
  lastJobId: string | null;
  lastError: string | null;
  missingRepeatableJobs: string[];
}

export interface WorkerHealthSnapshot {
  checkedAt: string;
  status: "healthy" | "degraded";
  queues: QueueHealthSummary[];
}

type FailureTracker = Map<string, FailureRecord>;

export function createFailureTracker(): FailureTracker {
  return new Map();
}

function trimRecentFailures(record: FailureRecord, now = Date.now()) {
  const cutoff = now - 15 * 60 * 1000;
  record.timestamps = record.timestamps.filter((timestamp) => timestamp >= cutoff);
}

export function recordQueueFailure(
  tracker: FailureTracker,
  queueName: string,
  jobId: string | undefined,
  error: unknown,
) {
  const record = tracker.get(queueName) ?? { timestamps: [] };
  record.timestamps.push(Date.now());
  trimRecentFailures(record);
  record.lastJobId = jobId;
  record.lastError = error instanceof Error ? error.message : String(error ?? "Unknown error");
  tracker.set(queueName, record);
}

function getRecentFailureCount(tracker: FailureTracker, queueName: string) {
  const record = tracker.get(queueName);
  if (!record) {
    return { recentFailures: 0, lastFailureAt: null, lastJobId: null, lastError: null };
  }

  trimRecentFailures(record);
  const lastTimestamp = record.timestamps.at(-1);

  return {
    recentFailures: record.timestamps.length,
    lastFailureAt: lastTimestamp ? new Date(lastTimestamp).toISOString() : null,
    lastJobId: record.lastJobId ?? null,
    lastError: record.lastError ?? null,
  };
}

function getQueueBacklogThreshold(queueName: string) {
  switch (queueName) {
    case QUEUE_CAMPAIGN:
      return 100;
    case QUEUE_NOTIFICATIONS:
      return 10;
    case QUEUE_TRANSACTIONAL:
    default:
      return 25;
  }
}

function getExpectedRepeatableJobs(queueName: string) {
  if (queueName !== QUEUE_NOTIFICATIONS) {
    return [];
  }

  return [DAILY_STATUS_JOB_NAME, FLUSH_VIEWS_JOB_NAME];
}

function emitWorkerEvent(
  level: LogLevel,
  event: string,
  context: Record<string, unknown>,
  options: { captureToSentry: boolean },
) {
  const payload = {
    timestamp: new Date().toISOString(),
    service: "worker",
    level,
    event,
    ...context,
  };
  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }

  // Todo evento vira breadcrumb: quando um erro for capturado, o Sentry mostra
  // os ultimos eventos do worker como historico do que aconteceu antes.
  addWorkerBreadcrumb(level === "warn" ? "warning" : level, event, context);

  // Erro logado sem passar por logWorkerError (chamada legada) ainda chega ao
  // Sentry — sem stack trace, mas chega.
  if (level === "error" && options.captureToSentry) {
    captureWorkerException(event, context.failedReason ?? context.error ?? event, context);
  }

  // Fire-and-forget — nunca bloqueia o caller
  if (_redis) {
    _redis
      .multi()
      .lpush(LOG_KEY, line)
      .ltrim(LOG_KEY, 0, MAX_LOGS - 1)
      .expire(LOG_KEY, 60 * 60 * 24) // TTL 24h
      .exec()
      .catch(() => { }); // silencia erros de redis
  }

  return payload;
}

export function logWorkerEvent(level: LogLevel, event: string, context: Record<string, unknown> = {}) {
  return emitWorkerEvent(level, event, context, { captureToSentry: true });
}

/**
 * Log de erro preservando o objeto Error original.
 *
 * Prefira esta funcao a `logWorkerEvent("error", ...)`: aqui o Sentry recebe o
 * stack trace de verdade, enquanto pelo caminho antigo so chega a mensagem.
 * O log em JSON sai identico ao formato ja usado (failedReason / errorType).
 */
export function logWorkerError(
  event: string,
  error: unknown,
  context: Record<string, unknown> = {},
) {
  const payload = emitWorkerEvent(
    "error",
    event,
    {
      ...context,
      failedReason: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.name : typeof error,
    },
    { captureToSentry: false }, // capturamos abaixo, com o Error inteiro
  );

  captureWorkerException(event, error, context);

  return payload;
}

export async function captureWorkerHealthSnapshot(
  queues: Record<string, Queue>,
  redis: Redis,
  failureTracker: FailureTracker,
): Promise<WorkerHealthSnapshot> {
  const queueSummaries = await Promise.all(
    Object.entries(queues).map(async ([queueName, queue]) => {
      const counts = await queue.getJobCounts("waiting", "delayed", "active", "failed");
      const expectedRepeatableJobs = getExpectedRepeatableJobs(queueName);
      const repeatableJobs = expectedRepeatableJobs.length > 0 ? await queue.getRepeatableJobs() : [];
      const repeatableNames = new Set(repeatableJobs.map((job) => job.name));
      const missingRepeatableJobs = expectedRepeatableJobs.filter((jobName) => !repeatableNames.has(jobName));
      const failureSummary = getRecentFailureCount(failureTracker, queueName);
      const backlog = counts.waiting + counts.delayed;
      const degraded =
        backlog > getQueueBacklogThreshold(queueName) ||
        failureSummary.recentFailures >= 3 ||
        missingRepeatableJobs.length > 0;

      return {
        queue: queueName,
        status: degraded ? "degraded" : "healthy",
        backlog,
        waiting: counts.waiting,
        delayed: counts.delayed,
        active: counts.active,
        failed: counts.failed,
        recentFailures: failureSummary.recentFailures,
        lastFailureAt: failureSummary.lastFailureAt,
        lastJobId: failureSummary.lastJobId,
        lastError: failureSummary.lastError,
        missingRepeatableJobs,
      } satisfies QueueHealthSummary;
    }),
  );

  const snapshot: WorkerHealthSnapshot = {
    checkedAt: new Date().toISOString(),
    status: queueSummaries.some((summary) => summary.status === "degraded") ? "degraded" : "healthy",
    queues: queueSummaries,
  };

  await redis.set(WORKER_HEALTH_KEY, JSON.stringify(snapshot), "EX", 300);
  return snapshot;
}

export function startWorkerHealthMonitor(options: {
  queues: Record<string, Queue>;
  redis: Redis;
  failureTracker: FailureTracker;
  intervalMs?: number;
}) {
  const intervalMs = options.intervalMs ?? Number(process.env.WORKER_HEALTH_CHECK_INTERVAL_MS ?? 60_000);

  // O snapshot roda a cada 60s. Se enviassemos um evento ao Sentry a cada
  // ciclo degradado, uma fila travada por uma hora geraria 60 eventos iguais —
  // por isso so reportamos a TRANSICAO healthy -> degraded.
  let previousStatus: WorkerHealthSnapshot["status"] | null = null;

  const runCheck = async () => {
    const snapshot = await captureWorkerHealthSnapshot(options.queues, options.redis, options.failureTracker);

    const queueSummary = snapshot.queues.map((queue) => ({
      queue: queue.queue,
      status: queue.status,
      backlog: queue.backlog,
      failed: queue.failed,
      recentFailures: queue.recentFailures,
      missingRepeatableJobs: queue.missingRepeatableJobs,
    }));

    // Log mantido no formato original (nivel error quando degradado), mas sem
    // capturar no Sentry aqui — quem reporta e o bloco de transicao abaixo.
    emitWorkerEvent(
      snapshot.status === "healthy" ? "info" : "error",
      "worker.health_snapshot",
      { status: snapshot.status, queues: queueSummary },
      { captureToSentry: false },
    );

    if (snapshot.status === "degraded" && previousStatus !== "degraded") {
      const degradedQueues = snapshot.queues
        .filter((queue) => queue.status === "degraded")
        .map((queue) => queue.queue)
        .join(", ");

      captureWorkerException(
        "worker.health_degraded",
        new Error(`Filas degradadas: ${degradedQueues || "desconhecida"}`),
        { queues: queueSummary },
      );
    }

    previousStatus = snapshot.status;

    return snapshot;
  };

  const timer = setInterval(() => {
    void runCheck().catch((error) => {
      logWorkerError("worker.health_snapshot_failed", error);
    });
  }, intervalMs);
  timer.unref?.();

  return {
    runCheck,
    stop() {
      clearInterval(timer);
    },
  };
}