// app/api/status/route.ts
// Rota PUBLICA - sem autenticacao.

import { NextResponse } from 'next/server';
import { prisma } from '@romulo/database';
import packageJson from '@/package.json';

import { cached } from '@/lib/status-cache';

export const dynamic = 'force-dynamic';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function measureLatency(fn: () => Promise<unknown>, samples = 3): Promise<number[]> {
    const results: number[] = [];
    for (let i = 0; i < samples; i++) {
        const start = Date.now();
        await fn();
        results.push(Date.now() - start);
    }
    return results;
}

function pgVersionShort(full: string): string {
    const match = full.match(/PostgreSQL\s+([\d.]+)/i);
    return match ? match[1] : full.split(' ').slice(0, 2).join(' ');
}

// ─── Database ─────────────────────────────────────────────────────────────────

async function checkDatabase() {
    // 1) Health check principal — determina o status
    let latencies: number[] = [];
    let versionRow: { version: string }[] = [];
    let connectionsRow: { available: number; opened: number }[] = [];

    try {
        [latencies, [versionRow, connectionsRow]] = await Promise.all([
            measureLatency(() => prisma.$queryRaw`SELECT 1`),
            Promise.all([
                prisma.$queryRaw<{ version: string }[]>`SELECT version() AS version`,
                prisma.$queryRaw<{ available: number; opened: number }[]>`
                    SELECT
                        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections')
                        - (SELECT count(*) FROM pg_stat_activity WHERE state IS NOT NULL) AS available,
                        (SELECT count(*) FROM pg_stat_activity WHERE state IS NOT NULL) AS opened
                `,
            ]),
        ]);
    } catch (err) {
        // Falha nas queries essenciais -> banco realmente indisponivel
        return {
            status: 'unhealthy' as const,
            availableConnections: null,
            openedConnections: null,
            latencyMs: [],
            postgresVersion: null,
            databaseSizeMb: null,
            tableSizes: [],
            error: String(err),
        };
    }

    // 2) Queries extras (tamanho, tabelas) — falha silenciosa, nao afeta status
    let databaseSizeMb: number | null = null;
    let tableSizes: { name: string; sizeMb: number; rowEstimate: number }[] = [];

    try {
        const [dbSizeRow, tableSizesRow] = await Promise.all([
            prisma.$queryRaw<{ size_mb: number }[]>`
                SELECT round(pg_database_size(current_database()) / 1024.0 / 1024.0, 2) AS size_mb
            `,
            prisma.$queryRaw<{ table_name: string; size_mb: number; row_estimate: number }[]>`
                SELECT
                    relname AS table_name,
                    round(pg_total_relation_size(relid) / 1024.0 / 1024.0, 2) AS size_mb,
                    reltuples::bigint AS row_estimate
                FROM pg_catalog.pg_statio_user_tables
                JOIN pg_class ON pg_class.oid = pg_statio_user_tables.relid
                ORDER BY pg_total_relation_size(relid) DESC
                LIMIT 8
            `,
        ]);
        databaseSizeMb = Number(dbSizeRow[0].size_mb);
        tableSizes = tableSizesRow.map((r) => ({
            name: r.table_name,
            sizeMb: Number(r.size_mb),
            rowEstimate: Number(r.row_estimate),
        }));
    } catch {
        // Sem permissao ou extensao nao disponivel — ignora silenciosamente
    }

    return {
        status: 'healthy' as const,
        availableConnections: Number(connectionsRow[0]?.available ?? 0),
        openedConnections: Number(connectionsRow[0]?.opened ?? 0),
        latencyMs: latencies,
        postgresVersion: pgVersionShort(versionRow[0]?.version ?? ''),
        databaseSizeMb,
        tableSizes,
    };
}

// ─── Web server ───────────────────────────────────────────────────────────────

async function checkWebServer() {
    return {
        status: 'healthy' as 'healthy' | 'unhealthy',
        provider: process.env.VERCEL ? 'vercel' : process.env.RAILWAY_ENVIRONMENT ? 'railway' : 'self-hosted',
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
        awsRegion: process.env.AWS_REGION ?? process.env.VERCEL_REGION ?? null,
        vercelRegion: process.env.VERCEL_REGION ?? null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        commitAuthor: process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN ?? process.env.GIT_AUTHOR ?? null,
        commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_SHA ?? null,
        nodeVersion: process.version,
    };
}

