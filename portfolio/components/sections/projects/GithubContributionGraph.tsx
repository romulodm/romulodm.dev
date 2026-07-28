'use client';

import { useMemo } from 'react';
import type { GitHubContributionData, ContributionDay } from './github-contributions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function getMaxCount(weeks: GitHubContributionData['weeks']): number {
    return Math.max(
        1,
        ...weeks.flatMap((w) => w.contributionDays.map((d) => d.contributionCount))
    );
}

function getIntensity(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
    if (count === 0) return 0;
    const ratio = count / max;
    if (ratio <= 0.15) return 1;
    if (ratio <= 0.4) return 2;
    if (ratio <= 0.7) return 3;
    return 4;
}

function getMonthLabels(weeks: GitHubContributionData['weeks']) {
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, i) => {
        const firstDay = week.contributionDays[0];
        if (!firstDay) return;
        const month = new Date(firstDay.date).getMonth();
        if (month !== lastMonth) {
            labels.push({
                label: new Date(firstDay.date).toLocaleString('pt-BR', { month: 'short' }),
                weekIndex: i,
            });
            lastMonth = month;
        }
    });

    return labels;
}

// ─── Intensity classes — light + dark purple palette ─────────────────────────
// Strings completas e estáticas — nunca usar template literals
// pois o Tailwind JIT não detecta classes dinâmicas.

const intensityClasses: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: 'bg-purple-50 border-purple-100 dark:bg-[#1e1b2e] dark:border-[#2a2540]',
    1: 'bg-purple-200 border-purple-300 dark:bg-[#3b1f6b] dark:border-[#4a2880]',
    2: 'bg-purple-400 border-purple-500 dark:bg-[#5b2ea8] dark:border-[#6d35c0]',
    3: 'bg-purple-600 border-purple-700 dark:bg-[#7c3aed] dark:border-[#8b4cf5]',
    4: 'bg-purple-700 border-purple-800 shadow-[0_0_8px_rgba(109,40,217,0.4)] dark:bg-[#a855f7] dark:border-[#c084fc] dark:shadow-[0_0_8px_rgba(168,85,247,0.55)]',
};

// ─── Cell ────────────────────────────────────────────────────────────────────

interface CellProps {
    day: ContributionDay;
    intensity: 0 | 1 | 2 | 3 | 4;
    rowIndex: number;
}

function Cell({ day, intensity, rowIndex }: CellProps) {
    const formatted = new Date(day.date).toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    const tooltipPosition = rowIndex <= 2
        ? 'top-full mt-2 bottom-auto'
        : 'bottom-full mb-2 top-auto';

    return (
        <div
            className={`
                group relative size-[13px] rounded-[3px] border transition-transform duration-150
                hover:scale-125 hover:z-10 cursor-default
                ${intensityClasses[intensity]}
            `}
        >
            <div className={`
                pointer-events-none absolute left-1/2 -translate-x-1/2
                ${tooltipPosition}
                whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-semibold
                opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50
                bg-gray-900 text-white
                dark:bg-[#1a1625] dark:border dark:border-purple-700/40 dark:shadow-purple-900/30
                shadow-lg
            `}>
                <span className="font-bold text-purple-300">{day.contributionCount}</span>
                {' '}contrib. em {formatted}
            </div>
        </div>
    );
}

// ─── Stat ────────────────────────────────────────────────────────────────────

interface StatProps {
    label: string;
    value: number | string;
    lightColor: string;
    darkColor: string;
}

