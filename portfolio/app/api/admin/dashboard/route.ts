// app/api/admin/dashboard/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@romulo/database';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

function growthPercent(current: number, previous: number): number | null {
    if (previous === 0) return current > 0 ? 100 : null;
    return Math.round(((current - previous) / previous) * 100);
}

export async function GET() {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status });

    const now = new Date();

    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const since30d = new Date(now); since30d.setDate(now.getDate() - 30);
    const since24h = new Date(now); since24h.setHours(now.getHours() - 24);
    const since72h = new Date(now); since72h.setHours(now.getHours() - 72);
    const since12m = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    type MonthRow = { month: Date; views: bigint; posts: bigint; comments: bigint; likes: bigint };
    type TagRow = { tag: string; count: bigint };

    const [
        donationStats, recentDonations, topDonations, blogStats,
        usersThisWeek, usersLastWeek, donationsThisMonth, donationsLastMonth,
        topPostWeek, newsletterStats, lastCampaign, draftPosts,
        suspiciousUnreviewed, bannedUsers, recentBans,
        unverifiedUsers, stalePendingDonations, failingCampaigns,
        postsNoComments, viewsThisMonth, viewsLastMonth,
        // Novos: graficos
        monthlyStats, topPosts, tagDistribution, dailyEngagement,
    ] = await Promise.all([

        // ── Existentes ──────────────────────────────────────────────────────
        prisma.donation.aggregate({ where: { status: 'COMPLETED', currency: 'BRL' }, _sum: { amount: true }, _count: { id: true } }),
        prisma.donation.findMany({ where: { status: 'COMPLETED' }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, name: true, amount: true, currency: true, coffees: true, provider: true, createdAt: true, isPrivate: true } }),
        prisma.donation.findMany({ where: { status: 'COMPLETED', currency: 'BRL' }, orderBy: { amount: 'desc' }, take: 10, select: { id: true, name: true, amount: true, coffees: true, provider: true, createdAt: true, isPrivate: true } }),
        prisma.post.aggregate({ where: { status: 'PUBLISHED' }, _sum: { views: true, likes: true, commentsCount: true }, _count: { id: true } }),
        prisma.user.count({ where: { createdAt: { gte: startOfThisWeek } } }),
        prisma.user.count({ where: { createdAt: { gte: startOfLastWeek, lt: startOfThisWeek } } }),
        prisma.donation.aggregate({ where: { status: 'COMPLETED', currency: 'BRL', createdAt: { gte: startOfThisMonth } }, _sum: { amount: true }, _count: { id: true } }),
        prisma.donation.aggregate({ where: { status: 'COMPLETED', currency: 'BRL', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { amount: true }, _count: { id: true } }),
        prisma.post.findFirst({ where: { status: 'PUBLISHED', publishedAt: { gte: startOfThisWeek } }, orderBy: { views: 'desc' }, select: { slug: true, views: true, likes: true, commentsCount: true, translations: { where: { locale: 'pt' }, select: { title: true }, take: 1 } } }),
        Promise.all([
            prisma.newsletterSubscriber.count(),
            prisma.newsletterSubscriber.count({ where: { isConfirmed: true, unsubscribedAt: null } }),
            prisma.newsletterSubscriber.count({ where: { isConfirmed: false, unsubscribedAt: null } }),
        ]).then(([total, confirmed, pending]) => ({ total, confirmed, pending })),
        prisma.campaign.findFirst({ where: { status: 'SENT', sentAt: { not: null } }, orderBy: { sentAt: 'desc' }, select: { subject: true, sentAt: true, totalRecipients: true, sentCount: true, openCount: true, failedCount: true } }),
        prisma.post.findMany({ where: { status: 'DRAFT' }, orderBy: { updatedAt: 'desc' }, take: 5, select: { id: true, slug: true, updatedAt: true, translations: { where: { locale: 'pt' }, select: { title: true }, take: 1 } } }),
        prisma.suspiciousComment.count({ where: { createdAt: { gte: since72h } } }),
        prisma.user.count({ where: { banned: true } }),
        prisma.user.findMany({ where: { banned: true }, orderBy: { bannedAt: 'desc' }, take: 5, select: { id: true, username: true, bannedAt: true, banReason: true } }),
        prisma.user.count({ where: { emailVerified: false, createdAt: { gte: since30d } } }),
        prisma.donation.findMany({ where: { status: 'PENDING', createdAt: { lt: since24h } }, orderBy: { createdAt: 'asc' }, take: 5, select: { id: true, name: true, amount: true, currency: true, provider: true, createdAt: true } }),
        prisma.campaign.findMany({ where: { status: 'SENT', failedCount: { gt: 0 } }, orderBy: { sentAt: 'desc' }, take: 5, select: { id: true, subject: true, sentAt: true, sentCount: true, failedCount: true } }),
        prisma.post.count({ where: { status: 'PUBLISHED', publishedAt: { gte: since30d }, commentsCount: 0 } }),
        prisma.post.aggregate({ where: { status: 'PUBLISHED', publishedAt: { gte: startOfThisMonth } }, _sum: { views: true }, _count: { id: true } }),
        prisma.post.aggregate({ where: { status: 'PUBLISHED', publishedAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { views: true }, _count: { id: true } }),

        // ── Novos: grafico mensal (12 meses) ────────────────────────────────
        prisma.$queryRaw<MonthRow[]>`
            SELECT
                date_trunc('month', p."publishedAt") AS month,
                coalesce(sum(p.views), 0)            AS views,
                count(p.id)                          AS posts,
                coalesce(sum(p."commentsCount"), 0)  AS comments,
                coalesce(sum(p.likes), 0)            AS likes
            FROM "Post" p
            WHERE p.status = 'PUBLISHED'
              AND p."publishedAt" >= ${since12m}
            GROUP BY 1
            ORDER BY 1
        `,

        // ── Top 10 posts de todos os tempos ─────────────────────────────────
        prisma.post.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { views: 'desc' },
            take: 10,
            select: {
                slug: true, views: true, likes: true, commentsCount: true,
                publishedAt: true,
                translations: { where: { locale: 'pt' }, select: { title: true }, take: 1 },
                postTags: { select: { tag: true }, take: 1 },
            },
        }),

        // ── Distribuicao por tag ─────────────────────────────────────────────
        prisma.$queryRaw<TagRow[]>`
            SELECT tag, count(DISTINCT "postId") AS count
            FROM "PostTag"
            GROUP BY tag
            ORDER BY count DESC
            LIMIT 8
        `,

        // ── Engajamento diario (30 dias): likes + comentarios por dia ────────
        prisma.$queryRaw<{ day: Date; likes: bigint; comments: bigint }[]>`
            SELECT
                date_trunc('day', "publishedAt") AS day,
                coalesce(sum(likes), 0)          AS likes,
                coalesce(sum("commentsCount"), 0) AS comments
            FROM "Post"
            WHERE status = 'PUBLISHED'
              AND "publishedAt" >= ${since30d}
            GROUP BY 1
            ORDER BY 1
        `,
    ]);

    // Derivados
    const viewsThisMonthTotal = viewsThisMonth._sum.views ?? 0;
    const viewsLastMonthTotal = viewsLastMonth._sum.views ?? 0;
    const avgViewsThisMonth = viewsThisMonth._count.id > 0 ? Math.round(viewsThisMonthTotal / viewsThisMonth._count.id) : 0;
    const avgViewsLastMonth = viewsLastMonth._count.id > 0 ? Math.round(viewsLastMonthTotal / viewsLastMonth._count.id) : 0;
    const lastCampaignOpenRate = lastCampaign?.sentCount ? Math.round((lastCampaign.openCount / lastCampaign.sentCount) * 100) : null;

    return NextResponse.json({
        collectedAt: now.toISOString(),
        overview: {
            totalRaisedBrl: donationStats._sum.amount ?? 0,
            totalSupporters: donationStats._count.id,
            totalViews: blogStats._sum.views ?? 0,
            totalLikes: blogStats._sum.likes ?? 0,
            totalComments: blogStats._sum.commentsCount ?? 0,
            totalPosts: blogStats._count.id,
        },
        trends: {
            users: { thisWeek: usersThisWeek, lastWeek: usersLastWeek, growth: growthPercent(usersThisWeek, usersLastWeek) },
            donations: {
                thisMonth: { count: donationsThisMonth._count.id, amountBrl: donationsThisMonth._sum.amount ?? 0 },
                lastMonth: { count: donationsLastMonth._count.id, amountBrl: donationsLastMonth._sum.amount ?? 0 },
                countGrowth: growthPercent(donationsThisMonth._count.id, donationsLastMonth._count.id),
                amountGrowth: growthPercent(donationsThisMonth._sum.amount ?? 0, donationsLastMonth._sum.amount ?? 0),
            },
            topPostWeek: topPostWeek ? {
                slug: topPostWeek.slug,
                title: topPostWeek.translations[0]?.title ?? topPostWeek.slug,
                views: topPostWeek.views, likes: topPostWeek.likes, commentsCount: topPostWeek.commentsCount,
            } : null,
        },
        newsletter: {
            total: newsletterStats.total, confirmed: newsletterStats.confirmed, pending: newsletterStats.pending,
            confirmationRate: newsletterStats.total > 0 ? Math.round((newsletterStats.confirmed / newsletterStats.total) * 100) : 0,
            lastCampaign: lastCampaign ? {
                subject: lastCampaign.subject, sentAt: lastCampaign.sentAt,
                sentCount: lastCampaign.sentCount, openCount: lastCampaign.openCount,
                failedCount: lastCampaign.failedCount, openRate: lastCampaignOpenRate,
            } : null,
        },
        moderation: {
            suspiciousUnreviewed, bannedUsers,
            recentBans: recentBans.map((u) => ({ id: u.id, username: u.username, bannedAt: u.bannedAt, banReason: u.banReason })),
        },
        health: {
            unverifiedUsers,
            stalePendingDonations: stalePendingDonations.map((d) => ({ id: d.id, name: d.name, amount: d.amount, currency: d.currency, provider: d.provider, createdAt: d.createdAt })),
            failingCampaigns: failingCampaigns.map((c) => ({ id: c.id, subject: c.subject, sentAt: c.sentAt, sentCount: c.sentCount, failedCount: c.failedCount, failRate: c.sentCount > 0 ? Math.round((c.failedCount / c.sentCount) * 100) : 0 })),
        },
        engagement: {
            postsNoComments,
            views: {
                thisMonth: viewsThisMonthTotal, lastMonth: viewsLastMonthTotal,
                growth: growthPercent(viewsThisMonthTotal, viewsLastMonthTotal),
                avgThisMonth: avgViewsThisMonth, avgLastMonth: avgViewsLastMonth,
                avgGrowth: growthPercent(avgViewsThisMonth, avgViewsLastMonth),
            },
        },
        donations: { recent: recentDonations, top: topDonations },
        drafts: draftPosts.map((p) => ({ id: p.id, slug: p.slug, title: p.translations[0]?.title ?? p.slug, updatedAt: p.updatedAt })),

        // Novos campos para graficos
        charts: {
            monthly: monthlyStats.map((r) => ({
                month: (r.month as Date).toISOString().slice(0, 7),
                views: Number(r.views),
                posts: Number(r.posts),
                comments: Number(r.comments),
                likes: Number(r.likes),
            })),
            topPosts: topPosts.map((p) => ({
                slug: p.slug,
                title: p.translations[0]?.title ?? p.slug,
                views: p.views,
                likes: p.likes,
                commentsCount: p.commentsCount,
                publishedAt: p.publishedAt,
                tag: p.postTags[0]?.tag ?? null,
            })),
            tagDistribution: tagDistribution.map((r) => ({
                tag: r.tag,
                count: Number(r.count),
            })),
            dailyEngagement: dailyEngagement.map((r) => ({
                day: (r.day as Date).toISOString().slice(0, 10),
                likes: Number(r.likes),
                comments: Number(r.comments),
            })),
        },
    }, {
        headers: { 'Cache-Control': 'private, max-age=30' },
    });
}