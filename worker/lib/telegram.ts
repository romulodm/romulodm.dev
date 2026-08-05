import { prisma } from "@romulo/database";
import { getDailyStats, yesterdayDate } from "./ga4";

const BOT_URL = process.env.TELEGRAM_BOT_URL!;
const BOT_SECRET = process.env.TELEGRAM_NOTIFY_SECRET!;

// ── Core

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

// ── Handlers

export async function notifyWorkerAlert(alert: {
    event: string;
    message: string;
    queue?: string;
    jobId?: string;
    environment?: string;
}): Promise<void> {
    await notifyBot({ type: "worker-alert", ...alert });
}

export async function notifyComment(comment: {
    id: string;
    author: string;
    postTitle: string;
    postSlug: string;
}): Promise<void> {
    await notifyBot({ type: "comment", ...comment });
}

export async function sendDailyStatus(): Promise<void> {
    const date = yesterdayDate();
    const stats = await getDailyStats(date);

    const since = new Date(`${date}T00:00:00`);
    const [likes, comments, newSubscribers, totalSubscribers] = await Promise.all([
        prisma.postLike.count({ where: { createdAt: { gte: since } } }),
        prisma.comment.count({ where: { createdAt: { gte: since } } }),
        prisma.newsletterSubscriber.count({ where: { isConfirmed: true, subscribedAt: { gte: since } } }),
        prisma.newsletterSubscriber.count({ where: { isConfirmed: true, unsubscribedAt: null } }),
    ]);

    await notifyBot({
        type: "daily-status",
        totalSubscribers,
        newToday: newSubscribers,
        unsubscribedToday: 0,    // adicione a query se quiser
        totalPosts: 0,           // adicione a query se quiser
        totalViews: stats.pageviews,
        viewsToday: stats.visitors,
        // campos extras que o bot ignora mas ficam no log
        avgTimeSec: stats.avgSessionDuration,
        sessions: stats.sessions,
        likes,
        comments,
    });
}