// app/api/telegram/webhook/route.ts
// Receives Telegram updates for the bot's commands: /status and its presets
// (/foco, /reuniao, ...), /resumo, /saude and /comandos.

import { NextRequest, NextResponse } from 'next/server';

import ptMessages from '@/messages/pt.json';
import {
    DEFAULT_SECONDS,
    MAX_SECONDS,
    clearStatus,
    parseDuration,
    parseStatusCommand,
    setStatus,
    type Presence,
    type StatusInput,
} from '@/lib/presence/status';
import { STATUS_PRESETS, isStatusPreset, type StatusPreset } from '@/lib/presence/status-presets';
import { enqueueDailyStatusNow } from '@/lib/queues/notification.queue';
import { buildHealthReport } from '@/lib/telegram-health';

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

/**
 * A fresh response per request. A single module-level `NextResponse` would be
 * returned to every request, and a response body can only be read once: from
 * the second update on, the route would answer 500 and Telegram would redeliver
 * the update, so the command would run again.
 */
const ok = () => NextResponse.json({ ok: true });

/** The Portuguese label of a preset, for replies. The site uses the page's locale. */
function presetLabel(preset: StatusPreset): string {
    return ptMessages.home.built.presence.presets[preset];
}

const hours = (seconds: number) => `${seconds / 3600}h`;

/**
 * The reply to /comandos. /help and /start answer with it too: Telegram clients
 * suggest /help by convention and send /start when the chat is first opened.
 *
 * Keep it in sync with the dispatch in POST. If the commands are also
 * registered with setMyCommands (the menu Telegram shows when "/" is typed),
 * that list lives in Telegram and has to be updated by hand as well.
 */
const HELP = [
    'Status no site (traduzido para quem visita em inglês):',
    '',
    ...(Object.keys(STATUS_PRESETS) as StatusPreset[]).map(
        (preset) => `/${preset} → "${presetLabel(preset)}" por ${hours(STATUS_PRESETS[preset])}`,
    ),
    'Todos aceitam outra duração no fim: /foco 3h',
    '',
    '/status em foco | heads down 2h',
    `Texto livre. A parte depois do | aparece para quem visita em inglês; sem ela, o mesmo texto vale para os dois idiomas. A duração no fim é opcional: m, h ou d (padrão ${hours(DEFAULT_SECONDS)}, máximo ${hours(MAX_SECONDS)}).`,
    '',
    '/status off',
    'Limpa o status.',
    '',
    'Bot:',
    '',
    '/resumo',
    'Manda agora o resumo diário (os números de ontem, os mesmos das 08:00).',
    '',
    '/saude',
    'Testa banco, Redis, busca, worker e filas.',
    '',
    '/comandos',
    'Esta lista.',
].join('\n');

const STATUS_USAGE =
    'Use: /status em foco | heads down 2h. O texto depois do | é o inglês e é opcional; '
    + `a duração também (m, h ou d; padrão ${hours(DEFAULT_SECONDS)}). Para limpar: /status off. `
    + 'Atalhos prontos: /comandos';

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

async function applyStatus(chatId: number | string, input: StatusInput, seconds: number) {
    try {
        const presence = await setStatus(input, seconds);
        await reply(chatId, `Status no ar: ${describe(presence)} até ${formatUntil(presence.until)}.`);
    } catch (error) {
        console.error('[telegram] set failed:', error);
        await reply(chatId, 'Não consegui salvar o status agora.');
    }
}

function describe(presence: Presence): string {
    if (presence.preset) return `"${presetLabel(presence.preset)}"`;
    if (presence.labels?.en) return `"${presence.labels.pt ?? presence.label}" / "${presence.labels.en}"`;
    return `"${presence.label}"`;
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
        return ok();
    }

    if (request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
        return ok();
    }

    let update: Update;
    try {
        update = (await request.json()) as Update;
    } catch {
        return ok();
    }

    const chatId = update.message?.chat?.id;
    const text = update.message?.text?.trim();
    if (!chatId || !text) return ok();

    if (String(chatId) !== String(process.env.TELEGRAM_CHAT_ID)) return ok();

    // Group chats deliver "/status@meu_bot algo"; strip the bot mention.
    const match = text.match(/^\/(\w+)(?:@\w+)?\b([\s\S]*)$/i);
    if (!match) return ok();

    const command = match[1].toLowerCase();
    const rest = match[2].trim();

    if (command === 'comandos' || command === 'help' || command === 'start') {
        await reply(chatId, HELP);
        return ok();
    }

    if (isStatusPreset(command)) {
        const seconds = rest ? parseDuration(rest) : STATUS_PRESETS[command];
        if (seconds === null) {
            await reply(chatId, `Use: /${command} ou /${command} 3h (m, h ou d).`);
            return ok();
        }
        await applyStatus(chatId, { label: presetLabel(command), preset: command }, seconds);
        return ok();
    }

    if (command === 'resumo') {
        try {
            await enqueueDailyStatusNow();
            await reply(chatId, 'Pedido. O resumo chega em instantes, pelo worker.');
        } catch (error) {
            console.error('[telegram] daily-status enqueue failed:', error);
            await reply(chatId, 'Não consegui pedir o resumo: a fila não respondeu. Tente /saude.');
        }
        return ok();
    }

    if (command === 'saude') {
        try {
            await reply(chatId, await buildHealthReport());
        } catch (error) {
            console.error('[telegram] health report failed:', error);
            await reply(chatId, 'Não consegui montar o relatório de saúde.');
        }
        return ok();
    }

    // A typo such as /stauts would otherwise get no answer at all, which reads
    // the same as the webhook being down.
    if (command !== 'status') {
        await reply(chatId, `Não conheço /${command}. Mande /comandos para ver a lista.`);
        return ok();
    }

    if (!rest) {
        await reply(chatId, STATUS_USAGE);
        return ok();
    }

    if (/^(off|limpar|clear|fim)$/i.test(rest)) {
        try {
            await clearStatus();
            await reply(chatId, 'Status limpo. O site volta a mostrar "disponível".');
        } catch (error) {
            console.error('[telegram] clear failed:', error);
            await reply(chatId, 'Não consegui limpar o status agora.');
        }
        return ok();
    }

    const parsed = parseStatusCommand(rest);
    if (!parsed) {
        await reply(chatId, STATUS_USAGE);
        return ok();
    }

    await applyStatus(chatId, parsed.status, parsed.seconds);
    return ok();
}
