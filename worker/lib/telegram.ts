/**
 * telegram.ts
 *
 * Sends the worker's notifications straight to the Telegram Bot API.
 *
 * Until September 2026 this file POSTed to a separate bridge service
 * (bot/main.py, on a free Render plan) that did the formatting and the
 * sending. The bridge is gone: the formatting now lives in telegram-format.ts
 * and the call below goes directly to api.telegram.org. What disappeared with
 * it, and why that matters here:
 *
 *   - the cold start. The bridge slept when idle, so the first message after a
 *     quiet spell waited tens of seconds and the timeouts had to be sized for
 *     that. Telegram answers in well under a second, so one short timeout is
 *     enough for every message type;
 *   - TELEGRAM_BOT_URL and TELEGRAM_NOTIFY_SECRET, which existed only to reach
 *     and authenticate the bridge. The worker now needs the same two variables
 *     the site's webhook already uses: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.
 */

import { UnrecoverableError } from "bullmq";
import { prisma } from "@romulo/database";

import { isDevelopment } from "./environment";
import { dayRange, getDailyStats, yesterdayDate } from "./ga4";
import {
    formatComment,
    formatContact,
    formatContactFlood,
    formatDailyStatus,
    formatWorkerAlert,
    type CommentMessage,
    type ContactFloodMessage,
    type ContactMessage,
    type DailyStatusMessage,
    type WorkerAlertMessage,
} from "./telegram-format";

const TELEGRAM_API = "https://api.telegram.org";

/**
 * Without `signal`, Node's `fetch` has no timeout at all, and a hung request
 * would hold the notification queue's single concurrency slot indefinitely.
 */
const TIMEOUT_MS = Number(process.env.TELEGRAM_TIMEOUT_MS ?? 10_000);

/** True when the worker has what it needs to send anything. */
export function telegramConfigured(): boolean {
    return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

// ── Core

/**
 * Sends one MarkdownV2 message to the configured chat.
 *
 * Errors propagate on purpose: the notification worker turns them into a
 * failed job, and BullMQ retries (`notificationJobOptions.attempts`).
 * Swallowing a 429 here would turn a rate limit into a lost message.
 */
export async function sendTelegram(text: string): Promise<void> {
    /*
     * A development worker uses the same bot and chat as production, so its
     * messages would land next to the real ones. Skipping here covers every
     * message type: alerts, contact, comments, daily-status. The job still
     * completes, so nothing piles up in the queue. `telegram:smoke:send` calls
     * the Bot API on its own and is not affected.
     */
    if (isDevelopment()) {
        console.info("[telegram] skipped: environment is development");
        return;
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Missing configuration does not fix itself between attempts.
    if (!token || !chatId) {
        throw new UnrecoverableError("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not set");
    }

    let res: Response;
    try {
        res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: "MarkdownV2",
                disable_web_page_preview: true,
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
    } catch (error) {
        // Timeouts and network failures are transient: a plain error, so
        // BullMQ retries. The URL is left out of the message because it
        // carries the bot token.
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Telegram unreachable (timeout ${TIMEOUT_MS}ms): ${reason}`);
    }

    if (res.ok) return;

    const body = await res.text().catch(() => "");
    const message = `Telegram error ${res.status}: ${body.slice(0, 500)}`;

    /*
     * A 4xx does not improve with repetition: a wrong token (401/404), a chat
     * the bot cannot write to (403), or a message Telegram cannot parse (400,
     * "can't parse entities" — an escaping bug). Retrying only delays the move
     * to the failed set. 408 and 429 are the exceptions; time fixes those.
     */
    const permanent =
        res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429;

    throw permanent ? new UnrecoverableError(message) : new Error(message);
}

// ── Handlers

export async function notifyWorkerAlert(alert: WorkerAlertMessage): Promise<void> {
    await sendTelegram(formatWorkerAlert(alert));
}

export async function notifyComment(comment: CommentMessage): Promise<void> {
    await sendTelegram(formatComment(comment));
}

export async function notifyContact(contact: ContactMessage): Promise<void> {
    await sendTelegram(formatContact(contact));
}

/**
 * One-off warning that the contact form's global cap was reached.
 *
 * Not "a message arrived" but "stopped accepting messages". The `SET NX EX` in
 * the contact route guarantees this fires at most once per window; there is no
 * deduplication here.
 */
export async function notifyContactFlood(flood: ContactFloodMessage): Promise<void> {
    await sendTelegram(formatContactFlood(flood));
}

/** Previous day's summary. See `buildDailyStatus` for the numbers. */
export async function sendDailyStatus(): Promise<void> {
    await sendTelegram(formatDailyStatus(await buildDailyStatus()));
}

/**
 * Builds the payload without sending it, so the numbers can be checked in
 * development without spending a message. See `scripts/ga4-check.ts`.
 *
 * Everything is for ONE reference day (`yesterdayDate()`), and the date goes
 * into the payload so the header matches the numbers.
 */
export async function buildDailyStatus(): Promise<DailyStatusMessage> {
    const date = yesterdayDate();
    const stats = await getDailyStats(date);

    // Closed window. A bare `gte` has no upper bound: "new today" would also
    // count whoever joined after midnight, up to 32h of data in a field
    // labelled as one day.
    const { start, end } = dayRange(date);
    const window = { gte: start, lt: end };

    const [
        likes,
        comments,
        newSubscribers,
        unsubscribed,
        totalSubscribers,
        totalPosts,
        viewsAggregate,
    ] = await Promise.all([
        prisma.postLike.count({ where: { createdAt: window } }),
        prisma.comment.count({ where: { createdAt: window } }),
        prisma.newsletterSubscriber.count({ where: { isConfirmed: true, subscribedAt: window } }),
        prisma.newsletterSubscriber.count({ where: { unsubscribedAt: window } }),
        prisma.newsletterSubscriber.count({ where: { isConfirmed: true, unsubscribedAt: null } }),
        prisma.post.count({ where: { status: "PUBLISHED" } }),
        prisma.post.aggregate({ _sum: { views: true } }),
    ]);

    return {
        date,
        totalSubscribers,
        newToday: newSubscribers,
        unsubscribedToday: unsubscribed,
        totalPosts,
        // `totalViews` is the running total from Postgres; GA4 only answers
        // for the day (`viewsToday`, `visitors`, `sessions`, `avgTimeSec`).
        totalViews: viewsAggregate._sum.views ?? 0,
        viewsToday: stats.pageviews,
        visitors: stats.visitors,
        sessions: stats.sessions,
        avgTimeSec: stats.avgSessionDuration,
        likes,
        comments,
    };
}
