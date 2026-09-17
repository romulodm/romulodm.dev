// app/api/admin/dashboard/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@romulo/database';
import { AVATAR_SELECT } from '@/lib/avatar';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// ─── Período 

type Period = '7d' | '30d' | '90d' | '12m';

const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90, '12m': 365 };

/** Granularidade do bucket de série temporal por período. */
const PERIOD_BUCKET: Record<Period, 'day' | 'week' | 'month'> = {
    '7d': 'day',
    '30d': 'day',
    '90d': 'week',
    '12m': 'month',
};

function parsePeriod(raw: string | null): Period {
    return raw === '7d' || raw === '30d' || raw === '90d' || raw === '12m' ? raw : '30d';
}

/**
 * Janela atual e janela anterior de mesmo tamanho, para comparação real.
 * Ex.: 30d -> [-30d, agora] vs [-60d, -30d].
 */
function buildWindows(period: Period, now: Date) {
    const days = PERIOD_DAYS[period];
    const currentStart = new Date(now);
    currentStart.setDate(now.getDate() - days);
    const previousStart = new Date(now);
    previousStart.setDate(now.getDate() - days * 2);
    return { days, currentStart, previousStart, previousEnd: currentStart };
}

// ─── Helpers

function growthPercent(current: number, previous: number): number | null {
    if (previous === 0) return current > 0 ? 100 : null;
    return Math.round(((current - previous) / previous) * 100);
}

function rate(numerator: number, denominator: number): number {
    if (denominator === 0) return 0;
    return Math.round((numerator / denominator) * 1000) / 10; // 1 decimal
}

const n = (v: unknown) => Number(v ?? 0);

type Severity = 'critical' | 'warning' | 'info';

interface Alert {
    id: string;
    kind: string;
    severity: Severity;
    count: number;
    /** Contexto livre para a UI interpolar na tradução. */
    meta?: Record<string, string | number | null>;
    href: string | null;
}

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };

// ─── Handler

