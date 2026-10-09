/**
 * Ready-made statuses, each set from Telegram with a single word (/foco,
 * /reuniao, ...).
 *
 * They exist for translation. A status typed as free text reaches the site in
 * whatever language it was typed, so an English visitor reads "em foco". A
 * preset is stored as its key, and the card renders the key through the
 * locale's messages (`home.built.presence.presets.<key>`), so every visitor
 * reads it in the language of the page.
 *
 * The value is the default duration in seconds, used when the command carries
 * none. The command name is the key itself: Telegram only accepts [a-z0-9_]
 * in command names, which is why the keys have no accents.
 *
 * This module has no `server-only` import on purpose: the client card imports
 * the type, and the webhook imports the table.
 */
export const STATUS_PRESETS = {
    foco: 2 * 3600,
    reuniao: 1 * 3600,
    almoco: 1 * 3600,
    estudando: 3 * 3600,
    viajando: 24 * 3600,
    ferias: 72 * 3600,
} as const satisfies Record<string, number>;

export type StatusPreset = keyof typeof STATUS_PRESETS;

export function isStatusPreset(value: unknown): value is StatusPreset {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(STATUS_PRESETS, value);
}
