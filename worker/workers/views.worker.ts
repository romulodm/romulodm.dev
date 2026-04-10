// apps/worker/src/workers/views.worker.ts
//
// Flush periódico do buffer de views (Redis Hash) para o Postgres.
// Estratégia: HGETALL → batch UPDATE → DEL da chave (ou HDEL por campo).
//
// Rodando a cada 60 s (configurável) o banco recebe no máximo 1 write/minuto
// independente do número de pageviews no período.

import { prisma } from "@romulo/database";
import {
    buildNotificationJobId,
    createRedisConnection,
    createQueue,
    FLUSH_VIEWS_JOB_NAME,
    notificationJobOptions,
    QUEUE_NOTIFICATIONS,
    VIEWS_BUFFER_KEY,
    type NotificationJob,
} from "@romulo/queues";

// ─── Lógica de flush ─────────────────────────────────────────────────────────

export async function flushViewsBuffer(redis: ReturnType<typeof createRedisConnection>) {
    // 1. Lê todos os contadores acumulados
    const raw = await redis.hgetall(VIEWS_BUFFER_KEY);
    if (!raw || Object.keys(raw).length === 0) {
        console.log("[ViewsFlush] Buffer vazio — nada a fazer.");
        return;
    }

    const entries = Object.entries(raw) as [string, string][];
    console.log(`[ViewsFlush] Flushing ${entries.length} post(s)…`);

    // 2. Remove os campos que vamos persistir ANTES de escrever no Postgres.
    //    Isso garante que views chegando durante o flush não sejam perdidas:
    //    - HDEL remove apenas os campos que lemos
    //    - Novas views chegando depois do HGETALL ficam em campos recém-incrementados
    await redis.hdel(VIEWS_BUFFER_KEY, ...entries.map(([id]) => id));

    // 3. Batch update no Postgres — uma transação por chunk de 50 posts
    const CHUNK = 50;
    for (let i = 0; i < entries.length; i += CHUNK) {
        const chunk = entries.slice(i, i + CHUNK);
        await prisma.$transaction(
            chunk.map(([postId, count]) =>
                prisma.post.update({
                    where: { id: postId },
                    data: { views: { increment: parseInt(count, 10) } },
                }),
            ),
        );
    }

    const total = entries.reduce((sum, [, v]) => sum + parseInt(v, 10), 0);
    console.log(`[ViewsFlush] ✅ ${total} view(s) persistidas em ${entries.length} post(s).`);
}

// ─── Agendamento do cron ──────────────────────────────────────────────────────

const redis = createRedisConnection();

// Reutiliza a queue de notifications (ou troque por uma QUEUE_VIEWS dedicada)
const queue = createQueue<NotificationJob>(QUEUE_NOTIFICATIONS, redis, {
    defaultJobOptions: {
        ...notificationJobOptions,
        attempts: 1,
        removeOnComplete: { count: 10 },
        removeOnFail: { age: 24 * 3600 },
    },
});

export async function scheduleViewsFlush(): Promise<void> {
    const repeatableJobs = await queue.getRepeatableJobs();
    const alreadyScheduled = repeatableJobs.some((j) => j.name === FLUSH_VIEWS_JOB_NAME);

    if (alreadyScheduled) {
        console.log("[ViewsFlush] Cron já agendado — skipping.");
        return;
    }

    await queue.add(
        FLUSH_VIEWS_JOB_NAME,
        { type: "flush-views" } as any,
        {
            ...notificationJobOptions,
            attempts: 1,
            jobId: buildNotificationJobId({ type: "flush-views" }),
            repeat: {
                every: 60_000, // flush a cada 60 segundos
                // ou use pattern cron: "* * * * *"
            },
        },
    );

    console.log("[ViewsFlush] Cron de flush agendado (60 s) ✅");
}