export async function GET(req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status });

    const period = parsePeriod(req.nextUrl.searchParams.get('period'));
    const now = new Date();
    const { days, currentStart, previousStart, previousEnd } = buildWindows(period, now);
    const bucket = PERIOD_BUCKET[period];

    // Janelas fixas, independentes do seletor (health/moderação são sempre "agora").
    const since24h = new Date(now); since24h.setHours(now.getHours() - 24);
    const since72h = new Date(now); since72h.setHours(now.getHours() - 72);
    const since30d = new Date(now); since30d.setDate(now.getDate() - 30);
    const since12m = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    type SeriesRow = { bucket: Date; value: bigint };
    type MonthRow = { month: Date; views: bigint; posts: bigint; comments: bigint; likes: bigint };
    type TagRow = { tag: string; posts: bigint; views: bigint; likes: bigint; comments: bigint };

    const [
        // ── Overview (totais absolutos)
        donationStats,
        blogStats,
        totalCommentsAll,

        // ── Janela atual vs anterior
        usersCurrent, usersPrevious,
        donationsCurrent, donationsPrevious,
        likesCurrent, likesPrevious,
        commentsCurrent, commentsPrevious,
        postsCurrent, postsPrevious,
        subsCurrent, subsPrevious,
        unsubsCurrent, unsubsPrevious,

        // ── Séries temporais
        likesSeries, commentsSeries, usersSeries, donationsSeries,
        monthlyStats,

        // ── Conteúdo
        topPosts, topPostPeriod, tagPerformance,
        draftPosts, recentComments,
        publishedTotal, translationCoverage, orphanPosts, readingTimeAgg,

        // ── Newsletter 
        newsletterStats, lastCampaign, campaignAgg,

        // ── Moderação e saúde
        suspiciousUnreviewed, suspicious72h, bannedUsers, recentBans,
        unverifiedUsers, stalePendingDonations, failingCampaigns,
        scheduledCampaigns, untranslatedDrafts,

        // ── Doações 
        recentDonations, topDonations, providerMix, repeatDonors,
    ] = await Promise.all([

        // ── Overview
        prisma.donation.aggregate({
            where: { status: 'COMPLETED', currency: 'BRL' },
            _sum: { amount: true }, _count: { id: true }, _avg: { amount: true },
        }),
        prisma.post.aggregate({
            where: { status: 'PUBLISHED' },
            _sum: { views: true, likes: true, commentsCount: true }, _count: { id: true },
        }),
        prisma.comment.count(),

        // ── Usuários: atual vs anterior
        prisma.user.count({ where: { createdAt: { gte: currentStart } } }),
        prisma.user.count({ where: { createdAt: { gte: previousStart, lt: previousEnd } } }),

        // ── Doações: atual vs anterior
        prisma.donation.aggregate({
            where: { status: 'COMPLETED', currency: 'BRL', createdAt: { gte: currentStart } },
            _sum: { amount: true }, _count: { id: true },
        }),
        prisma.donation.aggregate({
            where: { status: 'COMPLETED', currency: 'BRL', createdAt: { gte: previousStart, lt: previousEnd } },
            _sum: { amount: true }, _count: { id: true },
        }),

        // ── Engajamento real: pela data do evento, não do post 
        prisma.postLike.count({ where: { createdAt: { gte: currentStart } } }),
        prisma.postLike.count({ where: { createdAt: { gte: previousStart, lt: previousEnd } } }),
        prisma.comment.count({ where: { createdAt: { gte: currentStart } } }),
        prisma.comment.count({ where: { createdAt: { gte: previousStart, lt: previousEnd } } }),

        // ── Publicação
        prisma.post.count({ where: { status: 'PUBLISHED', publishedAt: { gte: currentStart } } }),
        prisma.post.count({ where: { status: 'PUBLISHED', publishedAt: { gte: previousStart, lt: previousEnd } } }),

        // ── Newsletter: novos confirmados e churn
        prisma.newsletterSubscriber.count({ where: { subscribedAt: { gte: currentStart } } }),
        prisma.newsletterSubscriber.count({ where: { subscribedAt: { gte: previousStart, lt: previousEnd } } }),
        prisma.newsletterSubscriber.count({ where: { unsubscribedAt: { gte: currentStart } } }),
        prisma.newsletterSubscriber.count({ where: { unsubscribedAt: { gte: previousStart, lt: previousEnd } } }),

        // ── Séries temporais 
        // `bucket` vem de PERIOD_BUCKET (whitelist 'day'|'week'|'month'), nunca
        // do request direto — por isso é seguro interpolar no date_trunc, que
        // não aceita placeholder com tipo inferido.
        prisma.$queryRawUnsafe<SeriesRow[]>(`
            SELECT date_trunc('${bucket}', "createdAt") AS bucket, count(*) AS value
            FROM "PostLike" WHERE "createdAt" >= $1
            GROUP BY 1 ORDER BY 1
        `, currentStart),
        prisma.$queryRawUnsafe<SeriesRow[]>(`
            SELECT date_trunc('${bucket}', "createdAt") AS bucket, count(*) AS value
            FROM "Comment" WHERE "createdAt" >= $1
            GROUP BY 1 ORDER BY 1
        `, currentStart),
        prisma.$queryRawUnsafe<SeriesRow[]>(`
            SELECT date_trunc('${bucket}', "createdAt") AS bucket, count(*) AS value
            FROM "User" WHERE "createdAt" >= $1
            GROUP BY 1 ORDER BY 1
        `, currentStart),
        prisma.$queryRawUnsafe<SeriesRow[]>(`
            SELECT date_trunc('${bucket}', "createdAt") AS bucket, coalesce(sum(amount), 0) AS value
            FROM "Donation"
            WHERE "createdAt" >= $1 AND status = 'COMPLETED' AND currency = 'BRL'
            GROUP BY 1 ORDER BY 1
        `, currentStart),

        // ── Histórico mensal de 12 meses (sempre 12m, contexto de longo prazo)
        prisma.$queryRaw<MonthRow[]>`
            SELECT
                date_trunc('month', p."publishedAt") AS month,
                coalesce(sum(p.views), 0)            AS views,
                count(p.id)                          AS posts,
                coalesce(sum(p."commentsCount"), 0)  AS comments,
                coalesce(sum(p.likes), 0)            AS likes
            FROM "Post" p
            WHERE p.status = 'PUBLISHED' AND p."publishedAt" >= ${since12m}
            GROUP BY 1 ORDER BY 1
        `,

        // ── Top posts (todos os tempos)
        // `id` é obrigatório: a rota de edição é /admin/posts/[id]/edit.
        prisma.post.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { views: 'desc' },
            take: 10,
            select: {
                id: true, slug: true, views: true, likes: true, commentsCount: true,
                publishedAt: true, readingTime: true,
                translations: { select: { locale: true, title: true } },
                postTags: { select: { tag: true }, take: 1 },
            },
        }),

        // ── Post destaque do período
        prisma.post.findFirst({
            where: { status: 'PUBLISHED', publishedAt: { gte: currentStart } },
            orderBy: { views: 'desc' },
            select: {
                id: true, slug: true, views: true, likes: true, commentsCount: true, publishedAt: true,
                translations: { select: { locale: true, title: true } },
            },
        }),

        // ── Performance por tag: não só contagem, mas views/likes
        prisma.$queryRaw<TagRow[]>`
            SELECT
                pt.tag,
                count(DISTINCT p.id)                AS posts,
                coalesce(sum(p.views), 0)           AS views,
                coalesce(sum(p.likes), 0)           AS likes,
                coalesce(sum(p."commentsCount"), 0) AS comments
            FROM "PostTag" pt
            JOIN "Post" p ON p.id = pt."postId" AND p.status = 'PUBLISHED'
            GROUP BY pt.tag
            ORDER BY views DESC
            LIMIT 8
        `,

        // ── Rascunhos
        prisma.post.findMany({
            where: { status: 'DRAFT' },
            orderBy: { updatedAt: 'desc' },
            take: 5,
            select: {
                id: true, slug: true, updatedAt: true,
                translations: { select: { locale: true, title: true } },
            },
        }),

        // ── Comentários recentes (feed de moderação)
        prisma.comment.findMany({
            orderBy: { createdAt: 'desc' },
            take: 8,
            select: {
                id: true, bodyMd: true, score: true, createdAt: true, editedAt: true,
                author: { select: { id: true, banned: true, ...AVATAR_SELECT } },
                post: {
                    select: {
                        slug: true,
                        translations: { select: { locale: true, title: true } },
                    },
                },
            },
        }),

        // ── Saúde de conteúdo
        prisma.post.count({ where: { status: 'PUBLISHED' } }),
        prisma.$queryRaw<{ locale: string; count: bigint }[]>`
            SELECT t.locale, count(DISTINCT t."postId") AS count
            FROM "PostTranslation" t
            JOIN "Post" p ON p.id = t."postId" AND p.status = 'PUBLISHED'
            GROUP BY t.locale
        `,
        prisma.post.count({
            where: { status: 'PUBLISHED', publishedAt: { lt: since30d }, commentsCount: 0 },
        }),
        prisma.post.aggregate({
            where: { status: 'PUBLISHED' },
            _avg: { readingTime: true, views: true },
        }),

        // ── Newsletter
        Promise.all([
            prisma.newsletterSubscriber.count(),
            prisma.newsletterSubscriber.count({ where: { isConfirmed: true, unsubscribedAt: null } }),
            prisma.newsletterSubscriber.count({ where: { isConfirmed: false, unsubscribedAt: null } }),
            prisma.newsletterSubscriber.count({ where: { unsubscribedAt: { not: null } } }),
        ]).then(([total, confirmed, pending, unsubscribed]) => ({ total, confirmed, pending, unsubscribed })),
        prisma.campaign.findFirst({
            where: { status: 'SENT', sentAt: { not: null } },
            orderBy: { sentAt: 'desc' },
            select: { id: true, subject: true, sentAt: true, totalRecipients: true, sentCount: true, openCount: true, failedCount: true },
        }),
        prisma.campaign.aggregate({
            where: { status: 'SENT' },
            _sum: { sentCount: true, openCount: true, failedCount: true }, _count: { id: true },
        }),

        // ── Moderação
        prisma.suspiciousComment.count(),
        prisma.suspiciousComment.count({ where: { createdAt: { gte: since72h } } }),
        prisma.user.count({ where: { banned: true } }),
        prisma.user.findMany({
            where: { banned: true }, orderBy: { bannedAt: 'desc' }, take: 5,
            select: { id: true, username: true, bannedAt: true, banReason: true },
        }),
        prisma.user.count({ where: { emailVerified: false, createdAt: { gte: since30d } } }),
        prisma.donation.findMany({
            where: { status: 'PENDING', createdAt: { lt: since24h } },
            orderBy: { createdAt: 'asc' }, take: 5,
            select: { id: true, name: true, amount: true, currency: true, provider: true, createdAt: true },
        }),
        prisma.campaign.findMany({
            where: { status: 'SENT', failedCount: { gt: 0 } },
            orderBy: { sentAt: 'desc' }, take: 5,
            select: { id: true, subject: true, sentAt: true, sentCount: true, failedCount: true },
        }),
        prisma.campaign.count({ where: { status: 'SCHEDULED' } }),
        prisma.$queryRaw<{ count: bigint }[]>`
            SELECT count(*) AS count FROM "Post" p
            WHERE p.status = 'PUBLISHED'
              AND (SELECT count(*) FROM "PostTranslation" t WHERE t."postId" = p.id) < 2
        `,

        // ── Doações
        prisma.donation.findMany({
            where: { status: 'COMPLETED' }, orderBy: { createdAt: 'desc' }, take: 10,
            select: { id: true, name: true, amount: true, currency: true, coffees: true, provider: true, createdAt: true, isPrivate: true, message: true },
        }),
        prisma.donation.findMany({
            where: { status: 'COMPLETED', currency: 'BRL' }, orderBy: { amount: 'desc' }, take: 10,
            select: { id: true, name: true, amount: true, coffees: true, provider: true, createdAt: true, isPrivate: true },
        }),
        prisma.donation.groupBy({
            by: ['provider'],
            where: { status: 'COMPLETED' },
            _count: { id: true }, _sum: { amount: true },
        }),
        prisma.$queryRaw<{ count: bigint }[]>`
            SELECT count(*) AS count FROM (
                SELECT "userId" FROM "Donation"
                WHERE status = 'COMPLETED' AND "userId" IS NOT NULL
                GROUP BY "userId" HAVING count(*) > 1
            ) repeat
        `,
    ]);

    // ── Derivados: overview
    const totalViews = blogStats._sum.views ?? 0;
    const totalLikes = blogStats._sum.likes ?? 0;
    const totalComments = blogStats._sum.commentsCount ?? 0;
    const totalPosts = blogStats._count.id;

    // ── Derivados: funil views → likes → comentários
    const funnel = {
        views: totalViews,
        likes: totalLikes,
        comments: totalComments,
        likeRate: rate(totalLikes, totalViews),
        commentRate: rate(totalComments, totalViews),
        // Dos que curtiram, quantos também comentaram — proxy de profundidade.
        commentPerLike: rate(totalComments, totalLikes),
    };

    // ── Derivados: saúde de conteúdo
    const coverage = Object.fromEntries(translationCoverage.map((r) => [r.locale, n(r.count)]));
    const contentHealth = {
        publishedTotal,
        translationCoverage: {
            pt: coverage.pt ?? 0,
            en: coverage.en ?? 0,
            ptPercent: rate(coverage.pt ?? 0, publishedTotal),
            enPercent: rate(coverage.en ?? 0, publishedTotal),
        },
        untranslatedPosts: n(untranslatedDrafts[0]?.count),
        orphanPosts,
        avgReadingTime: Math.round(readingTimeAgg._avg.readingTime ?? 0),
        avgViewsPerPost: Math.round(readingTimeAgg._avg.views ?? 0),
        publishVelocity: {
            current: postsCurrent,
            previous: postsPrevious,
            growth: growthPercent(postsCurrent, postsPrevious),
            perWeek: Math.round((postsCurrent / days) * 7 * 10) / 10,
        },
    };

    // ── Derivados: newsletter
    const globalOpenRate = rate(campaignAgg._sum.openCount ?? 0, campaignAgg._sum.sentCount ?? 0);
    const lastCampaignOpenRate = lastCampaign?.sentCount
        ? rate(lastCampaign.openCount, lastCampaign.sentCount)
        : null;
    const netSubs = subsCurrent - unsubsCurrent;
    const netSubsPrevious = subsPrevious - unsubsPrevious;

    // ── Alertas priorizados
    const alerts: Alert[] = [];

    if (stalePendingDonations.length > 0) {
        alerts.push({
            id: 'stale-donations',
            kind: 'staleDonations',
            severity: 'critical',
            count: stalePendingDonations.length,
            href: '/admin/donations',
        });
    }
    const totalFailed = failingCampaigns.reduce((s, c) => s + c.failedCount, 0);
    if (totalFailed > 0) {
        alerts.push({
            id: 'failing-campaigns',
            kind: 'failingCampaigns',
            severity: 'critical',
            count: totalFailed,
            meta: { campaigns: failingCampaigns.length },
            href: '/admin/newsletter/campaigns',
        });
    }
    if (suspicious72h > 0) {
        alerts.push({
            id: 'suspicious-recent',
            kind: 'suspiciousComments',
            severity: 'warning',
            count: suspicious72h,
            href: '/admin/suspicious-comments',
        });
    } else if (suspiciousUnreviewed > 0) {
        alerts.push({
            id: 'suspicious-backlog',
            kind: 'suspiciousBacklog',
            severity: 'info',
            count: suspiciousUnreviewed,
            href: '/admin/suspicious-comments',
        });
    }
    if (contentHealth.untranslatedPosts > 0) {
        alerts.push({
            id: 'untranslated',
            kind: 'untranslatedPosts',
            severity: 'warning',
            count: contentHealth.untranslatedPosts,
            href: '/admin/posts',
        });
    }
    if (newsletterStats.pending > 0) {
        alerts.push({
            id: 'pending-subs',
            kind: 'pendingSubscribers',
            severity: newsletterStats.pending > newsletterStats.confirmed ? 'warning' : 'info',
            count: newsletterStats.pending,
            href: '/admin/newsletter',
        });
    }
    if (orphanPosts > 0) {
        alerts.push({
            id: 'orphan-posts',
            kind: 'orphanPosts',
            severity: 'info',
            count: orphanPosts,
            href: '/admin/posts',
        });
    }
    if (unverifiedUsers > 0) {
        alerts.push({
            id: 'unverified-users',
            kind: 'unverifiedUsers',
            severity: 'info',
            count: unverifiedUsers,
            href: null,
        });
    }
    if (draftPosts.length > 0) {
        alerts.push({
            id: 'stale-drafts',
            kind: 'staleDrafts',
            severity: 'info',
            count: draftPosts.length,
            href: '/admin/posts',
        });
    }

    alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.count - a.count);

    // ── Séries: preenche buckets vazios para o gráfico não ficar furado ───────
    // date_trunc devolve timestamps alinhados em UTC, então o cursor também
    // caminha em UTC — comparar com hora local deslocaria as chaves.
    const bucketKey = (d: Date) =>
        bucket === 'month' ? d.toISOString().slice(0, 7) : d.toISOString().slice(0, 10);

    function buildBuckets(): Date[] {
        const cursor = new Date(Date.UTC(
            currentStart.getUTCFullYear(),
            currentStart.getUTCMonth(),
            currentStart.getUTCDate(),
        ));
        if (bucket === 'month') cursor.setUTCDate(1);
        if (bucket === 'week') {
            // date_trunc('week') do Postgres usa semana ISO, que começa na
            // segunda. getUTCDay() é domingo-based (0 = domingo), então o
            // deslocamento é (dia + 6) % 7 — sem isso as chaves não casam e a
            // série semanal sai inteira zerada.
            const isoDay = (cursor.getUTCDay() + 6) % 7;
            cursor.setUTCDate(cursor.getUTCDate() - isoDay);
        }

        const out: Date[] = [];
        while (cursor <= now) {
            out.push(new Date(cursor));
            if (bucket === 'day') cursor.setUTCDate(cursor.getUTCDate() + 1);
            else if (bucket === 'week') cursor.setUTCDate(cursor.getUTCDate() + 7);
            else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
        }
        return out;
    }

    const buckets = buildBuckets();

    function fillSeries(rows: SeriesRow[]): { bucket: string; value: number }[] {
        const map = new Map(rows.map((r) => [bucketKey(r.bucket as Date), n(r.value)]));
        return buckets.map((d) => ({
            bucket: d.toISOString(),
            value: map.get(bucketKey(d)) ?? 0,
        }));
    }

    const pickTitle = (translations: { locale: string; title: string }[], fallback: string) =>
        translations.find((t) => t.locale === 'pt')?.title
        ?? translations[0]?.title
        ?? fallback;

    return NextResponse.json({
        collectedAt: now.toISOString(),
        period,
        window: { days, currentStart: currentStart.toISOString(), previousStart: previousStart.toISOString() },
        bucket,

        overview: {
            totalRaisedBrl: donationStats._sum.amount ?? 0,
            totalSupporters: donationStats._count.id,
            avgTicketBrl: Math.round(donationStats._avg.amount ?? 0),
            totalViews, totalLikes, totalComments, totalPosts,
            totalCommentsAll,
        },

        // Comparações no período selecionado.
        deltas: {
            users: { current: usersCurrent, previous: usersPrevious, growth: growthPercent(usersCurrent, usersPrevious) },
            likes: { current: likesCurrent, previous: likesPrevious, growth: growthPercent(likesCurrent, likesPrevious) },
            comments: { current: commentsCurrent, previous: commentsPrevious, growth: growthPercent(commentsCurrent, commentsPrevious) },
            posts: { current: postsCurrent, previous: postsPrevious, growth: growthPercent(postsCurrent, postsPrevious) },
            donations: {
                current: { count: donationsCurrent._count.id, amountBrl: donationsCurrent._sum.amount ?? 0 },
                previous: { count: donationsPrevious._count.id, amountBrl: donationsPrevious._sum.amount ?? 0 },
                countGrowth: growthPercent(donationsCurrent._count.id, donationsPrevious._count.id),
                amountGrowth: growthPercent(donationsCurrent._sum.amount ?? 0, donationsPrevious._sum.amount ?? 0),
            },
            subscribers: {
                gained: subsCurrent, lost: unsubsCurrent, net: netSubs,
                previousNet: netSubsPrevious,
                growth: growthPercent(netSubs, netSubsPrevious),
                churnRate: rate(unsubsCurrent, newsletterStats.confirmed + unsubsCurrent),
            },
        },

        funnel,
        contentHealth,
        alerts,

        newsletter: {
            total: newsletterStats.total,
            confirmed: newsletterStats.confirmed,
            pending: newsletterStats.pending,
            unsubscribed: newsletterStats.unsubscribed,
            confirmationRate: rate(newsletterStats.confirmed, newsletterStats.total),
            globalOpenRate,
            campaignsSent: campaignAgg._count.id,
            scheduledCampaigns,
            lastCampaign: lastCampaign ? {
                id: lastCampaign.id,
                subject: lastCampaign.subject,
                sentAt: lastCampaign.sentAt,
                sentCount: lastCampaign.sentCount,
                openCount: lastCampaign.openCount,
                failedCount: lastCampaign.failedCount,
                openRate: lastCampaignOpenRate,
            } : null,
        },

        moderation: {
            suspiciousUnreviewed, suspicious72h, bannedUsers,
            recentBans: recentBans.map((u) => ({
                id: u.id, username: u.username, bannedAt: u.bannedAt, banReason: u.banReason,
            })),
            recentComments: recentComments.map((c) => ({
                id: c.id,
                excerpt: c.bodyMd.length > 140 ? `${c.bodyMd.slice(0, 140)}…` : c.bodyMd,
                score: c.score,
                createdAt: c.createdAt,
                edited: c.editedAt !== null,
                author: c.author,
                postSlug: c.post.slug,
                postTitle: pickTitle(c.post.translations, c.post.slug),
            })),
        },

        health: {
            unverifiedUsers,
            stalePendingDonations: stalePendingDonations.map((d) => ({
                id: d.id, name: d.name, amount: d.amount, currency: d.currency,
                provider: d.provider, createdAt: d.createdAt,
            })),
            failingCampaigns: failingCampaigns.map((c) => ({
                id: c.id, subject: c.subject, sentAt: c.sentAt,
                sentCount: c.sentCount, failedCount: c.failedCount,
                failRate: rate(c.failedCount, c.sentCount),
            })),
        },

        donations: {
            recent: recentDonations,
            top: topDonations,
            providerMix: providerMix.map((p) => ({
                provider: p.provider,
                count: p._count.id,
                amount: p._sum.amount ?? 0,
            })),
            repeatDonors: n(repeatDonors[0]?.count),
        },

        drafts: draftPosts.map((p) => ({
            id: p.id, slug: p.slug,
            title: pickTitle(p.translations, p.slug),
            locales: p.translations.map((t) => t.locale),
            updatedAt: p.updatedAt,
        })),

        highlight: topPostPeriod ? {
            id: topPostPeriod.id,
            slug: topPostPeriod.slug,
            title: pickTitle(topPostPeriod.translations, topPostPeriod.slug),
            views: topPostPeriod.views,
            likes: topPostPeriod.likes,
            commentsCount: topPostPeriod.commentsCount,
            publishedAt: topPostPeriod.publishedAt,
        } : null,

        charts: {
            monthly: monthlyStats.map((r) => ({
                month: (r.month as Date).toISOString().slice(0, 7),
                views: n(r.views), posts: n(r.posts),
                comments: n(r.comments), likes: n(r.likes),
            })),
            // Engajamento agora vem da data real do evento.
            engagement: (() => {
                const likes = fillSeries(likesSeries);
                const comments = fillSeries(commentsSeries);
                return likes.map((l, i) => ({
                    bucket: l.bucket,
                    likes: l.value,
                    comments: comments[i]?.value ?? 0,
                }));
            })(),
            audience: (() => {
                const users = fillSeries(usersSeries);
                const don = fillSeries(donationsSeries);
                return users.map((u, i) => ({
                    bucket: u.bucket,
                    users: u.value,
                    donationsBrl: don[i]?.value ?? 0,
                }));
            })(),
            topPosts: topPosts.map((p) => ({
                id: p.id,
                slug: p.slug,
                title: pickTitle(p.translations, p.slug),
                views: p.views, likes: p.likes, commentsCount: p.commentsCount,
                publishedAt: p.publishedAt,
                readingTime: p.readingTime,
                engagementRate: rate(p.likes + p.commentsCount, p.views),
                locales: p.translations.map((t) => t.locale),
                tag: p.postTags[0]?.tag ?? null,
            })),
            tagPerformance: tagPerformance.map((r) => ({
                tag: r.tag,
                posts: n(r.posts),
                views: n(r.views),
                likes: n(r.likes),
                comments: n(r.comments),
                avgViews: n(r.posts) > 0 ? Math.round(n(r.views) / n(r.posts)) : 0,
            })),
        },
    }, {
        headers: { 'Cache-Control': 'private, max-age=30' },
    });
}
