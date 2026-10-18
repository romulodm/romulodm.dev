'use client';

import {
    type KeyboardEvent,
    type MouseEvent,
    type PointerEvent,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

/**
 * A year of activity as a GitHub-style heat map, drawn with plain DOM cells.
 *
 * Columns are weeks, rows are weekdays (Sunday on top). The grid stretches to
 * the width of its card; below `MIN_GRID_PX` it scrolls sideways instead of
 * shrinking the cells into specks, and starts scrolled to the newest week.
 *
 * Hover or tap a day for its count. The grid itself is the one tab stop:
 * arrow keys walk the days, Home/End jump to the ends, and every move is read
 * out through a polite live region. Cells are aria-hidden, so a screen reader
 * hears the summary in `labels.chart` and then the day it lands on.
 */

export type ContributionDay = { date: string; count: number };

type Cell = { date: string; count: number; level: number; week: number; day: number };
type Streak = { days: number; start: string | null; end: string | null };

const DAY_MS = 86_400_000;

/** Below this width the grid scrolls instead of shrinking. ~11px cells. */
const MIN_GRID_PX = 680;

/** "YYYY-MM-DD" → UTC midnight, read literally so no timezone moves the day. */
const dayMs = (value: string): number => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    return match ? Date.UTC(+match[1], +match[2] - 1, +match[3]) : NaN;
};

const toKey = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/**
 * Levels 1–4 split the non-zero days by quarters of a "busy" day, the 95th
 * percentile, so one freak day cannot wash every other day out to level 1.
 */
function buildGrid(data: ContributionDay[]) {
    const counts = new Map<string, number>();
    let end = -Infinity;
    for (const d of data) {
        const ms = dayMs(d.date);
        if (!Number.isFinite(ms)) continue;
        if (ms > end) end = ms;
        const count = Number(d.count);
        if (count > 0 && Number.isFinite(count)) {
            const key = toKey(ms);
            counts.set(key, (counts.get(key) ?? 0) + count);
        }
    }
    if (!Number.isFinite(end)) return { cells: [] as Cell[], weeks: 0 };

    let start = end - 364 * DAY_MS;
    start -= new Date(start).getUTCDay() * DAY_MS;

    const cells: Cell[] = [];
    for (let ms = start, i = 0; ms <= end; ms += DAY_MS, i++) {
        const date = toKey(ms);
        cells.push({ date, count: counts.get(date) ?? 0, level: 0, week: Math.floor(i / 7), day: i % 7 });
    }

    const nonZero = cells.map((c) => c.count).filter((c) => c > 0).sort((a, b) => a - b);
    const busy = nonZero.length ? nonZero[Math.floor(0.95 * (nonZero.length - 1))] : 0;
    for (const c of cells) {
        c.level = c.count <= 0 ? 0 : busy <= 0 ? 4 : 1 + Math.min(3, Math.floor((c.count / busy) * 4));
    }

    return { cells, weeks: cells[cells.length - 1].week + 1 };
}

/** Total, busiest day, longest run, and the run that reaches today (or yesterday: today isn't over). */
function computeStats(cells: Cell[]) {
    let total = 0;
    let busiest = { count: 0, date: null as string | null };
    let run = 0;
    let runStart: string | null = null;
    let longest: Streak = { days: 0, start: null, end: null };

    for (const c of cells) {
        total += c.count;
        if (c.count > busiest.count) busiest = { count: c.count, date: c.date };
        if (c.count > 0) {
            if (run === 0) runStart = c.date;
            run++;
            if (run > longest.days) longest = { days: run, start: runStart, end: c.date };
        } else {
            run = 0;
        }
    }

    let j = cells.length - 1;
    if (j >= 0 && cells[j].count === 0) j--;
    const endAt = j;
    while (j >= 0 && cells[j].count > 0) j--;
    const current: Streak =
        endAt - j > 0
            ? { days: endAt - j, start: cells[j + 1].date, end: cells[endAt].date }
            : { days: 0, start: null, end: null };

    return {
        total,
        first: cells[0]?.date ?? null,
        last: cells[cells.length - 1]?.date ?? null,
        busiest,
        longest,
        current,
    };
}

/** A label on each week whose first day starts a new month; a cramped first label is dropped. */
function monthLabels(cells: Cell[], weeks: number, locale: string) {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
    const out: { week: number; label: string }[] = [];
    let prev = -1;
    for (let w = 0; w < weeks; w++) {
        const c = cells[w * 7];
        if (!c) break;
        const month = +c.date.slice(5, 7);
        if (month !== prev) out.push({ week: w, label: fmt.format(dayMs(c.date)) });
        prev = month;
    }
    if (out.length > 1 && out[1].week - out[0].week < 3) out.shift();
    return out;
}

/**
 * Full class strings, empty → heaviest, so Tailwind sees every one of them.
 * GitHub's own ramps: the light one for the light theme, the dark one for dark.
 */
