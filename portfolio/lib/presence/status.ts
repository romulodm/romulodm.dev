import 'server-only';

import { getRedis } from '@/lib/redis';

import { isStatusPreset, type StatusPreset } from './status-presets';

/**
 * The manual status Romulo sets from Telegram ("in focus until 6pm").
 *
 * It lives in Redis with a TTL rather than in Postgres, because the whole point
 * of this value is that it expires on its own: a status nobody remembers to
 * clear is worse than no status at all. Redis deleting the key at the deadline
 * is the feature, not a shortcut around a migration.
 */

const KEY = 'presence:status';

/** Longest a status can last. A forgotten "travelling" should not outlive the trip. */
export const MAX_SECONDS = 72 * 3600;
/** Used when the command carries no duration. */
export const DEFAULT_SECONDS = 4 * 3600;

/** The locales the site is served in (see i18n/routing.ts). */
export type StatusLocale = 'pt' | 'en';

export type Presence = {
    /**
     * The text as typed, in Portuguese. Also the fallback for any locale
     * without its own entry in `labels`, and the only field older entries
     * stored in Redis have.
     */
    label: string;
    /** Per-locale text, from `/status em foco | heads down`. */
    labels?: Partial<Record<StatusLocale, string>>;
    /**
     * Set by a preset command (/foco). The card renders the preset through the
     * page's messages and ignores `label`, which still holds the Portuguese
     * text for anything that reads the raw value.
     */
    preset?: StatusPreset;
    /** ISO timestamp for when the status was set. */
    since: string;
    /** ISO timestamp for when it expires. */
    until: string;
};

export type StatusInput = Pick<Presence, 'label' | 'labels' | 'preset'>;

export async function getStatus(): Promise<Presence | null> {
    try {
        const raw = await getRedis().get(KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Presence;
        // The TTL already removes the key; this guards against a clock skew
        // between the write and the read.
        if (new Date(parsed.until).getTime() <= Date.now()) return null;

        // A preset removed from the table while a status using it is still
        // live would make the card look up a message key that no longer
        // exists. Dropping it falls back to the Portuguese label.
        if (parsed.preset !== undefined && !isStatusPreset(parsed.preset)) {
            delete parsed.preset;
        }

        return parsed;
    } catch {
        // A status nobody can read is not worth failing the whole card for.
        return null;
    }
}

export async function setStatus(input: StatusInput, seconds: number): Promise<Presence> {
    const ttl = Math.min(Math.max(Math.round(seconds), 60), MAX_SECONDS);
    const now = Date.now();

    const presence: Presence = {
        ...input,
        since: new Date(now).toISOString(),
        until: new Date(now + ttl * 1000).toISOString(),
    };

    await getRedis().set(KEY, JSON.stringify(presence), 'EX', ttl);
    return presence;
}

export async function clearStatus(): Promise<void> {
    await getRedis().del(KEY);
}

/** Longest text kept per locale; the card truncates long before this anyway. */
const MAX_LABEL = 60;

/**
 * Reads a duration token such as `2h`, `90m` or `3d`. Returns null for
 * anything else, including an empty string.
 */
export function parseDuration(token: string): number | null {
    const match = token.trim().match(/^(\d{1,3})\s*([hmd])$/i);
    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    return amount * (unit === 'm' ? 60 : unit === 'h' ? 3600 : 86_400);
}

/**
 * Parses the tail of `/status <text> [duration]`.
 *
 * The duration is optional and only recognised at the end, so a status that
 * happens to contain a number ("reunião 2h de retro") keeps its text: only a
 * trailing token shaped like `2h`, `90m` or `3d` is consumed.
 *
 * The text may carry one translation after a pipe, Portuguese first:
 * `/status em foco | heads down 2h`. Without a pipe the same text is shown in
 * every locale. More than two parts is rejected rather than guessed at, since
 * the site has two locales and a third part is more likely a typo than intent.
 */
export function parseStatusCommand(input: string): { status: StatusInput; seconds: number } | null {
    const text = input.trim().replace(/\s+/g, ' ');
    if (!text) return null;

    let body = text;
    let seconds = DEFAULT_SECONDS;

    const match = text.match(/\s(\d{1,3}\s*[hmd])$/i);
    if (match) {
        const head = text.slice(0, match.index).trim();
        // "/status 2h" alone has a duration but no text to show, so the whole
        // input is the text.
        if (head) {
            body = head;
            seconds = parseDuration(match[1]) ?? DEFAULT_SECONDS;
        }
    }

    const parts = body.split('|').map((part) => part.trim().slice(0, MAX_LABEL));
    if (parts.length > 2 || parts.some((part) => !part)) return null;

    const [pt, en] = parts;
    return {
        status: en ? { label: pt, labels: { pt, en } } : { label: pt },
        seconds,
    };
}
