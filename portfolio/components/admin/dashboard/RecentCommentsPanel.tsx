// components/admin/dashboard/RecentCommentsPanel.tsx
'use client';

import { Link } from '@/i18n/navigation';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { MessageSquare, Ban, ArrowBigUp, ArrowBigDown, Pencil } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Panel, EmptyState } from './primitives';
import { timeAgo } from './format';
import type { RecentComment } from './types';

/** Score do comentário só aparece quando há voto — zero não é informação. */
function ScoreBadge({ score }: { score: number }) {
    if (score === 0) return null;
    const positive = score > 0;
    const Icon = positive ? ArrowBigUp : ArrowBigDown;
    return (
        <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
        >
            <Icon className="h-3 w-3" />
            {Math.abs(score)}
        </span>
    );
}

export function RecentCommentsPanel({
    comments, suspiciousCount,
}: {
    comments: RecentComment[];
    suspiciousCount: number;
}) {
    const t = useTranslations('admin.dashboard.recentComments');
    const locale = useLocale();

    return (
        <Panel
            title={t('title')}
            subtitle={suspiciousCount > 0 ? t('subtitleFlagged', { count: suspiciousCount }) : t('subtitle')}
            icon={MessageSquare}
            action={{ label: t('moderateAll'), href: '/admin/suspicious-comments' }}
            flush
            className="h-full"
        >
            {comments.length === 0 ? (
                <div className="px-5 pb-5">
                    <EmptyState icon={MessageSquare} message={t('empty')} />
                </div>
            ) : (
                <ul className="divide-y divide-border border-t border-border">
                    {comments.map((c) => (
                        <li key={c.id} className="px-5 py-3 transition-colors hover:bg-muted/40">
                            <div className="flex items-start gap-3">
                                <UserAvatar user={c.author} size={28} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                        <span className="text-xs font-semibold text-foreground">
                                            @{c.author.username}
                                        </span>
                                        {c.author.banned && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-1.5 py-px text-[10px] font-semibold text-red-600 dark:text-red-400">
                                                <Ban className="h-2.5 w-2.5" />
                                                {t('banned')}
                                            </span>
                                        )}
                                        <ScoreBadge score={c.score} />
                                        {c.edited && (
                                            <span
                                                className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/60"
                                                title={t('edited')}
                                            >
                                                <Pencil className="h-2.5 w-2.5" />
                                            </span>
                                        )}
                                        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                                            {timeAgo(c.createdAt, locale)}
                                        </span>
                                    </div>
                                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                        {c.excerpt}
                                    </p>
                                    <Link
                                        href={`/blog/${c.postSlug}`}
                                        className="mt-1 inline-block max-w-full truncate text-[11px] font-medium text-muted-foreground/70 transition-colors hover:text-foreground"
                                    >
                                        {t('onPost', { title: c.postTitle })}
                                    </Link>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    );
}
