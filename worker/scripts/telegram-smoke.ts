/**
 * Renders one example of every Telegram message the worker sends.
 *
 *   npm run telegram:smoke          // print only, nothing leaves the machine
 *   npm run telegram:smoke:send     // also send each one to TELEGRAM_CHAT_ID
 *
 * Replaces bot/smoke_test.py. Printing catches layout mistakes; only sending
 * proves the escaping, because MarkdownV2 fails silently in two of its three
 * contexts (a stray backslash renders as text instead of raising an error).
 * With --send the script prints the text Telegram stored and the entities it
 * recognised, which is the one reliable check.
 *
 * Two scripts instead of a forwarded flag for the same reason as ga4-check.ts:
 * `npm --prefix worker run x -- --send` loses the flag on the way.
 *
 * Runs with cwd in `worker/` — `env.ts` resolves the .env as `../.env`.
 */

import "../env";

import {
    formatComment,
    formatContact,
    formatContactFlood,
    formatDailyStatus,
    formatWorkerAlert,
} from "../lib/telegram-format";

/*
 * Links use the public domain on purpose, not SITE_URL. In development SITE_URL
 * is http://localhost:3000, and Telegram silently drops inline links to
 * localhost: the message still arrives, but without the `text_link` entity,
 * so the one thing this script exists to check would go untested.
 */
const links = { siteUrl: "https://romulodm.dev", locale: "pt" };

const samples: Array<[string, string]> = [
    ["comment", formatComment({
        id: "cmt_123",
        author: "Ana (leitora).",
        postTitle: "Filas com BullMQ: retry, backoff & DLQ!",
        postSlug: "filas-com-bullmq",
    }, links)],
    ["contact", formatContact({
        id: "ctc_abc-123",
        name: "João_Silva",
        topic: "FREELANCE",
        preview: "Oi! Vi seu site (romulodm.dev) e queria falar sobre um projeto #1.",
    }, links)],
    ["contact-flood", formatContactFlood({ max: 30, windowMinutes: 60 })],
    ["worker-alert", formatWorkerAlert({
        event: "worker.job_failed",
        message: "connect ECONNREFUSED 10.0.0.2:6379 (redis-prod)",
        queue: "email-transactional",
        jobId: "job_42-a",
        environment: "production",
    })],
    ["daily-status", formatDailyStatus({
        date: "2026-09-27",
        totalSubscribers: 1234,
        newToday: 3,
        unsubscribedToday: 1,
        totalPosts: 18,
        totalViews: 45678,
        viewsToday: 321,
        visitors: 120,
        sessions: 150,
        avgTimeSec: 95,
        likes: 4,
        comments: 2,
    })],
];

async function send(text: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) throw new Error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not set");

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "MarkdownV2",
            disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json()) as {
        ok: boolean;
        description?: string;
        result?: { text?: string; entities?: Array<{ type: string; offset: number; length: number; url?: string }> };
    };

    if (!body.ok) {
        console.log(`  FAILED  ${res.status}: ${body.description}`);
        process.exitCode = 1;
        return;
    }
    console.log("  stored text:\n" + (body.result?.text ?? "").replace(/^/gm, "    "));
    for (const e of body.result?.entities ?? []) {
        const slice = (body.result?.text ?? "").slice(e.offset, e.offset + e.length);
        console.log(`  entity  ${e.type.padEnd(10)} ${JSON.stringify(slice)}${e.url ? ` -> ${e.url}` : ""}`);
    }
}

async function main() {
    const doSend = process.argv.includes("--send");

    for (const [name, text] of samples) {
        console.log(`\n── ${name} ${"─".repeat(Math.max(0, 60 - name.length))}`);
        console.log(text);
        if (doSend) await send(text);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