const LEVEL_CLASS = [
    'bg-neutral-200/80 dark:bg-neutral-800/80',
    'bg-[#9be9a8] dark:bg-[#0e4429]',
    'bg-[#40c463] dark:bg-[#006d32]',
    'bg-[#30a14e] dark:bg-[#26a641]',
    'bg-[#216e39] dark:bg-[#39d353]',
];

/** Every visible or announced string. Functions where the wording depends on a number. */
export interface HeatmapLabels {
    /** The noun after a stat value: "contribution" / "contributions". */
    unit: (count: number) => string;
    /** A count with its noun, or the empty-day wording: "12 contributions", "No contributions". */
    amount: (count: number) => string;
    /** The part after an amount, given a formatted date: "on Mar 4, 2026". */
    onDate: (date: string) => string;
    days: (count: number) => string;
    yearTotal: string;
    busiestDay: string;
    longestStreak: string;
    currentStreak: string;
    /** Description of the grid for screen readers. */
    chart: (amount: string, range: string) => string;
    less: string;
    more: string;
    /** Legend levels, empty → heaviest. */
    levels: [string, string, string, string, string];
}

type Tip = { index: number; x: number; y: number };

export default function ContributionHeatmap({
    data,
    labels: L,
    locale = 'en-US',
}: {
    data: ContributionDay[];
    labels: HeatmapLabels;
    locale?: string;
}) {
    const model = useMemo(() => {
        const grid = buildGrid(data);
        return { ...grid, stats: computeStats(grid.cells), months: monthLabels(grid.cells, grid.weeks, locale) };
    }, [data, locale]);

    const nf = useMemo(() => new Intl.NumberFormat(locale), [locale]);
    const df = useMemo(
        () => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }),
        [locale],
    );
    const dfy = useMemo(
        () => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
        [locale],
    );
    const dfl = useMemo(
        () =>
            new Intl.DateTimeFormat(locale, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'UTC',
            }),
        [locale],
    );

    // Monday, Wednesday and Friday, as GitHub labels them.
    const weekdays = useMemo(() => {
        const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
        return model.cells
            .slice(0, 7)
            .map((c, day) => ({ day, dow: new Date(dayMs(c.date)).getUTCDay(), label: fmt.format(dayMs(c.date)) }))
            .filter((d) => d.dow === 1 || d.dow === 3 || d.dow === 5);
    }, [model.cells, locale]);

    const [tip, setTip] = useState<Tip | null>(null);
    const [tipLeft, setTipLeft] = useState(0);
    const [announce, setAnnounce] = useState('');

    const frameRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const tipRef = useRef<HTMLDivElement>(null);

    // On a narrow screen the grid scrolls; the recent weeks are the interesting ones.
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollLeft = el.scrollWidth;
    }, [model]);

    const showTip = (index: number) => {
        const frame = frameRef.current;
        const cell = gridRef.current?.querySelector<HTMLElement>(`[data-i="${index}"]`);
        if (!frame || !cell) return;
        const f = frame.getBoundingClientRect();
        const c = cell.getBoundingClientRect();
        setTip({ index, x: c.left - f.left + c.width / 2, y: c.top - f.top });
    };

    // Keep the tooltip inside the card: measured after its text is in place.
    useLayoutEffect(() => {
        const frame = frameRef.current;
        const el = tipRef.current;
        if (!tip || !frame || !el) return;
        const half = el.offsetWidth / 2;
        setTipLeft(Math.min(Math.max(tip.x, half), frame.clientWidth - half));
    }, [tip]);

    const describe = (index: number) => {
        const c = model.cells[index];
        return c ? `${L.amount(c.count)} ${L.onDate(dfl.format(dayMs(c.date)))}` : '';
    };

    const indexFrom = (target: EventTarget) => {
        const i = (target as HTMLElement).dataset?.i;
        return i === undefined ? -1 : Number(i);
    };

    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (e.pointerType === 'touch') return;
        const i = indexFrom(e.target);
        if (i >= 0 && i !== tip?.index) showTip(i);
    };

    const onPointerLeave = (e: PointerEvent<HTMLDivElement>) => {
        // A tap ends with a pointerleave; the tapped day should stay up.
        if (e.pointerType !== 'touch') setTip(null);
    };

    const onClick = (e: MouseEvent<HTMLDivElement>) => {
        const i = indexFrom(e.target);
        if (i >= 0) showTip(i);
    };

    const move = (index: number) => {
        const cell = gridRef.current?.querySelector<HTMLElement>(`[data-i="${index}"]`);
        cell?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        showTip(index);
        setAnnounce(describe(index));
    };

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const n = model.cells.length;
        const at = tip?.index ?? n - 1;
        const step: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
        let next = -1;
        if (e.key in step) next = at + step[e.key];
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = n - 1;
        else if (e.key === 'Escape') {
            setTip(null);
            return;
        } else return;
        e.preventDefault();
        move(Math.min(Math.max(next, 0), n - 1));
    };

    const { stats, cells, weeks, months } = model;
    if (!cells.length) return null;

    const range = (a: string | null, b: string | null, withYear = false) => {
        if (!a || !b) return '—';
        const f = withYear ? dfy : df;
        return `${f.format(dayMs(a))} — ${f.format(dayMs(b))}`;
    };

    const statBlocks = [
        {
            label: L.yearTotal,
            value: nf.format(stats.total),
            unit: L.unit(stats.total),
            sub: range(stats.first, stats.last, true),
        },
        {
            label: L.busiestDay,
            value: nf.format(stats.busiest.count),
            unit: L.unit(stats.busiest.count),
            sub: stats.busiest.date ? df.format(dayMs(stats.busiest.date)) : '—',
        },
        {
            label: L.longestStreak,
            value: nf.format(stats.longest.days),
            unit: L.days(stats.longest.days),
            sub: range(stats.longest.start, stats.longest.end),
        },
        {
            label: L.currentStreak,
            value: nf.format(stats.current.days),
            unit: L.days(stats.current.days),
            sub: range(stats.current.start, stats.current.end),
        },
    ];

    const active = tip ? cells[tip.index] : null;

    return (
        <div>
            <div ref={frameRef} className="relative">
                {/* Scrolls only below MIN_GRID_PX. The bar is hidden: on Windows it is
                    a thick grey strip under the grid, and touch, trackpad and
                    the arrow keys all scroll without it. */}
                <div
                    ref={scrollRef}
                    className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    <div
                        ref={gridRef}
                        tabIndex={0}
                        role="img"
                        aria-label={L.chart(L.amount(stats.total), range(stats.first, stats.last, true))}
                        onPointerMove={onPointerMove}
                        onPointerLeave={onPointerLeave}
                        onClick={onClick}
                        onKeyDown={onKeyDown}
                        onBlur={() => setTip(null)}
                        className="grid gap-[3px] rounded-md outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                        style={{
                            minWidth: MIN_GRID_PX,
                            gridTemplateColumns: `2rem repeat(${weeks}, minmax(0, 1fr))`,
                            gridTemplateRows: 'auto repeat(7, auto)',
                        }}
                    >
                        {months.map((m) => (
                            <span
                                key={m.week}
                                aria-hidden="true"
                                className="type-caption whitespace-nowrap pb-1 leading-none text-muted-foreground"
                                style={{ gridColumn: `${m.week + 2} / span 4`, gridRow: 1 }}
                            >
                                {m.label}
                            </span>
                        ))}

                        {weekdays.map((w) => (
                            <span
                                key={w.day}
                                aria-hidden="true"
                                className="type-caption self-center leading-none text-muted-foreground"
                                style={{ gridColumn: 1, gridRow: w.day + 2 }}
                            >
                                {w.label}
                            </span>
                        ))}

                        {cells.map((c, i) => (
                            <span
                                key={c.date}
                                data-i={i}
                                aria-hidden="true"
                                className={`aspect-square rounded-[3px] transition-shadow ${LEVEL_CLASS[c.level]} ${
                                    tip?.index === i ? 'ring-2 ring-foreground/70 ring-offset-1 ring-offset-background' : ''
                                }`}
                                style={{ gridColumn: c.week + 2, gridRow: c.day + 2 }}
                            />
                        ))}
                    </div>
                </div>

                <div
                    ref={tipRef}
                    role="tooltip"
                    aria-hidden="true"
                    className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs leading-none text-background shadow-lg transition-opacity duration-150 motion-reduce:transition-none"
                    style={{
                        left: tipLeft,
                        top: tip ? tip.y - 6 : 0,
                        opacity: active ? 1 : 0,
                    }}
                >
                    {active ? (
                        <>
                            <strong className="font-semibold">{L.amount(active.count)}</strong>
                            <span className="opacity-75"> {L.onDate(dfy.format(dayMs(active.date)))}</span>
                        </>
                    ) : (
                        ' '
                    )}
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 lg:flex lg:gap-x-10">
                    {statBlocks.map((s) => (
                        <div key={s.label} className="min-w-0">
                            <dt className="type-caption text-muted-foreground">{s.label}</dt>
                            <dd className="mt-1 flex flex-wrap items-baseline gap-x-1">
                                <span className="text-xl font-semibold tabular-nums text-foreground">{s.value}</span>
                                <span className="type-small text-muted-foreground">{s.unit}</span>
                            </dd>
                            <dd className="type-caption mt-0.5 text-muted-foreground/80">{s.sub}</dd>
                        </div>
                    ))}
                </dl>

                <div aria-hidden="true" className="type-caption flex items-center gap-1.5 text-muted-foreground">
                    <span className="mr-0.5">{L.less}</span>
                    {LEVEL_CLASS.map((cls, level) => (
                        <span key={level} title={L.levels[level]} className={`h-[11px] w-[11px] rounded-[2px] ${cls}`} />
                    ))}
                    <span className="ml-0.5">{L.more}</span>
                </div>
            </div>

            <p aria-live="polite" className="sr-only">
                {announce}
            </p>
        </div>
    );
}
