'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp, Globe, Monitor, Smartphone, Tablet, Tv } from 'lucide-react';
import {
    FaAndroid, FaApple, FaChrome, FaEdge, FaFirefoxBrowser, FaLinux, FaOpera, FaSafari, FaWindows,
} from 'react-icons/fa';

import type { AudienceRow, AudienceTotals, WeeklyAudience as Audience } from '@/lib/ga4';
import { getIntlLocaleCode } from '@/lib/locales';

/**
 * Topo da pagina /status: audiencia dos ultimos 7 dias, no formato do
 * dashboard do Umami (totais, ambiente, localizacao e mapa de calor).
 *
 * Busca a parte, em /api/status/analytics, para que uma falha ou lentidao do
 * GA4 nao segure o resto da pagina.
 */

type Payload = Audience & { collectedAt: string };

// O GA4 consolida com horas de atraso e a rota cacheia por 10 min; recarregar
// mais que isso nao traz numero novo.
const REFRESH_MS = 5 * 60_000;

export function WeeklyAudience() {
    const t = useTranslations('statusPage.audience');
    const [data, setData] = useState<Payload | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let alive = true;
        async function load() {
            try {
                const res = await fetch('/api/status/analytics');
                if (!res.ok) throw new Error(String(res.status));
                const json = (await res.json()) as Payload;
                if (alive) {
                    setData(json);
                    setFailed(false);
                }
            } catch {
                // Com dado antigo na tela, uma falha de refresh nao apaga nada.
                if (alive) setFailed(true);
            }
        }
        load();
        const id = setInterval(load, REFRESH_MS);
        return () => {
            alive = false;
            clearInterval(id);
        };
    }, []);

    return (
        <section className="space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-2">
                <h2 className="type-h3 text-foreground">{t('title')}</h2>
                <p className="text-xs text-muted-foreground">{t('source')}</p>
            </div>

            {data ? (
                <AudienceBody data={data} />
            ) : failed ? (
                <div className="flex h-[140px] items-center justify-center rounded border border-dashed border-border">
                    <p className="text-sm text-muted-foreground">{t('unavailable')}</p>
                </div>
            ) : (
                <AudienceSkeleton />
            )}
        </section>
    );
}

// ─── Corpo ────────────────────────────────────────────────────────────────────

function AudienceBody({ data }: { data: Payload }) {
    const t = useTranslations('statusPage.audience');
    const total = data.totals.current.visitors;

    const deviceLabel = (name: string) =>
        name === 'desktop' || name === 'mobile' || name === 'tablet' ? t(`deviceNames.${name}`) : name;

    return (
        <div className="space-y-4">
            <TotalsRow current={data.totals.current} previous={data.totals.previous} />

            <div className="grid gap-4 lg:grid-cols-3">
                <TabbedPanel
                    title={t('environment.title')}
                    total={total}
                    tabs={[
                        { key: 'browsers', label: t('environment.browsers'), column: t('environment.browser'), rows: data.browsers, icon: browserIcon },
                        { key: 'os', label: t('environment.os'), column: t('environment.system'), rows: data.os, icon: osIcon },
                        { key: 'devices', label: t('environment.devices'), column: t('environment.device'), rows: data.devices, icon: deviceIcon, formatName: deviceLabel },
                    ]}
                />
                <TabbedPanel
                    title={t('location.title')}
                    total={total}
                    tabs={[
                        { key: 'countries', label: t('location.countries'), column: t('location.country'), rows: data.countries, icon: flagIcon },
                        { key: 'regions', label: t('location.regions'), column: t('location.region'), rows: data.regions, icon: flagIcon },
                        { key: 'cities', label: t('location.cities'), column: t('location.city'), rows: data.cities, icon: flagIcon },
                    ]}
                />
                <TrafficHeatmap grid={data.traffic} />
            </div>
        </div>
    );
}

