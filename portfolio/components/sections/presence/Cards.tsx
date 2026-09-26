'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { useFormatter, useNow, useTranslations } from 'next-intl';

import { CellBody, Eyebrow, cellClass } from './Cell';

/**
 * The live half of the "Agora" strip: manual status, Spotify, the latest public
 * commit, commits this week and people on the site right now.
 *
 * Everything comes from `/api/presence` in one request, client-side. The page
 * itself is statically rendered per locale, so fetching this on the server
 * would either freeze the values into the build or make the whole home page
 * dynamic for four small numbers.
 *
 * The strip always draws its eight cells, even before the first response and
 * with a source down. A cell that disappears would reflow the grid and leave a
 * hole in the middle of a row, which looks more broken than a cell saying that
 * nothing is playing. There is no error copy either: the visitor did not cause
 * the failure and has no step to take, so each cell states what it knows and
 * stops there.
 */

type Presence = {
    /** Server clock at the time of the answer, used to correct client skew. */
    now: string;
    status: { label: string; since: string; until: string } | null;
    music: {
        isPlaying: boolean;
        title: string;
        artist: string;
        url: string;
        progressMs: number | null;
        durationMs: number | null;
        playedAt: string | null;
        fetchedAt: string;
        next: { title: string; artist: string; url: string } | null;
    } | null;
    commits: {
        latest: { message: string; url: string; repository: string; date: string } | null;
        countLastWeek: number;
        windowDays: number;
    } | null;
    visitors: number | null;
};

const GITHUB_PROFILE = 'https://github.com/romulodm';

/** Placeholder before the first answer arrives and whenever a value is missing. */
const EMPTY = '—';

/** Long enough to feel live, short enough not to poll a sleeping tab to death. */
const REFRESH_MS = 60_000;

/**
 * Floor between two track-ended refetches. The server answer is cached for ~30s
 * and can arrive with the same track still playing; without this floor, a
 * finished track would ask for a new one every second until the cache turned
 * over.
 */
const TRACK_END_COOLDOWN_MS = 15_000;

