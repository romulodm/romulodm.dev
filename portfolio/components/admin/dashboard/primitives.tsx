// components/admin/dashboard/primitives.tsx
'use client';

import { Link } from '@/i18n/navigation';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

// ─── GrowthBadge

interface GrowthBadgeProps {
    growth: number | null;
    /** Métricas onde subir é ruim (churn, falhas) invertem a cor. */
    invert?: boolean;
    size?: 'sm' | 'md';
    className?: string;
}

export function GrowthBadge({ growth, invert = false, size = 'sm', className = '' }: GrowthBadgeProps) {
    const t = useTranslations('admin.dashboard.growth');
    if (growth === null) {
        return (
            <span className={`inline-flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
                <Minus className="h-3 w-3" />
                {t('noBaseline')}
            </span>
        );
    }

    const isFlat = growth === 0;
    const isUp = growth > 0;
    const isGood = invert ? !isUp : isUp;

    const tone = isFlat
        ? 'bg-muted text-muted-foreground'
        : isGood
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 text-red-600 dark:text-red-400';

    const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
    const pad = size === 'md' ? 'px-2.5 py-1 text-sm' : 'px-2 py-0.5 text-xs';

    return (
        <span className={`inline-flex items-center gap-1 rounded-full font-medium tabular-nums ${pad} ${tone} ${className}`}>
            <Icon className="h-3 w-3 shrink-0" />
            {isFlat ? t('flat') : `${isUp ? '+' : ''}${growth}%`}
        </span>
    );
}

// ─── Sparkline

interface SparklineProps {
    values: number[];
    /** Cor da linha; herda currentColor por padrão. */
    className?: string;
    height?: number;
}

/**
 * SVG puro, sem Chart.js — são muitos por página e o custo de uma instância
 * de canvas por KPI não se justifica.
 */
export function Sparkline({ values, className = 'text-muted-foreground', height = 28 }: SparklineProps) {
    if (values.length < 2) return <div style={{ height }} aria-hidden />;

    const max = Math.max(...values);
    const min = Math.min(...values);
    const span = max - min || 1;
    const w = 100;
    const step = w / (values.length - 1);

    const points = values.map((v, i) => {
        const x = i * step;
        const y = height - ((v - min) / span) * (height - 4) - 2;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    const line = `M ${points.join(' L ')}`;
    const area = `${line} L ${w},${height} L 0,${height} Z`;

    return (
        <svg
            viewBox={`0 0 ${w} ${height}`}
            preserveAspectRatio="none"
            className={`w-full ${className}`}
            style={{ height }}
            aria-hidden
        >
            <path d={area} fill="currentColor" opacity="0.1" />
            <path d={line} fill="none" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

// ─── KpiCard

interface KpiCardProps {
    label: string;
    value: string;
    /** Linha secundária: contexto do número, não repetição dele. */
    sub?: string;
    icon: React.ComponentType<{ className?: string }>;
    accent?: string;
    growth?: number | null;
    invertGrowth?: boolean;
    spark?: number[];
    href?: string;
}

export function KpiCard({
    label, value, sub, icon: Icon, accent = 'text-muted-foreground',
    growth, invertGrowth, spark, href,
}: KpiCardProps) {
    const body = (
        <>
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <Icon className={`h-4 w-4 shrink-0 ${accent}`} />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
            <div className="mt-1 flex items-center gap-2">
                {growth !== undefined && <GrowthBadge growth={growth} invert={invertGrowth} />}
                {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
            </div>
            {spark && spark.length > 1 && (
                <div className={`mt-3 ${accent}`}><Sparkline values={spark} className="" /></div>
            )}
        </>
    );

    const shell = 'rounded-xl border border-border bg-card p-4 transition-colors';

    if (href) {
        return (
            <Link href={href} className={`${shell} block hover:border-foreground/20 hover:bg-muted/40`}>
                {body}
            </Link>
        );
    }
    return <div className={shell}>{body}</div>;
}

// ─── Panel

interface PanelProps {
    title: string;
    /** Subtítulo explica o recorte temporal ou a origem do dado. */
    subtitle?: string;
    icon?: React.ComponentType<{ className?: string }>;
    action?: { label: string; href: string };
    legend?: { label: string; color: string }[];
    children: React.ReactNode;
    className?: string;
    /** Padding zero para painéis que contêm listas divididas por borda. */
    flush?: boolean;
}

export function Panel({
    title, subtitle, icon: Icon, action, legend, children, className = '', flush = false,
}: PanelProps) {
    return (
        <section className={`flex flex-col overflow-hidden rounded-xl border border-border bg-card ${className}`}>
            <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
                        <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
                    </div>
                    {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    {legend && (
                        <div className="hidden items-center gap-3 sm:flex">
                            {legend.map((l) => (
                                <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                                    {l.label}
                                </span>
                            ))}
                        </div>
                    )}
                    {action && (
                        <Link
                            href={action.href}
                            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {action.label}
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    )}
                </div>
            </header>
            <div className={flush ? 'flex-1' : 'flex-1 px-5 pb-5'}>{children}</div>
        </section>
    );
}

// ─── EmptyState

interface EmptyStateProps {
    icon: React.ComponentType<{ className?: string }>;
    message: string;
    /** Um vazio útil sugere a próxima ação em vez de só constatar o vazio. */
    action?: { label: string; href: string };
}

export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
    return (
        <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 py-6 text-center">
            <Icon className="h-5 w-5 text-muted-foreground/40" />
            <p className="max-w-[220px] text-xs text-muted-foreground">{message}</p>
            {action && (
                <Link
                    href={action.href}
                    className="mt-1 text-xs font-medium text-primary transition-opacity hover:opacity-80"
                >
                    {action.label} →
                </Link>
            )}
        </div>
    );
}

// ─── SectionHeading

export function SectionHeading({
    icon: Icon, children, aside,
}: {
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    aside?: React.ReactNode;
}) {
    return (
        <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">{children}</h2>
            </div>
            {aside}
        </div>
    );
}

// ─── LocaleChips

/** Mostra de relance se o post tem as duas traduções. */
export function LocaleChips({ locales }: { locales: string[] }) {
    const all = ['pt', 'en'];
    return (
        <span className="flex shrink-0 items-center gap-1">
            {all.map((l) => {
                const has = locales.includes(l);
                return (
                    <span
                        key={l}
                        title={l.toUpperCase()}
                        className={`rounded px-1 py-px text-[10px] font-semibold uppercase leading-tight ${has
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground/50 line-through'
                            }`}
                    >
                        {l}
                    </span>
                );
            })}
        </span>
    );
}
