/**
 * views.worker.ts
 *
 * Implements a periodic "flush" of the view-count buffer from Redis to Postgres.
 *
 * Why buffer views in Redis instead of writing directly to Postgres?
 * Each pageview would trigger an individual UPDATE on the posts table.
 * Under any meaningful traffic that creates excessive write pressure and
 * lock contention. Instead, every pageview increments a counter in a
 * Redis Hash (one field per post ID), and this worker drains that hash
 * into Postgres in batches on a configurable interval.
 *
 * Data flow:
 *   [pageview] → HINCRBY views:buffer <postId> 1  (in the web app)
 *       ↓  (every N ms, via BullMQ repeatable job)
 *   [flush] → HGETALL → batch UPDATE posts SET views += N → HDEL flushed fields
 *
 * The HDEL happens BEFORE the Postgres writes intentionally: it's safer to
 * lose a few counts on a crash than to double-count them. Views are a
 * soft metric, so slight under-counting on failure is acceptable.
 *
 * The scheduling queue is closed after `scheduleViewsFlush` completes —
 * it only needs to be open long enough to register the repeatable job.
 * The notification worker (notification.worker.ts) owns the actual execution.
 */

import { prisma } from "@romulo/database";
import type { Redis } from "ioredis";
import {
    registerRepeatable,
    createQueue,
    FLUSH_VIEWS_JOB_NAME,
    notificationJobOptions,
    queueRuntimeConfig,
    QUEUE_NOTIFICATIONS,
    VIEWS_BUFFER_KEY,
    type NotificationJob,
} from "@romulo/queues";

const viewsRuntimeConfig = queueRuntimeConfig ?? {
    viewsFlushBatchSize: 100,
    viewsFlushIntervalMs: 120_000,
};

// ── Core flush logic ──────────────────────────────────────────────────────────

/**
 * Reads all buffered view counts from the Redis Hash, removes them atomically,
 * then persists the increments to Postgres in batches.
 *
 * @param redis - The shared ioredis connection.
 *
 * Batching is controlled by `WORKER_VIEWS_FLUSH_BATCH_SIZE` (default: 100).
 * Each batch runs inside a Prisma transaction so a partial failure doesn't
 * leave the database in an inconsistent state for that chunk.
 */
export async function flushViewsBuffer(redis: Redis): Promise<void> {
    const raw = await redis.hgetall(VIEWS_BUFFER_KEY);

    if (!raw || Object.keys(raw).length === 0) {
        console.log("[ViewsFlush] Buffer empty — nothing to flush.");
        return;
    }

    const entries = Object.entries(raw) as [string, string][];
    console.log(`[ViewsFlush] Flushing ${entries.length} post(s)...`);

    // Delete the keys we just read before writing to Postgres.
    // If the process crashes after this point, those counts are lost —
    // that's acceptable for a soft metric like views.
    await redis.hdel(VIEWS_BUFFER_KEY, ...entries.map(([postId]) => postId));

    const batchSize = viewsRuntimeConfig.viewsFlushBatchSize;

    for (let i = 0; i < entries.length; i += batchSize) {
        const chunk = entries.slice(i, i + batchSize);

        // Each chunk runs in a single transaction: either all updates in the
        // chunk succeed, or none do (and the counts for that chunk are lost).
        // `updateMany` rather than `update`: a post deleted while it still had
        // views in the buffer matches zero rows instead of throwing, which
        // would roll back — and lose — every other post's count in the chunk.
        await prisma.$transaction(
            chunk.map(([postId, count]) =>
                prisma.post.updateMany({
                    where: { id: postId },
                    data: { views: { increment: parseInt(count, 10) } },
                }),
            ),
        );
    }

    const total = entries.reduce((sum, [, count]) => sum + parseInt(count, 10), 0);
    console.log(`[ViewsFlush] Persisted ${total} view(s) across ${entries.length} post(s).`);
}

// ── Repeatable job scheduling ─────────────────────────────────────────────────

/**
 * Registers a BullMQ repeatable job that fires `flush-views` every N milliseconds.
 *
 * This function is idempotent: if the job is already registered in the queue
 * (e.g. from a previous process start), it skips re-registration. This prevents
 * accumulating duplicate repeatable jobs across restarts.
 *
 * The queue instance is closed after scheduling because it is only needed for
 * this one-time setup. The actual job execution is handled by the notification
 * worker, which holds its own long-lived connection to QUEUE_NOTIFICATIONS.
 *
 * @param redis - The shared ioredis connection.
 */
export async function scheduleViewsFlush(redis: Redis): Promise<void> {
    // Temporary queue client used only to register the repeatable job
    const schedulingQueue = createQueue<NotificationJob>(QUEUE_NOTIFICATIONS, redis, {
        defaultJobOptions: {
            ...notificationJobOptions,
            attempts: 1,                          // Views flush is best-effort; no retries
            removeOnComplete: { count: 10 },
            removeOnFail: { age: 24 * 3600 },
        },
    });

    try {
        const result = await registerRepeatable(schedulingQueue, {
            name: FLUSH_VIEWS_JOB_NAME,
            data: { type: "flush-views" } as NotificationJob,
            repeat: { every: viewsRuntimeConfig.viewsFlushIntervalMs },
            jobOptions: { ...notificationJobOptions, attempts: 1 },
        });

        console.log(
            `[ViewsFlush] Flush job ${result.action} — interval: ${viewsRuntimeConfig.viewsFlushIntervalMs} ms.`,
        );
    } finally {
        // Always close the temporary queue client, whether scheduling succeeded or not
        await schedulingQueue.close();
    }
}