export default function Cards({ startIndex }: { startIndex: number }) {
    const t = useTranslations('home.built.presence');
    const format = useFormatter();
    // `relativeTime` needs an explicit reference point. Without it next-intl
    // falls back to the current time, which differs between the server render
    // and the client hydration and logs a warning on every render. The one
    // minute interval also keeps "2 minutes ago" from freezing on screen.
    const now = useNow({ updateInterval: 60_000 });
    const [data, setData] = useState<Presence | null>(null);
    /**
     * How far ahead of the server this browser's clock is, measured when the
     * answer arrives. A machine a few minutes off would otherwise age the
     * Spotify reading by that much and park the progress bar at the end.
     */
    const [skewMs, setSkewMs] = useState(0);

    // Ticks once a second while a track is playing, only to re-render the
    // progress bar. The value itself is never read.
    const [, tick] = useState(0);
    const loadRef = useRef<() => void>(() => { });
    const lastEndRefetch = useRef(0);

    useEffect(() => {
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;

        const load = async () => {
            clearTimeout(timer);
            try {
                const response = await fetch('/api/presence', { signal: controller.signal });
                if (response.ok) {
                    const payload = (await response.json()) as Presence;
                    // Measured here, against the clock reading of this very
                    // moment: any later Date.now() already includes the time
                    // spent since the answer, which is what we want to add.
                    setSkewMs(Date.now() - new Date(payload.now).getTime());
                    setData(payload);
                }
            } catch {
                // Offline or aborted: keep whatever is on screen and try again
                // on the next tick.
            } finally {
                // A hidden tab stops polling: this is decoration, and a phone in
                // a pocket should not keep the radio busy for it.
                timer = setTimeout(load, document.hidden ? REFRESH_MS * 5 : REFRESH_MS);
            }
        };

        loadRef.current = () => void load();
        load();

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, []);

    const music = data?.music;

    /**
     * Where the track is right now: what Spotify reported, plus the time since
     * that reading, corrected for the difference between the two clocks.
     */
    const playedMs =
        music?.isPlaying && music.progressMs !== null
            ? music.progressMs +
            Math.max(0, Date.now() - skewMs - new Date(music.fetchedAt).getTime())
            : null;

    const durationMs = music?.durationMs ?? null;
    const ended = playedMs !== null && durationMs !== null && playedMs >= durationMs;

    useEffect(() => {
        if (!music?.isPlaying) return;

        const id = setInterval(() => tick((value) => value + 1), 1000);
        return () => clearInterval(id);
    }, [music?.isPlaying, music?.title, music?.fetchedAt]);

    useEffect(() => {
        // The track ran out: ask for the next one now instead of waiting for
        // the poll, which is what makes a change of song show up in seconds.
        if (!ended) return;
        if (Date.now() - lastEndRefetch.current < TRACK_END_COOLDOWN_MS) return;

        lastEndRefetch.current = Date.now();
        loadRef.current();
    }, [ended]);

    // A cell can link out (the track on Spotify, the commit on GitHub); the
    // others are plain text. The arrow is only drawn when there is somewhere
    // to go, so it never promises a click that does nothing.
    const cells: { node: ReactNode; href?: string }[] = [];
    const push = (node: ReactNode, href?: string) => cells.push({ node, href });

    const status = data?.status;
    const commits = data?.commits;
    const visitors = data?.visitors;

    // ── Status ────────────────────────────────────────────────────────────────
    // Always present, even with nothing set: "available" is a true answer, and
    // this cell closes the first row.
    push(
        <>
            <Eyebrow
                accent={status ? 'var(--vision-color)' : 'hsl(var(--muted-foreground))'}
                label={t('statusLabel')}
            />
            <CellBody
                title={
                    <>
                        {status && (
                            <span className="relative flex h-2 w-2 shrink-0">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--vision-color)] opacity-60 motion-reduce:animate-none" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--vision-color)]" />
                            </span>
                        )}
                        <span className="truncate">{status ? status.label : t('statusFree')}</span>
                    </>
                }
                subtitle={
                    status
                        ? t('statusUntil', {
                            time: format.dateTime(new Date(status.until), {
                                hour: '2-digit',
                                minute: '2-digit',
                            }),
                        })
                        : t('statusFreeHint')
                }
            />
        </>,
    );

    // ── Spotify ───────────────────────────────────────────────────────────────
    {
        const progress =
            playedMs !== null && durationMs
                ? Math.min(100, (playedMs / durationMs) * 100)
                : null;

        push(
            <>
                <span className="flex min-w-0 items-center gap-2.5">
                    <Eyebrow
                        accent={music?.isPlaying ? '#1db954' : 'hsl(var(--muted-foreground))'}
                        label={music?.isPlaying ? t('musicLabel') : t('musicLastLabel')}
                    />
                    {music && <Arrow />}
                </span>
                <span className="block min-w-0">
                    <CellBody
                        title={
                            <>
                                <Equalizer playing={Boolean(music?.isPlaying)} />
                                <span className="min-w-0 truncate">
                                    {music ? music.title : data ? t('musicEmpty') : EMPTY}
                                </span>
                            </>
                        }
                        subtitle={
                            !music
                                ? t('musicEmptyHint')
                                : music.isPlaying || !music.playedAt
                                    ? music.artist
                                    : `${music.artist} · ${format.relativeTime(new Date(music.playedAt), now)}`
                        }
                    />
                    {progress !== null && (
                        <span className="mt-2.5 block h-[3px] w-full overflow-hidden rounded-sm bg-[#e5e7eb] dark:bg-[#2f3031]">
                            <span
                                // No transition: the width is recomputed every
                                // second from the elapsed time, and a CSS
                                // animation on top of that would lag behind the
                                // real position instead of smoothing it.
                                className="block h-full rounded-sm bg-[#1db954]"
                                style={{ width: `${progress}%` }}
                            />
                        </span>
                    )}
                </span>
            </>,
            music?.url,
        );
    }

    // ── Latest public commit ──────────────────────────────────────────────────
    {
        const latest = commits?.latest ?? null;

        push(
            <>
                <span className="flex min-w-0 items-center gap-2.5">
                    <Eyebrow accent="var(--primary-color)" label={t('commitLabel')} />
                    {latest && <Arrow />}
                </span>
                <CellBody
                    mono
                    title={
                        <span className="min-w-0 truncate">
                            {latest ? latest.message : data ? t('commitEmpty') : EMPTY}
                        </span>
                    }
                    subtitle={
                        latest
                            ? `${latest.repository} · ${format.relativeTime(new Date(latest.date), now)}`
                            : t('commitEmptyHint')
                    }
                />
            </>,
            latest?.url,
        );
    }

    // ── Commits in the last week ──────────────────────────────────────────────
    // Links to the profile, which is where the number can be checked; the count
    // itself covers private repositories, so there is no single page that lists
    // exactly these commits.
    push(
        <>
            <span className="flex min-w-0 items-center gap-2.5">
                <Eyebrow
                    accent="var(--primary-color)"
                    label={t('commitsLabel', { days: commits?.windowDays ?? 7 })}
                />
                <Arrow />
            </span>
            <CellBody
                title={
                    <span className="text-3xl leading-none tabular-nums">
                        {commits ? commits.countLastWeek : EMPTY}
                    </span>
                }
                subtitle={t('commitsHint')}
            />
        </>,
        GITHUB_PROFILE,
    );

    // ── People on the site right now ──────────────────────────────────────────
    // Never below one: whoever is reading this is on the site, so a zero would
    // be visibly wrong. GA4 counts the last 30 minutes and lags behind a visit
    // that just started, and a failed call lands here too.
    {
        const people = Math.max(1, visitors ?? 1);

        push(
            <>
                <Eyebrow accent="var(--resume-color)" label={t('visitorsLabel')} />
                <CellBody
                    title={
                        <>
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--vision-color)]" />
                            <span className="text-3xl leading-none tabular-nums">{people}</span>
                            <span className="truncate text-base">
                                {t('visitorsUnit', { count: people })}
                            </span>
                        </>
                    }
                    subtitle={t('visitorsHint')}
                />
            </>,
        );
    }

    return (
        <>
            {cells.map((cell, index) => {
                const position = startIndex + index;
                const className = `${cell.href ? 'group ' : ''}${cellClass(position)}`;

                return cell.href ? (
                    <a
                        key={position}
                        href={cell.href}
                        target="_blank"
                        rel="noreferrer"
                        className={className}
                    >
                        {cell.node}
                    </a>
                ) : (
                    <div key={position} className={className}>
                        {cell.node}
                    </div>
                );
            })}
        </>
    );
}

/** The same trailing arrow the link cells use, for the cells that link out. */
function Arrow() {
    return (
        <ArrowRight
            aria-hidden="true"
            className="ml-auto h-4 w-4 text-foreground opacity-40 transition-transform duration-200 group-hover:translate-x-1 group-hover:opacity-100"
        />
    );
}

/** Three bars that move while a track is playing and rest when it is not. */
function Equalizer({ playing }: { playing: boolean }) {
    const heights = playing ? ['40%', '100%', '65%'] : ['45%', '75%', '30%'];

    return (
        <span aria-hidden="true" className="flex h-3.5 shrink-0 items-end gap-[2px]">
            {heights.map((height, index) => (
                <span
                    key={index}
                    className={`w-[3px] origin-bottom rounded-[1px] ${playing ? 'bg-[#1db954] motion-safe:animate-presence-eq' : 'bg-muted-foreground'}`}
                    style={{ height, animationDelay: `${index * 0.25}s` }}
                />
            ))}
        </span>
    );
}
