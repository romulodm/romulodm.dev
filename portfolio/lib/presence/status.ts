import 'server-only';

import { getRedis } from '@/lib/redis';

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

export type Presence = {
    label: string;
    /** ISO timestamp for when the status was set. */
    since: string;
    /** ISO timestamp for when it expires. */
    until: string;
};

export async function getStatus(): Promise<Presence | null> {
    try {
        const raw = await getRedis().get(KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Presence;
        // The TTL already removes the key; this guards against a clock skew
        // between the write and the read.
        if (new Date(parsed.until).getTime() <= Date.now()) return null;

        return parsed;
    } catch {
        // A status nobody can read is not worth failing the whole card for.
        return null;
    }
}

export async function setStatus(label: string, seconds: number): Promise<Presence> {
    const ttl = Math.min(Math.max(Math.round(seconds), 60), MAX_SECONDS);
    const now = Date.now();

    const presence: Presence = {
        label,
        since: new Date(now).toISOString(),
        until: new Date(now + ttl * 1000).toISOString(),
    };

    await getRedis().set(KEY, JSON.stringify(presence), 'EX', ttl);
    return presence;
}

export async function clearStatus(): Promise<void> {
    await getRedis().del(KEY);
}

/**
 * Parses the tail of `/status <text> [duration]`.
 *
 * The duration is optional and only recognised at the end, so a status that
 * happens to contain a number ("reunião 2h de retro") keeps its text: only a
 * trailing token shaped like `2h`, `90m` or `3d` is consumed.
 */
export function parseStatusCommand(input: string): { label: string; seconds: number } | null {
    const text = input.trim().replace(/\s+/g, ' ');
    if (!text) return null;

    const match = text.match(/\s(\d{1,3})\s*([hmd])$/i);
    if (!match) return { label: text, seconds: DEFAULT_SECONDS };

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const seconds = amount * (unit === 'm' ? 60 : unit === 'h' ? 3600 : 86_400);
    const label = text.slice(0, match.index).trim();

    // "/status 2h" alone has a duration but no text to show.
    if (!label) return { label: text, seconds: DEFAULT_SECONDS };

    return { label, seconds };
}
