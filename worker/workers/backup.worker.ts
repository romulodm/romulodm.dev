import { Worker } from "bullmq";
import type { Redis } from "ioredis";

import {
    QUEUE_BACKUPS,
    type BackupJob,
} from "@romulo/queues";

import { createPostgresBackup } from "../lib/backup";
import { logWorkerError, logWorkerEvent } from "../lib/worker-observability";

export function startBackupWorker(redis: Redis) {
    const worker = new Worker<BackupJob>(
        QUEUE_BACKUPS,
        async (job) => {
            logWorkerEvent("info", "backup.starting", {
                requestedBy: job.data.requestedBy,
                jobId: job.id,
            });

            const result = await createPostgresBackup();

            logWorkerEvent("info", "backup.completed", {
                key: result.key,
                durationMs: result.durationMs,
            });
        },
        {
            connection: redis,
            concurrency: 1,
        },
    );

    worker.on("failed", (job, err) => {
        logWorkerError("backup.failed", err, {
            jobId: job?.id ?? null,
            attemptsMade: job?.attemptsMade ?? null,
        });
    });

    return worker;
}