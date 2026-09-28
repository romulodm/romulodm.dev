/**
 * telegram-format.ts
 *
 * Pure formatting for every message the worker sends to Telegram. Nothing here
 * reads the network or the database, so the whole file is unit-testable and
 * the smoke script can render every message type without sending anything.
 *
 * This used to live in a separate Python service (bot/main.py) that the worker
 * reached over HTTP. It moved here when the site got its own server: the
 * service slept on a free plan, added a cold start to every first message, and
 * kept a second shared secret whose only job was to guard the hop between two
 * processes owned by the same person.
 *
 * Payload types for the queued notifications come from `NotificationJob` in
 * @romulo/queues, so the producer, the queue and the formatter share one
 * definition. The Python version validated them with Pydantic at the HTTP
 * boundary; with no boundary left, the compiler does that job.
 */

import type { NotificationJob } from "@romulo/queues";

// ── MarkdownV2 escaping ───────────────────────────────────────────────────────

/*
 * MarkdownV2 has THREE sets of reserved characters, not one, and escaping too
 * much is as broken as escaping too little. Outside plain text an extra
 * backslash does not disappear: it shows up in the message, or ends up inside
 * the URL. Both failures are silent — Telegram answers 200.
 *
 *   plain text        -> all 18 reserved characters
 *   inside `code`     -> only ` and \
 *   inside (url)      -> only ) and \
 *
 * https://core.telegram.org/bots/api#markdownv2-style
 */
const MARKDOWN_V2_SPECIALS = /([_*[\]()~`>#+\-=|{}.!\\])/g;
const CODE_SPECIALS = /([`\\])/g;
const LINK_URL_SPECIALS = /([)\\])/g;

/** Plain text: escapes the 18 reserved characters in a single pass. */
export function escape(text: string): string {
    return text.replace(MARKDOWN_V2_SPECIALS, "\\$1");
}

/** Content of a code span (between backticks). */
export function escapeCode(text: string): string {
    return text.replace(CODE_SPECIALS, "\\$1");
}

/** URL inside the `(...)` of an inline link. */
export function escapeUrl(url: string): string {
    return url.replace(LINK_URL_SPECIALS, "\\$1");
}

/**
 * Cuts BEFORE escaping, never after.
 *
 * Cutting an already-escaped string can split a `\x` pair or leave an entity
 * open, and Telegram then answers 400 instead of delivering a truncated
 * message. The API limit is 4096 characters per message, and escaping can
 * double the length of punctuation-heavy text.
 *
 * Counts code points rather than UTF-16 units so the cut never lands in the
 * middle of a surrogate pair (an emoji in a comment author's name, say).
 */
export function clamp(text: string, limit: number): string {
    const chars = Array.from(text);
    return chars.length <= limit ? text : chars.slice(0, limit).join("").trimEnd() + "…";
}