// ─── App statistics ───────────────────────────────────────────────────────────

async function getAppStats() {
    const since60d = new Date();
    since60d.setDate(since60d.getDate() - 60);
    since60d.setHours(0, 0, 0, 0);

    const since7d = new Date();
    since7d.setDate(since7d.getDate() - 7);
    since7d.setHours(0, 0, 0, 0);

    type DayCount = { day: Date; count: bigint };
    type DayAmount = { day: Date; count: bigint; total_brl: number };

    const [
        users,
        posts,
        comments,
        replies,
        votes,
        suspiciousComments,
        donationsPerDay,
        newsletterStats,
        campaignStats,
        topPostsWeek,
        engagementStats,
        unsubscribesPerDay,
        wallMessages,
        wallTotal,
    ] = await Promise.all([

        // ── Atividade diaria ──────────────────────────────────────────────────

        prisma.$queryRaw<DayCount[]>`
            SELECT date_trunc('day', "createdAt") AS day, count(*) AS count
            FROM "User" WHERE "createdAt" >= ${since60d}
            GROUP BY 1 ORDER BY 1
        `,
        prisma.$queryRaw<DayCount[]>`
            SELECT date_trunc('day', "publishedAt") AS day, count(*) AS count
            FROM "Post" WHERE "publishedAt" >= ${since60d} AND status = 'PUBLISHED'
            GROUP BY 1 ORDER BY 1
        `,
        prisma.$queryRaw<DayCount[]>`
            SELECT date_trunc('day', "createdAt") AS day, count(*) AS count
            FROM "Comment" WHERE "createdAt" >= ${since60d} AND "parentId" IS NULL
            GROUP BY 1 ORDER BY 1
        `,
        prisma.$queryRaw<DayCount[]>`
            SELECT date_trunc('day', "createdAt") AS day, count(*) AS count
            FROM "Comment" WHERE "createdAt" >= ${since60d} AND "parentId" IS NOT NULL
            GROUP BY 1 ORDER BY 1
        `,
        prisma.$queryRaw<DayCount[]>`
            SELECT date_trunc('day', "createdAt") AS day, count(*) AS count
            FROM "CommentVote" WHERE "createdAt" >= ${since60d}
            GROUP BY 1 ORDER BY 1
        `,

        // ── Comentarios suspeitos por dia ─────────────────────────────────────
        prisma.$queryRaw<DayCount[]>`
            SELECT date_trunc('day', "createdAt") AS day, count(*) AS count
            FROM "SuspiciousComment" WHERE "createdAt" >= ${since60d}
            GROUP BY 1 ORDER BY 1
        `,

        // ── Doacoes por dia (concluidas) ──────────────────────────────────────
        prisma.$queryRaw<DayAmount[]>`
            SELECT
                date_trunc('day', "createdAt") AS day,
                count(*) AS count,
                coalesce(sum(CASE WHEN currency = 'BRL' THEN amount ELSE 0 END) / 100.0, 0) AS total_brl
            FROM "Donation"
            WHERE "createdAt" >= ${since60d} AND status = 'COMPLETED'
            GROUP BY 1 ORDER BY 1
        `,

        // ── Newsletter: totais ────────────────────────────────────────────────
        prisma.$queryRaw<{
            total: bigint;
            confirmed: bigint;
            pending: bigint;
            unsubscribed: bigint;
        }[]>`
            SELECT
                count(*) AS total,
                count(*) FILTER (WHERE "isConfirmed" = true AND "unsubscribedAt" IS NULL) AS confirmed,
                count(*) FILTER (WHERE "isConfirmed" = false AND "unsubscribedAt" IS NULL) AS pending,
                count(*) FILTER (WHERE "unsubscribedAt" IS NOT NULL) AS unsubscribed
            FROM "NewsletterSubscriber"
        `,

        // ── Campanhas: ultimas 10 enviadas ────────────────────────────────────
        prisma.$queryRaw<{
            subject: string;
            sent_at: Date;
            total_recipients: number;
            sent_count: number;
            open_count: number;
            failed_count: number;
        }[]>`
            SELECT
                subject,
                "sentAt" AS sent_at,
                "totalRecipients" AS total_recipients,
                "sentCount" AS sent_count,
                "openCount" AS open_count,
                "failedCount" AS failed_count
            FROM "Campaign"
            WHERE status = 'SENT' AND "sentAt" IS NOT NULL
            ORDER BY "sentAt" DESC
            LIMIT 10
        `,

        // ── Top posts da semana (views) ───────────────────────────────────────
        prisma.$queryRaw<{
            title: string | null;
            slug: string;
            views: number;
            likes: number;
            comments_count: number;
        }[]>`
            SELECT
                pt.title,
                p.slug,
                p.views,
                p.likes,
                p."commentsCount" AS comments_count
            FROM "Post" p
            LEFT JOIN "PostTranslation" pt
                ON pt."postId" = p.id AND pt.locale = 'pt'
            WHERE p.status = 'PUBLISHED'
                AND p."publishedAt" >= ${since7d}
            ORDER BY p.views DESC
            LIMIT 5
        `,

        // ── Engajamento geral ─────────────────────────────────────────────────
        prisma.$queryRaw<{
            total_posts: bigint;
            avg_comments: number;
            avg_views: number;
            avg_likes: number;
        }[]>`
            SELECT
                count(*) AS total_posts,
                round(avg("commentsCount"), 1) AS avg_comments,
                round(avg(views), 1) AS avg_views,
                round(avg(likes), 1) AS avg_likes
            FROM "Post"
            WHERE status = 'PUBLISHED'
        `,

        // ── Unsubscribes por dia ──────────────────────────────────────────────
        prisma.$queryRaw<DayCount[]>`
            SELECT date_trunc('day', "unsubscribedAt") AS day, count(*) AS count
            FROM "NewsletterSubscriber"
            WHERE "unsubscribedAt" >= ${since60d}
            GROUP BY 1 ORDER BY 1
        `,

        // ── Mural (guestbook) ─────────────────────────────────────────────────
        prisma.$queryRaw<DayCount[]>`
            SELECT date_trunc('day', "createdAt") AS day, count(*) AS count
            FROM "WallMessage" WHERE "createdAt" >= ${since60d}
            GROUP BY 1 ORDER BY 1
        `,
        prisma.wallMessage.count(),
    ]);

    function toSeries(rows: DayCount[]) {
        return rows.map((r) => ({
            day: (r.day as Date).toISOString().slice(0, 10),
            count: Number(r.count),
        }));
    }

    const nl = newsletterStats[0];
    const eng = engagementStats[0];

    return {
        // Graficos de atividade diaria
        users: toSeries(users),
        posts: toSeries(posts),
        comments: toSeries(comments),
        replies: toSeries(replies),
        votes: toSeries(votes),
        wallMessages: toSeries(wallMessages),
        suspiciousComments: toSeries(suspiciousComments),
        unsubscribesPerDay: toSeries(unsubscribesPerDay),
        donationsPerDay: donationsPerDay.map((r) => ({
            day: (r.day as Date).toISOString().slice(0, 10),
            count: Number(r.count),
            totalBrl: Number(r.total_brl),
        })),

        // Newsletter
        newsletter: {
            total: Number(nl?.total ?? 0),
            confirmed: Number(nl?.confirmed ?? 0),
            pending: Number(nl?.pending ?? 0),
            unsubscribed: Number(nl?.unsubscribed ?? 0),
            confirmationRate: nl && Number(nl.total) > 0
                ? Math.round((Number(nl.confirmed) / Number(nl.total)) * 100)
                : 0,
        },

        // Campanhas
        campaigns: campaignStats.map((c) => ({
            subject: c.subject,
            sentAt: (c.sent_at as Date).toISOString(),
            totalRecipients: Number(c.total_recipients),
            sentCount: Number(c.sent_count),
            openCount: Number(c.open_count),
            failedCount: Number(c.failed_count),
            openRate: c.sent_count > 0
                ? Math.round((Number(c.open_count) / Number(c.sent_count)) * 100)
                : 0,
        })),

        // Top posts da semana
        topPostsWeek: topPostsWeek.map((p) => ({
            title: p.title ?? p.slug,
            slug: p.slug,
            views: Number(p.views),
            likes: Number(p.likes),
            commentsCount: Number(p.comments_count),
        })),

        // Mural
        wall: {
            total: wallTotal,
        },

        // Engajamento geral
        engagement: {
            totalPosts: Number(eng?.total_posts ?? 0),
            avgComments: Number(eng?.avg_comments ?? 0),
            avgViews: Number(eng?.avg_views ?? 0),
            avgLikes: Number(eng?.avg_likes ?? 0),
        },
    };
}

