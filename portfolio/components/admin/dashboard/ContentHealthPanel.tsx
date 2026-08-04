// components/admin/dashboard/ContentHealthPanel.tsx
'use client';

import { Stethoscope, Languages, Clock, Gauge, MessageSquareDashed } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Panel, GrowthBadge } from './primitives';
import { fmtNumber, fmtPercent } from './format';
import type { DashboardData } from './types';

function Metric({
    icon: Icon, label, value, hint, tone = 'text-foreground',
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    hint?: string;
    tone?: string;
}) {
    return (
        <div className="flex items-start gap-2.5">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-base font-semibold tabular-nums ${tone}`}>{value}</p>
                {hint && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/70">{hint}</p>}
            </div>
        </div>
    );
}

/** Barra de cobertura de tradução por locale. */
function CoverageBar({ locale, done, total, percent }: { locale: string; done: number; total: number; percent: number }) {
    const complete = percent >= 100;
    return (
        <div>
            <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="font-medium uppercase text-muted-foreground">{locale}</span>
                <span className="tabular-nums text-muted-foreground">
                    {done}/{total}
                </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className={`h-full rounded-full transition-[width] duration-500 ${complete ? 'bg-emerald-500' : percent >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                />
            </div>
        </div>
    );
}

export function ContentHealthPanel({ health }: { health: DashboardData['contentHealth'] }) {
    const t = useTranslations('admin.dashboard.contentHealth');
    const locale = useLocale();
    const { translationCoverage: cov, publishVelocity: vel } = health;

    return (
        <Panel
            title={t('title')}
            subtitle={t('subtitle', { count: health.publishedTotal })}
            icon={Stethoscope}
            className="h-full"
        >
            {/* Cobertura de tradução */}
            <div className="mb-5">
                <div className="mb-2 flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground">{t('coverage')}</p>
                </div>
                <div className="space-y-2.5">
                    <CoverageBar locale="pt" done={cov.pt} total={health.publishedTotal} percent={cov.ptPercent} />
                    <CoverageBar locale="en" done={cov.en} total={health.publishedTotal} percent={cov.enPercent} />
                </div>
                {health.untranslatedPosts > 0 && (
                    <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-500">
                        {t('untranslated', { count: health.untranslatedPosts })}
                    </p>
                )}
            </div>

            {/* Métricas operacionais */}
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <Metric
                    icon={Gauge}
                    label={t('velocity')}
                    value={t('perWeek', { value: vel.perWeek })}
                    hint={t('velocityHint', { current: vel.current, previous: vel.previous })}
                />
                <Metric
                    icon={Clock}
                    label={t('avgReadingTime')}
                    value={t('minutes', { value: health.avgReadingTime })}
                    hint={t('avgViews', { value: fmtNumber(health.avgViewsPerPost, locale) })}
                />
            </div>

            <div className="mt-4 flex items-start justify-between gap-3 border-t border-border pt-4">
                <Metric
                    icon={MessageSquareDashed}
                    label={t('orphans')}
                    value={fmtNumber(health.orphanPosts, locale)}
                    hint={t('orphansHint')}
                    tone={health.orphanPosts > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-foreground'}
                />
                <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">{t('velocityTrend')}</p>
                    <GrowthBadge growth={vel.growth} className="mt-1" />
                </div>
            </div>

            {health.publishedTotal > 0 && (
                <p className="mt-3 text-[11px] leading-snug text-muted-foreground/70">
                    {t('orphanShare', {
                        value: fmtPercent(
                            Math.round((health.orphanPosts / health.publishedTotal) * 1000) / 10,
                            locale,
                        ),
                    })}
                </p>
            )}
        </Panel>
    );
}
