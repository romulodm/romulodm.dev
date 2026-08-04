// components/admin/dashboard/TagPerformancePanel.tsx
'use client';

import { Tags } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Panel, EmptyState } from './primitives';
import { TagDonut } from './charts';
import { CHART_COLORS } from './useChart';
import { fmtCompact, fmtNumber } from './format';
import type { TagPerformance } from './types';

export function TagPerformancePanel({ tags }: { tags: TagPerformance[] }) {
    const t = useTranslations('admin.dashboard.tags');
    const locale = useLocale();

    const totalViews = tags.reduce((s, x) => s + x.views, 0);
    const bestAvg = Math.max(...tags.map((x) => x.avgViews), 0);

    return (
        <Panel title={t('title')} subtitle={t('subtitle')} icon={Tags} className="h-full">
            {tags.length === 0 ? (
                <EmptyState icon={Tags} message={t('empty')} />
            ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <TagDonut data={tags} />
                    <ul className="min-w-0 flex-1 space-y-1.5">
                        {tags.slice(0, 6).map((tag, i) => {
                            const share = totalViews > 0
                                ? Math.round((tag.views / totalViews) * 100)
                                : 0;
                            const isBest = tag.avgViews === bestAvg && bestAvg > 0;
                            return (
                                <li key={tag.tag} className="flex items-center gap-2 text-xs">
                                    <span
                                        className="h-2 w-2 shrink-0 rounded-full"
                                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                                    />
                                    <span className="min-w-0 flex-1 truncate text-muted-foreground" title={tag.tag}>
                                        {tag.tag}
                                    </span>
                                    <span
                                        className={`shrink-0 tabular-nums ${isBest ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/70'}`}
                                        title={t('avgViewsTooltip', { count: tag.posts })}
                                    >
                                        {fmtCompact(tag.avgViews, locale)}
                                        <span className="ml-0.5 text-[10px]">{t('perPost')}</span>
                                    </span>
                                    <span className="w-8 shrink-0 text-right font-medium tabular-nums text-foreground">
                                        {share}%
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {tags.length > 0 && (
                <p className="mt-3 border-t border-border pt-3 text-[11px] leading-snug text-muted-foreground/70">
                    {t('footnote', {
                        tag: tags.reduce((a, b) => (b.avgViews > a.avgViews ? b : a)).tag,
                        value: fmtNumber(bestAvg, locale),
                    })}
                </p>
            )}
        </Panel>
    );
}
