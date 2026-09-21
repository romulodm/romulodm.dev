import 'server-only';

import { cached } from '@/lib/status-cache';

/**
 * What i am listening to, or listened to last.
 *
 * Reading a person's playback is a user-scoped operation, so the client id and
 * secret are not enough: the account owner authorises once and the resulting
 * refresh token lives in `SPOTIFY_REFRESH_TOKEN` (see scripts/spotify-auth.mjs).
 * The token never expires on its own, but Spotify may rotate it, so every
 * refresh response is checked for a new one and logged when it changes —
 * without that warning, playback would silently go missing weeks later.
 *
 * `currently-playing` answers 204 with an empty body when nothing is playing,
 * which is the normal case most of the day. That is not an error: the card
 * falls back to the last played track and changes its label instead of
 * disappearing.
 */

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API = 'https://api.spotify.com/v1';

export type QueuedTrack = {
    title: string;
    artist: string;
    url: string;
};

export type NowPlaying = {
    /** false when nothing is playing and this is the last played track. */
    isPlaying: boolean;
    title: string;
    artist: string;
    url: string;
    /** Milliseconds into the track; only meaningful while playing. */
    progressMs: number | null;
    durationMs: number | null;
    /** When the track finished, for the "last played" state. */
    playedAt: string | null;
    /**
     * When `progressMs` was read from Spotify. The value is cached and polled,
     * so by the time it reaches a browser it is already seconds old; with this
     * the page can add the elapsed time itself and animate the progress bar
     * instead of jumping once a minute.
     */
    fetchedAt: string;
    /**
     * The next track in the queue, when there is one and something is playing.
     * It is shown as what it is — what comes next — and never used to swap the
     * card on its own: a skip, a replay or autoplay would make that a lie.
     */
    next: QueuedTrack | null;
};

type SpotifyTrack = {
    name: string;
    duration_ms: number;
    artists: { name: string }[];
    external_urls: { spotify: string };
};

let accessToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
    // 30s of slack: a token that expires mid-request would fail the call that
    // just checked it.
    if (accessToken && accessToken.expiresAt > Date.now() + 30_000) {
        return accessToken.value;
    }

    const id = process.env.SPOTIFY_ID;
    const secret = process.env.SPOTIFY_CLIENT_SECRET;
    const refresh = process.env.SPOTIFY_REFRESH_TOKEN;
    if (!id || !secret || !refresh) throw new Error('Spotify env vars missing');

    const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
        // Next caches fetches by default in route handlers; these responses are
        // per-request secrets and must never be reused from the data cache.
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
        throw new Error(`Spotify token refresh failed: ${response.status}`);
    }

    const data = (await response.json()) as {
        access_token: string;
        expires_in: number;
        refresh_token?: string;
    };

    if (data.refresh_token && data.refresh_token !== refresh) {
        console.warn(
            '[spotify] the refresh token was rotated; update SPOTIFY_REFRESH_TOKEN in .env',
        );
    }

    accessToken = {
        value: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
    };
    return accessToken.value;
}

/**
 * Set when Spotify answers 429, so the next calls stop instead of digging the
 * hole deeper. The limit is counted over a rolling 30 second window, and the
 * response says how long to wait in `Retry-After`; ignoring it is what turns a
 * short throttle into a long one.
 */
let backoffUntil = 0;

async function api(path: string, token: string) {
    if (Date.now() < backoffUntil) {
        throw new Error('Spotify is rate limiting; waiting out the backoff');
    }

    const response = await fetch(`${API}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
    });

    if (response.status === 429) {
        const retryAfter = Number(response.headers.get('retry-after') ?? '5');
        // One second of margin: the header is whole seconds and the clocks are
        // not the same one.
        backoffUntil = Date.now() + (Number.isFinite(retryAfter) ? retryAfter + 1 : 6) * 1000;
        console.warn(`[spotify] 429 on ${path}; backing off for ${retryAfter}s`);
    }

    return response;
}

/**
 * The queue, which only exists while something is playing. A failure here is
 * not a failure of the card: the track being played matters, the next one is a
 * detail, so this resolves to null instead of throwing.
 */
async function readNext(token: string): Promise<QueuedTrack | null> {
    try {
        const response = await api('/me/player/queue', token);
        if (!response.ok) return null;

        const data = (await response.json()) as {
            queue?: (SpotifyTrack & { type?: string })[];
        };

        // Podcast episodes come through this endpoint too and have no artists.
        const next = data.queue?.find((item) => item?.name && item.artists?.length);
        if (!next) return null;

        return {
            title: next.name,
            artist: next.artists.map((a) => a.name).join(', '),
            url: next.external_urls.spotify,
        };
    } catch {
        return null;
    }
}

function fromTrack(track: SpotifyTrack) {
    return {
        title: track.name,
        artist: track.artists.map((a) => a.name).join(', '),
        url: track.external_urls.spotify,
        durationMs: track.duration_ms,
    };
}

async function read(): Promise<NowPlaying | null> {
    const token = await getAccessToken();

    const playing = await api('/me/player/currently-playing?additional_types=track', token);

    // 204: nothing playing. 202: the player is warming up and the body is empty.
    if (playing.ok && playing.status !== 204 && playing.status !== 202) {
        const data = (await playing.json()) as {
            is_playing: boolean;
            progress_ms: number | null;
            item: SpotifyTrack | null;
        };

        // A podcast episode with `additional_types=track` comes back with a null
        // item; treat it as "nothing playing" rather than crashing.
        if (data.item) {
            // Only worth asking while a track is playing: with the player
            // stopped the queue is empty anyway, and this would be a request
            // spent for nothing.
            const next = data.is_playing ? await readNext(token) : null;

            return {
                isPlaying: data.is_playing,
                progressMs: data.progress_ms,
                playedAt: null,
                // Stamped here, not in the route: the route may answer from
                // cache, and what the page needs is the age of the reading.
                fetchedAt: new Date().toISOString(),
                next,
                ...fromTrack(data.item),
            };
        }
    } else if (!playing.ok && playing.status !== 204) {
        throw new Error(`Spotify currently-playing failed: ${playing.status}`);
    }

    const recent = await api('/me/player/recently-played?limit=1', token);
    if (!recent.ok) throw new Error(`Spotify recently-played failed: ${recent.status}`);

    const data = (await recent.json()) as {
        items: { track: SpotifyTrack; played_at: string }[];
    };
    const last = data.items?.[0];
    if (!last) {
        // Both endpoints came back empty: nothing is playing and the account
        // has no recent history (a fresh token, or playback that happened on a
        // device Spotify does not report). The card hides itself, so log the
        // reason — otherwise this looks identical to a broken integration.
        console.info('[spotify] no current or recent track (currently-playing:', playing.status, ')');
        return null;
    }

    return {
        isPlaying: false,
        progressMs: null,
        playedAt: last.played_at,
        fetchedAt: new Date().toISOString(),
        next: null,
        ...fromTrack(last.track),
    };
}

export async function getNowPlaying(): Promise<NowPlaying | null> {
    // 30s is short enough that a track change shows up quickly and long enough
    // that a page under load does not hammer the Spotify API — `cached` also
    // collapses concurrent misses into a single call and serves the previous
    // answer while the new one is being fetched.
    const { data } = await cached<NowPlaying | null>(
        { key: 'presence:spotify', ttlSeconds: 30, staleSeconds: 300 },
        read,
    );
    return data;
}
