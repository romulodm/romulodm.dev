import 'server-only';

import { prisma } from '@romulo/database';
import {
    QUEUE_BACKUPS,
    QUEUE_CAMPAIGN,
    QUEUE_NOTIFICATIONS,
    QUEUE_TRANSACTIONAL,
    createQueue,
} from '@romulo/queues';
import type { Queue } from 'bullmq';

import { getRedis } from '@/lib/redis';

/**
 * The /saude reply: a quick look at every piece the site depends on, answered
 * from the site itself.
 *
 * What this can and cannot tell. The answer comes from the app container, so
 * if the app is down there is no answer at all, and the silence is the signal.
 * Everything else (Postgres, Redis, search-go, the worker) is checked from
 * here, which is the view that matters: a database the app cannot reach is
 * down as far as visitors are concerned, whatever `docker ps` says.
 *
 * The worker has no endpoint of its own. It is checked through BullMQ, which
 * lists the Redis connections each worker opens for a queue; zero connections
 * on the notifications queue means nothing will send the daily summary or any
 * alert.
 *
 * Every check has its own timeout and its own failure, so one hung dependency
 * shows up as one red line instead of a webhook that never answers.
 */

const CHECK_TIMEOUT_MS = 3_000;

const SEARCH_URL = process.env.SEARCH_GO_URL ?? 'http://localhost:8080';

const QUEUES = [QUEUE_NOTIFICATIONS, QUEUE_TRANSACTIONAL, QUEUE_CAMPAIGN, QUEUE_BACKUPS] as const;

const queues = new Map<string, Queue>();

function getQueue(name: string): Queue {
    let queue = queues.get(name);
    if (!queue) {
        queue = createQueue(name, getRedis());
        queues.set(name, queue);
    }
    return queue;
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`timeout after ${CHECK_TIMEOUT_MS} ms`)), CHECK_TIMEOUT_MS),
        ),
    ]);
}

type Check = { ok: true; ms: number } | { ok: false; error: string };

async function timed(fn: () => Promise<unknown>): Promise<Check> {
    const start = Date.now();
    try {
        await withTimeout(fn());
        return { ok: true, ms: Date.now() - start };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
}

async function checkSearch(): Promise<void> {
    const response = await fetch(`${SEARCH_URL}/health`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

type QueueReport =
    | { name: string; ok: true; workers: number; waiting: number; failed: number }
    | { name: string; ok: false; error: string };

async function inspectQueue(name: string): Promise<QueueReport> {
    try {
        const queue = getQueue(name);
        const [counts, workers] = await withTimeout(
            Promise.all([queue.getJobCounts('waiting', 'delayed', 'failed'), queue.getWorkers()]),
        );
        return {
            name,
            ok: true,
            workers: workers.length,
            waiting: (counts.waiting ?? 0) + (counts.delayed ?? 0),
            failed: counts.failed ?? 0,
        };
    } catch (error) {
        return { name, ok: false, error: error instanceof Error ? error.message : String(error) };
    }
}

function line(name: string, check: Check): string {
    return check.ok ? `✅ ${name} · ${check.ms} ms` : `❌ ${name} · ${check.error}`;
}

function formatUptime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}min`;
    return `${minutes}min`;
}

export async function buildHealthReport(): Promise<string> {
    const [database, redis, search, queueReports] = await Promise.all([
        timed(() => prisma.$queryRaw`SELECT 1`),
        timed(() => getRedis().ping()),
        timed(checkSearch),
        Promise.all(QUEUES.map(inspectQueue)),
    ]);

    const notifications = queueReports.find((report) => report.name === QUEUE_NOTIFICATIONS);
    const workerLine =
        notifications?.ok
            ? notifications.workers > 0
                ? `✅ Worker · ${notifications.workers} conexão(ões)`
                : '❌ Worker · nenhum conectado à fila de notificações'
            : `❌ Worker · ${notifications?.ok === false ? notifications.error : 'sem resposta'}`;

    const queueLines = queueReports.map((report) =>
        report.ok
            ? `${report.failed > 0 ? '⚠️' : '·'} ${report.name}: ${report.waiting} na fila, ${report.failed} com falha`
            : `❌ ${report.name}: ${report.error}`,
    );

    return [
        'Saúde',
        '',
        `✅ App · no ar há ${formatUptime(process.uptime())}`,
        line('Postgres', database),
        line('Redis', redis),
        line('Busca (search-go)', search),
        workerLine,
        '',
        'Filas',
        ...queueLines,
        '',
        'Jobs com falha continuam guardados depois do erro, então um número que não muda entre duas consultas não é falha nova.',
    ].join('\n');
}
