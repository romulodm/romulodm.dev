import { prisma } from "@romulo/database";

const BOT_URL = process.env.TELEGRAM_BOT_URL!;
const BOT_SECRET = process.env.TELEGRAM_NOTIFY_SECRET!;

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface UmamiStats {
    visitors: { value: number };
    pageviews: { value: number };
    totaltime: { value: number };
}

// ── Umami Auth ────────────────────────────────────────────────────────────────

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getUmamiToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

    const res = await fetch(`${process.env.UMAMI_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: process.env.UMAMI_USER,
            password: process.env.UMAMI_PASSWORD,
        }),
    });

    if (!res.ok) throw new Error(`Umami login falhou ${res.status}`);

    const { token } = await res.json() as { token: string };
    cachedToken = { value: token, expiresAt: Date.now() + 23 * 60 * 60 * 1000 };
    return token;
}

// ── Core ──────────────────────────────────────────────────────────────────────

async function notifyBot(payload: object): Promise<void> {
    const res = await fetch(`${BOT_URL}/notify`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${BOT_SECRET}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Telegram bot error ${res.status}: ${body}`);
    }
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function notifyComment(comment: {
    id: string;
    author: string;
    postTitle: string;
    postSlug: string;
}): Promise<void> {
    await notifyBot({ type: "comment", ...comment });
}

export async function sendDailyStatus(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startAt = new Date(yesterday.setHours(0, 0, 0, 0)).getTime();
    const endAt = new Date(yesterday.setHours(23, 59, 59, 999)).getTime();

    const token = await getUmamiToken();
    const statsUrl = `${process.env.UMAMI_URL}/api/websites/${process.env.UMAMI_SITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`;
    const statsRes = await fetch(statsUrl, { headers: { Authorization: `Bearer ${token}` } });
    const stats = await statsRes.json() as UmamiStats;

    const since = new Date(startAt);
    const [likes, comments, newSubscribers, totalSubscribers] = await Promise.all([
        prisma.postLike.count({ where: { createdAt: { gte: since } } }),
        prisma.comment.count({ where: { createdAt: { gte: since } } }),
        prisma.newsletterSubscriber.count({ where: { isConfirmed: true, subscribedAt: { gte: since } } }),
        prisma.newsletterSubscriber.count({ where: { isConfirmed: true, unsubscribedAt: null } }),
    ]);

    const avgTime = stats.visitors.value > 0
        ? Math.round(stats.totaltime.value / stats.visitors.value)
        : 0;

    await notifyBot({
        type: "daily-status",
        totalSubscribers,
        newToday: newSubscribers,
        unsubscribedToday: 0,          // Umami não retorna isso — ajuste se tiver a query
        totalPosts: 0,           // adicione a query se quiser
        totalViews: stats.pageviews.value,
        viewsToday: stats.visitors.value,
        // campos extras que o bot ignora mas ficam no log
        avgTimeSec: avgTime,
        likes,
        comments,
        umamiUrl: process.env.UMAMI_SHARED_URL,
    });
}