// ─── Cache ────────────────────────────────────────────────────────────────────
//
// A rota e publica e cada execucao completa custa ~26 round trips no Postgres
// (3x SELECT 1, version(), pg_stat_activity, tamanhos de tabela e 19
// agregacoes). Sem cache, isso e um endpoint anonimo que multiplica carga de
// banco por request.
//
// Duas camadas, com TTLs diferentes porque os dados tem naturezas diferentes:
//
//   payload (30s)  — inclui o health check. Curto o bastante para uma queda
//                    aparecer rapido na pagina.
//   statistics(5m) — agregacoes de 60 dias. Nao mudam de forma perceptivel em
//                    5 minutos e respondem por 19 das 26 queries.
//
// Em regime, 1 req/s na rota passa de ~26 queries/s para ~7 queries a cada
// 30s. O single-flight garante que uma rajada no momento da expiracao dispare
// um recalculo, nao um por request.

const PAYLOAD_CACHE_KEY = 'status:payload';
const PAYLOAD_TTL_SECONDS = 30;
const PAYLOAD_STALE_SECONDS = 120;

// Estado ruim expira rapido: nao faz sentido congelar "unhealthy" por 30s
// depois que o banco ja voltou.
const UNHEALTHY_TTL_SECONDS = 5;

const STATS_CACHE_KEY = 'status:statistics';
const STATS_TTL_SECONDS = 300;
const STATS_STALE_SECONDS = 600;