// ─── Totais ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return seconds % 60 ? `${minutes}m ${seconds % 60}s` : `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/** Variacao relativa em %; null quando nao ha base de comparacao. */
function change(current: number, previous: number): number | null {
    if (previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
}

function TotalsRow({ current, previous }: { current: AudienceTotals; previous: AudienceTotals }) {
    const t = useTranslations('statusPage.audience');
    const intlLocale = getIntlLocaleCode(useLocale());
    const fmt = (n: number) => n.toLocaleString(intlLocale);

    const metrics: { key: keyof AudienceTotals; format: (n: number) => string; lowerIsBetter?: boolean }[] = [
        { key: 'visitors', format: fmt },
        { key: 'visits', format: fmt },
        { key: 'views', format: fmt },
        { key: 'bounceRate', format: (n) => `${n}%`, lowerIsBetter: true },
        { key: 'visitDuration', format: formatDuration },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {metrics.map(({ key, format, lowerIsBetter }) => (
                <div key={key} className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm font-semibold text-foreground">{t(`metrics.${key}`)}</p>
                    <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{format(current[key])}</p>
                    <ChangeBadge
                        value={change(current[key], previous[key])}
                        lowerIsBetter={lowerIsBetter}
                        title={t('vsPrevious', { value: format(previous[key]) })}
                    />
                </div>
            ))}
        </div>
    );
}

function ChangeBadge({ value, lowerIsBetter, title }: { value: number | null; lowerIsBetter?: boolean; title: string }) {
    if (value === null) return <div className="mt-2 h-6" aria-hidden />;

    const good = lowerIsBetter ? value < 0 : value > 0;
    const color = value === 0
        ? 'bg-muted text-muted-foreground'
        : good
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 text-red-600 dark:text-red-400';
    const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : null;

    return (
        <span title={title} className={`mt-2 inline-flex h-6 items-center gap-1 rounded px-1.5 text-xs font-medium tabular-nums ${color}`}>
            {Icon && <Icon className="h-3 w-3" aria-hidden />}
            {Math.abs(value)}%
        </span>
    );
}

// ─── Listas com abas ──────────────────────────────────────────────────────────

type Tab = {
    key: string;
    label: string;
    column: string;
    rows: AudienceRow[];
    icon: (row: AudienceRow) => ReactNode;
    /** Rotulo exibido no lugar do valor cru do GA4. */
    formatName?: (name: string) => string;
};

function TabbedPanel({ title, tabs, total }: { title: string; tabs: Tab[]; total: number }) {
    const t = useTranslations('statusPage.audience');
    const intlLocale = getIntlLocaleCode(useLocale());
    const [active, setActive] = useState(tabs[0].key);
    const tab = tabs.find((x) => x.key === active) ?? tabs[0];

    return (
        <div className="flex flex-col rounded-lg border border-border bg-card p-4">
            <h3 className="text-lg font-bold text-foreground">{title}</h3>

            <div role="tablist" className="mt-2 flex gap-4 border-b border-border text-sm">
                {tabs.map((x) => (
                    <button
                        key={x.key}
                        type="button"
                        role="tab"
                        aria-selected={x.key === tab.key}
                        onClick={() => setActive(x.key)}
                        className={`-mb-px border-b-2 pb-2 transition-colors ${x.key === tab.key
                            ? 'border-primary text-foreground'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {x.label}
                    </button>
                ))}
            </div>

            <div className="mt-3 flex justify-between px-2 text-xs font-semibold text-foreground">
                <span>{tab.column}</span>
                <span>{t('visitorsColumn')}</span>
            </div>

            {tab.rows.length === 0 ? (
                <p className="flex flex-1 items-center justify-center py-10 text-sm text-muted-foreground">{t('empty')}</p>
            ) : (
                <ul role="tabpanel" className="mt-1 space-y-0.5">
                    {tab.rows.map((row) => {
                        const pct = total > 0 ? Math.min(100, Math.round((row.visitors / total) * 100)) : 0;
                        const name = row.name === '(not set)' || row.name === ''
                            ? t('unknown')
                            : tab.formatName?.(row.name) ?? row.name;
                        return (
                            <li key={`${row.name}-${row.countryCode ?? ''}`} className="relative flex items-center gap-2 rounded px-2 py-1.5 text-sm">
                                <span aria-hidden className="absolute inset-y-0 left-0 rounded bg-primary/10" style={{ width: `${pct}%` }} />
                                <span className="relative flex min-w-0 flex-1 items-center gap-2 text-foreground">
                                    <span className="flex w-5 shrink-0 justify-center text-muted-foreground">{tab.icon(row)}</span>
                                    <span className="truncate" title={name}>{name}</span>
                                </span>
                                <span className="relative font-semibold tabular-nums text-foreground">{row.visitors.toLocaleString(intlLocale)}</span>
                                <span className="relative w-11 border-l border-border pl-2 text-right text-xs tabular-nums text-muted-foreground">{pct}%</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

// ─── Icones ───────────────────────────────────────────────────────────────────

function browserIcon({ name }: AudienceRow): ReactNode {
    const cls = 'h-4 w-4';
    if (name.startsWith('Chrome')) return <FaChrome className={cls} />;
    if (name.startsWith('Safari')) return <FaSafari className={cls} />;
    if (name.startsWith('Edge')) return <FaEdge className={cls} />;
    if (name.startsWith('Firefox')) return <FaFirefoxBrowser className={cls} />;
    if (name.startsWith('Opera')) return <FaOpera className={cls} />;
    if (name.startsWith('Android')) return <FaAndroid className={cls} />;
    return <Globe className={cls} />;
}

function osIcon({ name }: AudienceRow): ReactNode {
    const cls = 'h-4 w-4';
    if (name === 'Windows') return <FaWindows className={cls} />;
    if (name === 'Macintosh' || name === 'iOS' || name === 'iPadOS') return <FaApple className={cls} />;
    if (name === 'Android') return <FaAndroid className={cls} />;
    if (name === 'Chrome OS') return <FaChrome className={cls} />;
    if (name === 'Linux') return <FaLinux className={cls} />;
    return <Monitor className={cls} />;
}

function deviceIcon({ name }: AudienceRow): ReactNode {
    const cls = 'h-4 w-4';
    if (name === 'mobile') return <Smartphone className={cls} />;
    if (name === 'tablet') return <Tablet className={cls} />;
    if (name === 'smart tv') return <Tv className={cls} />;
    return <Monitor className={cls} />;
}

function flagIcon({ countryCode }: AudienceRow): ReactNode {
    if (!countryCode || !/^[A-Z]{2}$/i.test(countryCode)) return <Globe className="h-4 w-4" />;
    return (
        // eslint-disable-next-line @next/next/no-img-element -- bandeira de 20px, nao compensa o otimizador
        <img
            src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
            alt=""
            width={20}
            height={15}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-[15px] w-5 rounded-[2px] object-cover"
        />
    );
}

// ─── Mapa de calor ────────────────────────────────────────────────────────────

function TrafficHeatmap({ grid }: { grid: number[][] }) {
    const t = useTranslations('statusPage.audience');
    const intlLocale = getIntlLocaleCode(useLocale());

    const { days, hours, max } = useMemo(() => {
        // 1 de janeiro de 2023 caiu num domingo, o dia 0 do GA4.
        const dayFmt = new Intl.DateTimeFormat(intlLocale, { weekday: 'short', timeZone: 'UTC' });
        const hourFmt = new Intl.DateTimeFormat(intlLocale, { hour: 'numeric', timeZone: 'UTC' });
        return {
            days: Array.from({ length: 7 }, (_, d) => dayFmt.format(Date.UTC(2023, 0, 1 + d)).replace('.', '')),
            hours: Array.from({ length: 24 }, (_, h) => hourFmt.format(Date.UTC(2023, 0, 1, h))),
            max: Math.max(0, ...grid.flat()),
        };
    }, [grid, intlLocale]);

    return (
        <div className="flex flex-col rounded-lg border border-border bg-card p-4">
            <h3 className="text-lg font-bold text-foreground">{t('traffic.title')}</h3>

            <div
                className="mt-3 grid flex-1 items-center gap-x-1 text-xs"
                style={{ gridTemplateColumns: 'auto repeat(7, minmax(0, 1fr))' }}
            >
                <span />
                {days.map((d) => (
                    <span key={d} className="pb-1 text-center font-semibold capitalize text-foreground">{d}</span>
                ))}

                {hours.map((label, h) => (
                    <HeatmapRow key={h} label={label}>
                        {days.map((dayLabel, d) => {
                            const value = grid[d]?.[h] ?? 0;
                            const ratio = max > 0 ? value / max : 0;
                            const size = value > 0 ? 6 + Math.round(ratio * 8) : 8;
                            return (
                                <span key={d} className="flex h-[18px] items-center justify-center">
                                    <span
                                        title={`${dayLabel} ${label} · ${t('traffic.tooltip', { count: value })}`}
                                        className={`rounded-full ${value > 0 ? 'bg-primary' : 'bg-muted'}`}
                                        style={{
                                            width: size,
                                            height: size,
                                            opacity: value > 0 ? 0.35 + ratio * 0.65 : 1,
                                        }}
                                    />
                                </span>
                            );
                        })}
                    </HeatmapRow>
                ))}
            </div>
        </div>
    );
}

function HeatmapRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <>
            <span className="pr-2 text-right tabular-nums text-muted-foreground">{label}</span>
            {children}
        </>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AudienceSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="h-[124px] animate-pulse rounded-lg border border-border bg-muted/40" />
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
                {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="h-[460px] animate-pulse rounded-lg border border-border bg-muted/40" />
                ))}
            </div>
        </div>
    );
}