/** 1234567 -> "1,234,567". Commas are not reserved in MarkdownV2. */
export function groupThousands(n: number): string {
    return String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Caps for free-length fields. `preview` is already cut at the source (the
// contact route), so it is not clamped again here.
export const ALERT_MESSAGE_MAX = 1200;
export const POST_TITLE_MAX = 120;

// ── Payloads ──────────────────────────────────────────────────────────────────

export type CommentMessage = Omit<Extract<NotificationJob, { type: "comment" }>, "type">;
export type ContactMessage = Omit<Extract<NotificationJob, { type: "contact" }>, "type">;
export type ContactFloodMessage = Omit<Extract<NotificationJob, { type: "contact-flood" }>, "type">;

export type WorkerAlertMessage = {
    event: string;
    message: string;
    queue?: string;
    jobId?: string;
    environment?: string;
};

/**
 * Every number is for ONE reference day (yesterday, in America/Sao_Paulo),
 * never for "now". That is why `date` is part of the payload and required:
 * the old bot stamped the header with its own clock, which ran in UTC, and
 * showed a date that was not the one the numbers belonged to.
 */
export type DailyStatusMessage = {
    date: string; // YYYY-MM-DD
    totalSubscribers: number;
    newToday: number;
    unsubscribedToday: number;
    totalPosts: number;
    totalViews: number;
    viewsToday: number;
    visitors: number;
    sessions: number;
    avgTimeSec: number;
    likes: number;
    comments: number;
};

// ── Links ─────────────────────────────────────────────────────────────────────

export type LinkOptions = {
    /** Base URL for clickable links. Defaults to SITE_URL, then the public domain. */
    siteUrl?: string;
    /**
     * Site routes are prefixed by locale (`app/[locale]/...`). Without the
     * prefix the link goes through a redirect and loses the comment anchor.
     */
    locale?: string;
};

function resolveLinks(options: LinkOptions = {}): { site: string; locale: string } {
    const site = (options.siteUrl ?? process.env.SITE_URL ?? "https://romulodm.dev").replace(/\/+$/, "");
    const locale = (options.locale ?? process.env.SITE_LOCALE ?? "pt").replace(/^\/+|\/+$/g, "");
    return { site, locale };
}

// ── Formatters ────────────────────────────────────────────────────────────────

const TOPIC_LABELS: Record<string, string> = {
    FULL_TIME: "Vaga full-time",
    FREELANCE: "Projeto freelance",
    SAYING_HI: "Só um oi",
    BUG_REPORT: "Report de bug",
    OTHER: "Outro",
};

export function formatComment(p: CommentMessage, options?: LinkOptions): string {
    const { site, locale } = resolveLinks(options);
    // The anchor lands on the comment itself, not at the top of the post.
    const link = escapeUrl(`${site}/${locale}/blog/${p.postSlug}#${p.id}`);

    return (
        `💬 *Novo comentário*\n\n`
        + `👤 ${escape(p.author)}\n`
        + `📝 ${escape(clamp(p.postTitle, POST_TITLE_MAX))}\n\n`
        + `[Abrir o comentário](${link})`
    );
}

export function formatContact(p: ContactMessage, options?: LinkOptions): string {
    const { site, locale } = resolveLinks(options);
    const topic = TOPIC_LABELS[p.topic] ?? p.topic;
    // `?message=<id>` makes the admin page open the message modal directly,
    // even when the message is no longer on the first page or is hidden by a
    // saved filter.
    const link = escapeUrl(`${site}/${locale}/admin/contact?message=${encodeURIComponent(p.id)}`);

    return (
        `📬 *Nova mensagem de contato*\n\n`
        + `👤 ${escape(p.name)}\n`
        + `🏷 ${escape(topic)}\n\n`
        + `_${escape(p.preview)}_\n\n`
        + `[Abrir a mensagem](${link})`
    );
}

export function formatContactFlood(p: ContactFloodMessage): string {
    return (
        `🚨 *Teto do formulário de contato atingido*\n\n`
        + `Mais de *${p.max}* mensagens em ${p.windowMinutes} minutos\\. `
        + `O endpoint está recusando novos envios até a janela virar\\.\n\n`
        + `Ou é ataque, ou algo seu viralizou\\. Vale olhar o painel\\.`
    );
}

export function formatWorkerAlert(p: WorkerAlertMessage): string {
    // `event`, `queue`, `jobId` and `environment` go inside code spans: all of
    // them carry `.`, `_` or `-`, and plain-text escaping made each of those
    // show up on screen with a backslash in front.
    const lines = [
        `⚠️ *Alerta do worker*\n`,
        `🔔 Evento: \`${escapeCode(p.event)}\``,
        `💬 ${escape(clamp(p.message, ALERT_MESSAGE_MAX))}`,
    ];
    if (p.queue) lines.push(`📥 Fila: \`${escapeCode(p.queue)}\``);
    if (p.jobId) lines.push(`🆔 Job: \`${escapeCode(p.jobId)}\``);
    if (p.environment) lines.push(`🌍 Ambiente: \`${escapeCode(p.environment)}\``);

    return lines.join("\n");
}

/** YYYY-MM-DD -> dd/mm/yyyy. Anything else is shown as it came. */
export function refDateLabel(raw: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : raw;
}

export function formatDailyStatus(p: DailyStatusMessage): string {
    const trend =
        p.newToday > p.unsubscribedToday ? "📈"
        : p.unsubscribedToday > p.newToday ? "📉"
        : "➡️";
    const date = escape(refDateLabel(p.date));
    const total = Math.max(Math.trunc(p.avgTimeSec), 0);
    const minutes = Math.floor(total / 60);
    const seconds = String(total % 60).padStart(2, "0");
    // Counts are never negative, but a stray `-` in plain text is a 400, so
    // the grouped number still goes through the plain-text escape.
    const n = (value: number) => escape(groupThousands(value));

    // The `-` inside the code span is left raw on purpose: inside code only `
    // and \ need escaping, and a `\-` there would render as a literal
    // backslash.
    return (
        `📊 *Status diário* — ${date}\n\n`
        + `👥 Subscribers: *${n(p.totalSubscribers)}*\n`
        + `${trend} No dia: \`+${p.newToday}\` / \`-${p.unsubscribedToday}\`\n\n`
        + `📄 Posts publicados: *${n(p.totalPosts)}*\n`
        + `👁 Views acumuladas: *${n(p.totalViews)}*\n\n`
        + `*No dia*\n`
        + `👁 Views: *${n(p.viewsToday)}*\n`
        + `🧍 Visitantes: *${n(p.visitors)}*\n`
        + `🔁 Sessões: *${n(p.sessions)}*\n`
        + `⏱ Tempo médio: *${minutes}m ${seconds}s*\n`
        + `❤️ Likes: *${n(p.likes)}*\n`
        + `💬 Comentários: *${n(p.comments)}*`
    );
}