async function buildPayload() {
    const start = Date.now();

    const [database, webServer, stats] = await Promise.all([
        checkDatabase(),
        checkWebServer(),
        cached(
            {
                key: STATS_CACHE_KEY,
                ttlSeconds: STATS_TTL_SECONDS,
                staleSeconds: STATS_STALE_SECONDS,
            },
            getAppStats,
        ).then((result) => result.data),
    ]);

    const overallStatus =
        database.status === 'unhealthy' || webServer.status === 'unhealthy'
            ? 'unhealthy'
            : 'healthy';

    return {
        updated_at: new Date().toISOString(),
        status: overallStatus,
        version: packageJson.version,
        apiLatencyMs: Date.now() - start,
        dependencies: { database, webServer },
        statistics: stats,
    };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
    const { data: payload, computedAt, source } = await cached(
        {
            key: PAYLOAD_CACHE_KEY,
            ttlSeconds: PAYLOAD_TTL_SECONDS,
            staleSeconds: PAYLOAD_STALE_SECONDS,
            ttlForResult: (result) =>
                result.status === 'unhealthy'
                    ? UNHEALTHY_TTL_SECONDS
                    : PAYLOAD_TTL_SECONDS + PAYLOAD_STALE_SECONDS,
        },
        buildPayload,
    );

    return NextResponse.json(payload, {
        status: payload.status === 'unhealthy' ? 503 : 200,
        headers: {
            // s-maxage vale para cache compartilhado (Cloudflare / proxy). Hoje
            // ninguem honra: o nginx tem proxy_no_cache em /api/, exceto no
            // location dedicado de /api/status. Ver nginx/conf.d/app.conf.
            'Cache-Control': `public, s-maxage=${PAYLOAD_TTL_SECONDS}, stale-while-revalidate=${PAYLOAD_STALE_SECONDS}`,
            'X-Cache-Source': source,
            'X-Cache-Age': String(Math.max(0, Math.round((Date.now() - computedAt) / 1000))),
        },
    });
}