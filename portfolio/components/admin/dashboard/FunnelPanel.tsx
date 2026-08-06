// components/admin/dashboard/FunnelPanel.tsx
'use client';

import { Filter, Eye, Heart, MessageSquare } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Panel } from './primitives';
import { fmtNumber, fmtPercent } from './format';
import type { DashboardData } from './types';

/** Referências de mercado para blogs técnicos — contexto, não veredito. */
const BENCHMARK = { like: 1.5, comment: 0.5 };

interface Step {
    key: string;
    /** Aceita `style` porque a cor de cada etapa vem do dado, não de classe. */
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    value: number;
    color: string;
    /** Conversão a partir de views. Null no topo do funil. */
    rate: number | null;
    benchmark?: number;
}

export function FunnelPanel({ funnel }: { funnel: DashboardData['funnel'] }) {
    const t = useTranslations('admin.dashboard.funnel');
    const locale = useLocale();

    const steps: Step[] = [
        { key: 'views', icon: Eye, value: funnel.views, color: '#3b82f6', rate: null },
        { key: 'likes', icon: Heart, value: funnel.likes, color: '#f43f5e', rate: funnel.likeRate, benchmark: BENCHMARK.like },
        { key: 'comments', icon: MessageSquare, value: funnel.comments, color: '#8b5cf6', rate: funnel.commentRate, benchmark: BENCHMARK.comment },
    ];

    const max = Math.max(...steps.map((s) => s.value), 1);

    return (
        <Panel title={t('title')} subtitle={t('subtitle')} icon={Filter} className="h-full">
            <div className="space-y-4">
                {steps.map((step) => {
                    const Icon = step.icon;
                    // Escala logarítmica: com views 128 e likes 1, a barra linear
                    // do último passo seria invisível.
                    const width = step.value === 0
                        ? 0
                        : Math.max(4, (Math.log10(step.value + 1) / Math.log10(max + 1)) * 100);

                    const beatsBenchmark = step.benchmark !== undefined && step.rate !== null
                        ? step.rate >= step.benchmark
                        : null;

                    return (
                        <div key={step.key}>
                            <div className="mb-1.5 flex items-baseline justify-between gap-2">
                                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                    <Icon className="h-3.5 w-3.5" style={{ color: step.color }} />
                                    {t(`steps.${step.key}`)}
                                </span>
                                <span className="flex items-baseline gap-2">
                                    <span className="text-sm font-semibold tabular-nums text-foreground">
                                        {fmtNumber(step.value, locale)}
                                    </span>
                                    {step.rate !== null && (
                                        <span
                                            className={`text-xs font-medium tabular-nums ${beatsBenchmark
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-muted-foreground'
                                                }`}
                                            title={step.benchmark ? t('benchmarkTooltip', { value: step.benchmark }) : undefined}
                                        >
                                            {fmtPercent(step.rate, locale)}
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full transition-[width] duration-500"
                                    style={{ width: `${width}%`, background: step.color }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
                <div>
                    <p className="text-xs text-muted-foreground">{t('engagementRate')}</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                        {fmtPercent(Math.round((funnel.likeRate + funnel.commentRate) * 10) / 10, locale)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">{t('depth')}</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                        {fmtPercent(funnel.commentPerLike, locale)}
                    </p>
                </div>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground/70">
                {t('depthHint')}
            </p>
        </Panel>
    );
}
