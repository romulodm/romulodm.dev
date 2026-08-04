// components/admin/dashboard/DraftsPanel.tsx
'use client';

import { Link } from '@/i18n/navigation';
import { FileEdit, Plus, Sparkles, Eye, Heart, MessageSquare } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Panel, EmptyState, LocaleChips } from './primitives';
import { fmtNumber, timeAgo } from './format';
import type { DashboardData } from './types';

/** Rascunhos + destaque do período no mesmo painel: pauta e resultado juntos. */
export function DraftsPanel({
    drafts, highlight,
}: {
    drafts: DashboardData['drafts'];
    highlight: DashboardData['highlight'];
}) {
    const t = useTranslations('admin.dashboard.drafts');
    const locale = useLocale();

    return (
        <Panel
            title={t('title')}
            subtitle={t('subtitle', { count: drafts.length })}
            icon={FileEdit}
            action={{ label: t('newPost'), href: '/admin/posts/new' }}
            className="h-full"
        >
            {drafts.length === 0 ? (
                <EmptyState
                    icon={Plus}
                    message={t('empty')}
                    action={{ label: t('startWriting'), href: '/admin/posts/new' }}
                />
            ) : (
                <ul className="-mx-2 space-y-0.5">
                    {drafts.map((d) => (
                        <li key={d.id}>
                            <Link
                                href={`/admin/posts/${d.id}/edit`}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60"
                            >
                                <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                                    {d.title}
                                </span>
                                <LocaleChips locales={d.locales} />
                                <span className="shrink-0 text-[11px] text-muted-foreground">
                                    {timeAgo(d.updatedAt, locale)}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {/* Destaque do período */}
            <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    {t('highlight')}
                </p>
                {highlight ? (
                    <>
                        <Link
                            href={`/admin/posts/${highlight.id}/edit`}
                            className="line-clamp-2 text-xs font-semibold text-foreground hover:underline"
                        >
                            {highlight.title}
                        </Link>
                        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />{fmtNumber(highlight.views, locale)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />{highlight.likes}
                            </span>
                            <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />{highlight.commentsCount}
                            </span>
                        </div>
                    </>
                ) : (
                    <p className="text-xs text-muted-foreground">{t('noHighlight')}</p>
                )}
            </div>
        </Panel>
    );
}
