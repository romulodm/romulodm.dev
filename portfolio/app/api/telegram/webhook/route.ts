// app/api/telegram/webhook/route.ts
// Receives Telegram updates for the /status command.

import { NextRequest, NextResponse } from 'next/server';

import {
    DEFAULT_SECONDS,
    clearStatus,
    parseStatusCommand,
    setStatus,
} from '@/lib/presence/status';

export const dynamic = 'force-dynamic';

/**
 * Why the webhook points at the site.
 *
 * Outbound notifications are sent by the worker, straight to the Bot API
 * (worker/lib/telegram.ts). Nothing there listens for updates, and the /status
 * command needs Redis, which the site already talks to. Telegram delivering
 * the update here stores the status in one hop.
 *
 * The reply below is deliberately not shared with the worker's sender: it is
 * plain text (see the comment in `reply`) and must never throw, while the
 * worker's sender uses MarkdownV2 and throws so BullMQ can retry. Sharing would
 * mean a new workspace package for about fifteen lines.
 *
 * Two checks guard the route, and both matter:
 *
 *   - the secret token, which Telegram echoes in a header on every delivery and
 *     nobody else knows, proves the request came from Telegram;
 *   - the chat id, which proves it came from Romulo's chat and not from someone
 *     else who found the bot by name and typed /status.
 *
 * Every answer is 200. Telegram retries any other status with backoff and then
 * starts dropping updates, so a rejected request that returns 401 would have
 * the same visible effect as an outage.
 */

const TELEGRAM_API = 'https://api.telegram.org';

type Update = {
    message?: {
        text?: string;
        chat?: { id?: number | string };
    };
};

const OK = NextResponse.json({ ok: true });

async function reply(chatId: number | string, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;

    try {
        await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Plain text on purpose: MarkdownV2 would need the status text
            // escaped, and a status is free-form text typed on a phone.
            body: JSON.stringify({ chat_id: chatId, text }),
            cache: 'no-store',
            signal: AbortSignal.timeout(8000),
        });
    } catch (error) {
        console.error('[telegram] reply failed:', error);
    }
}

function formatUntil(until: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
    }).format(new Date(until));
}

export async function POST(request: NextRequest) {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret) {
        console.error('[telegram] TELEGRAM_WEBHOOK_SECRET is not set; update ignored');
        return OK;
    }

    if (request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
        return OK;
    }

    let update: Update;
    try {
        update = (await request.json()) as Update;
    } catch {
        return OK;
    }

    const chatId = update.message?.chat?.id;
    const text = update.message?.text?.trim();
    if (!chatId || !text) return OK;

    if (String(chatId) !== String(process.env.TELEGRAM_CHAT_ID)) return OK;

    // Group chats deliver "/status@meu_bot algo"; strip the bot mention.
    const match = text.match(/^\/status(?:@\w+)?\b([\s\S]*)$/i);
    if (!match) return OK;

    const rest = match[1].trim();

    if (!rest) {
        await reply(
            chatId,
            'Use: /status em foco 2h — a duração no fim é opcional (m, h ou d; padrão '
                + `${DEFAULT_SECONDS / 3600}h). Para limpar: /status off`,
        );
        return OK;
    }

    if (/^(off|limpar|clear|fim)$/i.test(rest)) {
        try {
            await clearStatus();
            await reply(chatId, 'Status limpo. O site volta a mostrar "disponível".');
        } catch (error) {
            console.error('[telegram] clear failed:', error);
            await reply(chatId, 'Não consegui limpar o status agora.');
        }
        return OK;
    }

    const parsed = parseStatusCommand(rest);
    if (!parsed) return OK;

    try {
        const presence = await setStatus(parsed.label.slice(0, 60), parsed.seconds);
        await reply(chatId, `Status no ar: "${presence.label}" até ${formatUntil(presence.until)}.`);
    } catch (error) {
        console.error('[telegram] set failed:', error);
        await reply(chatId, 'Não consegui salvar o status agora.');
    }

    return OK;
}
