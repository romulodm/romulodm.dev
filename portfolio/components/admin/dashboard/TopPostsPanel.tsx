// components/admin/dashboard/TopPostsPanel.tsx
'use client';

import { Link } from '@/i18n/navigation';
import { Trophy, Eye, Heart, MessageSquare, FileText } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Panel, EmptyState, LocaleChips } from './primitives';
import { fmtNumber, fmtPercent } from './format';
import type { TopPost } from './types';

const RANK_TONE = ['text-amber-500', 'text-slate-400', 'text-orange-600'];

/**
 * Ranking por views, mas com taxa de engajamento ao lado — um post com muitas
 * views e engajamento baixo é um problema diferente de um post pouco visto.
 */
export function TopPostsPanel({ posts }: { posts: TopPost[] }) {
    const t = useTranslations('admin.dashboard.topPosts');
    const locale = useLocale();

    const maxViews = Math.max(...posts.map((p) => p.views), 1);

    return (
        <Panel
            title={t('title')}
            subtitle={t('subtitle')}
            icon={Trophy}
            action={{ label: t('allPosts'), href: '/admin/posts' }}
            flush
            className="h-full"
        >
            {posts.length === 0 ? (
                <div className="px-5 pb-5">
                    <EmptyState
                        icon={FileText}
                        message={t('empty')}
                        action={{ label: t('createPost'), href: '/admin/posts/new' }}
                    />
                </div>
            ) : (
                <ul className="divide-y divide-border border-t border-border">
                    {posts.map((p, i) => (
                        <li key={p.slug} className="relative px-5 py-2.5 transition-colors hover:bg-muted/40">
                            {/* Barra de fundo proporcional às views: comparação visual sem gráfico */}
                            <div
                                className="pointer-events-none absolute inset-y-0 left-0 bg-blue-500/5"
                                style={{ width: `${(p.views / maxViews) * 100}%` }}
                                aria-hidden
                            />
                            <div className="relative flex items-center gap-3">
                                <span className={`w-5 shrink-0 text-xs font-bold tabular-nums ${RANK_TONE[i] ?? 'text-muted-foreground/50'}`}>
                                    {i + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/admin/posts/${p.id}/edit`}
                                            className="truncate text-xs font-medium text-foreground hover:underline"
                                        >
                                            {p.title}
                                        </Link>
                                        <LocaleChips locales={p.locales} />
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-2.5 text-[11px] text-muted-foreground">
                                        {p.tag && (
                                            <span className="rounded-full bg-muted px-1.5 py-px">{p.tag}</span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Heart className="h-2.5 w-2.5" />{p.likes}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="h-2.5 w-2.5" />{p.commentsCount}
                                        </span>
                                        <span
                                            className={p.engagementRate >= 2
                                                ? 'font-medium text-emerald-600 dark:text-emerald-400'
                                                : ''}
                                            title={t('engagementTooltip')}
                                        >
                                            {fmtPercent(p.engagementRate, locale)}
                                        </span>
                                    </div>
                                </div>
                                <span className="flex shrink-0 items-center gap-1 text-xs font-semibold tabular-nums text-foreground">
                                    <Eye className="h-3 w-3 text-muted-foreground" />
                                    {fmtNumber(p.views, locale)}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
}