function Stat({ label, value, lightColor, darkColor }: StatProps) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-purple-700/50 dark:text-purple-300/60">
                {label}
            </span>
            <span className={`text-3xl font-black tabular-nums leading-none ${lightColor} dark:${darkColor}`}>
                {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </span>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface GitHubContributionGraphProps {
    data: GitHubContributionData;
}

export function GitHubContributionGraph({ data }: GitHubContributionGraphProps) {
    const { weeks, totalContributions, yearTotal, followers, totalForks, totalStars, username } = data;

    const maxCount = useMemo(() => getMaxCount(weeks), [weeks]);
    const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);

    return (
        <div className="
            relative w-full overflow-hidden rounded-2xl border p-5
            bg-white border-purple-100
            shadow-[0_0_0_1px_rgba(109,40,217,0.06),0_4px_24px_rgba(109,40,217,0.08)]
            dark:bg-[#0d0b14] dark:border-[#2a2540]
            dark:shadow-[0_0_0_1px_rgba(124,58,237,0.08),0_4px_24px_rgba(109,40,217,0.12)]
        ">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="
                        flex items-center justify-center size-9 rounded-xl
                        bg-purple-50 border border-purple-200
                        dark:bg-purple-950/60 dark:border-purple-700/30
                    ">
                        <svg viewBox="0 0 16 16" className="size-5 fill-purple-700 dark:fill-purple-300" aria-hidden="true">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[15px] font-bold text-gray-900 dark:text-white">@{username}</p>
                        <p className="text-[11px] uppercase tracking-wider font-medium text-purple-600/50 dark:text-purple-300/50">
                            Contribution Graph
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-3xl font-black tabular-nums leading-none text-gray-900 dark:text-white">
                        {yearTotal.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider font-medium mt-1 text-purple-600/50 dark:text-purple-300/50">
                        {new Date().getFullYear()} total
                    </p>
                </div>
            </div>

            {/* Main layout */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">

                {/* Graph */}
                <div className="flex-1 overflow-x-auto min-w-0">
                    <div className="min-w-fit">
                        <div className="relative h-5 mb-1 ml-9">
                            {monthLabels.map(({ label, weekIndex }) => (
                                <span
                                    key={`${label}-${weekIndex}`}
                                    className="absolute text-[11px] capitalize font-medium text-purple-600/50 dark:text-purple-300/50"
                                    style={{ left: `${weekIndex * 15}px` }}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-[3px]">
                            <div className="flex flex-col gap-[3px] mr-1 w-8">
                                {DAYS.map((d, i) => (
                                    <div key={i} className="h-[13px] text-[10px] text-right leading-[13px] font-medium text-purple-600/40 dark:text-purple-300/40">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {weeks.map((week, wi) => (
                                <div key={wi} className="flex flex-col gap-[3px]">
                                    {week.contributionDays.map((day, di) => (
                                        <Cell
                                            key={day.date}
                                            day={day}
                                            intensity={getIntensity(day.contributionCount, maxCount)}
                                            rowIndex={di}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-1.5 mt-3 justify-end">
                            <span className="text-[11px] font-medium text-purple-600/40 dark:text-purple-300/40">Menos</span>
                            {([0, 1, 2, 3, 4] as const).map((level) => (
                                <div key={level} className={`size-[11px] rounded-[3px] border ${intensityClasses[level]}`} />
                            ))}
                            <span className="text-[11px] font-medium text-purple-600/40 dark:text-purple-300/40">Mais</span>
                        </div>

                        <p className="text-[12px] font-medium mt-1.5 text-purple-600/40 dark:text-purple-300/40">
                            {totalContributions.toLocaleString('pt-BR')} contribuições no último ano
                        </p>
                    </div>
                </div>

                {/* Dividers */}
                <div className="lg:hidden my-4 h-px bg-purple-100 dark:bg-purple-900/30" />
                <div className="hidden lg:block w-px self-stretch bg-purple-100 dark:bg-purple-900/30 mx-1" />

                {/* Stats */}
                <div className="flex flex-row lg:flex-col gap-6 lg:gap-7 lg:min-w-[130px] lg:justify-center">
                    <Stat label="Seguidores" value={followers} lightColor="text-pink-500" darkColor="text-pink-400" />
                    <Stat label="Forks" value={totalForks} lightColor="text-emerald-600" darkColor="text-emerald-400" />
                    <Stat label="GitHub Stars" value={totalStars} lightColor="text-amber-500" darkColor="text-amber-400" />
                </div>
            </div>
        </div>
    );
}