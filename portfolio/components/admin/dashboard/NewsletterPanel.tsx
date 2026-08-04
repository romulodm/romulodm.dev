// components/admin/dashboard/NewsletterPanel.tsx
'use client';

import { Mail, MailCheck, MailX, Send, CalendarClock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Panel, GrowthBadge } from './primitives';
import { fmtNumber, fmtPercent, timeAgo } from './format';
import type { DashboardData } from './types';

/** Qualidade da taxa de abertura por faixa — 30%+ é bom para newsletter técnica. */
function openRateTone(rate: number) {
    if (rate >= 30) return 'text-emerald-600 dark:text-emerald-400';
    if (rate >= 15) return 'text-amber-600 dark:text-amber-500';
    return 'text-red-600 dark:text-red-400';
}

export function NewsletterPanel({
    newsletter, subscribers,
}: {
    newsletter: DashboardData['newsletter'];
    subscribers: DashboardData['deltas']['subscribers'];
}) {
    const t = useTranslations('admin.dashboard.newsletter');
    const locale = useLocale();
    const { lastCampaign } = newsletter;

    return (
        <Panel
            title={t('title')}
            subtitle={t('subtitle', { count: newsletter.confirmed })}
            icon={Mail}
            action={{ label: t('manage'), href: '/admin/newsletter' }}
            className="h-full"
        >
            {/* Saldo líquido do período: ganhos menos perdas */}
            <div className="mb-4 flex items-end justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
                <div>
                    <p className="text-[11px] text-muted-foreground">{t('netGrowth')}</p>
                    <p className="mt-0.5 flex items-baseline gap-2">
                        <span className={`text-xl font-semibold tabular-nums ${subscribers.net > 0 ? 'text-emerald-600 dark:text-emerald-400'
                            : subscribers.net < 0 ? 'text-red-600 dark:text-red-400'
                                : 'text-foreground'
                            }`}>
                            {subscribers.net > 0 ? '+' : ''}{subscribers.net}
                        </span>
                        <GrowthBadge growth={subscribers.growth} />
                    </p>
                </div>
                <div className="flex gap-3 text-right">
                    <div>
                        <p className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                            <MailCheck className="h-3 w-3" />{t('gained')}
                        </p>
                        <p className="text-sm font-semibold tabular-nums text-foreground">{subscribers.gained}</p>
                    </div>
                    <div>
                        <p className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                            <MailX className="h-3 w-3" />{t('lost')}
                        </p>
                        <p className="text-sm font-semibold tabular-nums text-foreground">{subscribers.lost}</p>
                    </div>
                </div>
            </div>

            {/* Métricas estruturais */}
            <div className="grid grid-cols-4 gap-2">
                <div>
                    <p className="text-lg font-semibold tabular-nums text-foreground">
                        {fmtNumber(newsletter.confirmed, locale)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{t('confirmed')}</p>
                </div>
                <div>
                    <p className={`text-lg font-semibold tabular-nums ${newsletter.pending > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-foreground'
                        }`}>
                        {fmtNumber(newsletter.pending, locale)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{t('pending')}</p>
                </div>
                <div>
                    <p className="text-lg font-semibold tabular-nums text-foreground">
                        {fmtPercent(newsletter.confirmationRate, locale)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{t('confirmRate')}</p>
                </div>
                <div>
                    <p className={`text-lg font-semibold tabular-nums ${openRateTone(newsletter.globalOpenRate)}`}>
                        {fmtPercent(newsletter.globalOpenRate, locale)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{t('openRate')}</p>
                </div>
            </div>

            {/* Churn */}
            {subscribers.churnRate > 0 && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                    {t('churn', { value: fmtPercent(subscribers.churnRate, locale) })}
                </p>
            )}

            {/* Última campanha */}
            {lastCampaign ? (
                <div className="mt-4 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground" title={lastCampaign.subject}>
                            <Send className="mr-1.5 inline h-3 w-3 text-muted-foreground" />
                            {lastCampaign.subject}
                        </p>
                        {lastCampaign.sentAt && (
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                                {timeAgo(lastCampaign.sentAt, locale)}
                            </span>
                        )}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                        <span>{t('sent', { count: lastCampaign.sentCount })}</span>
                        {lastCampaign.openRate !== null && (
                            <>
                                <span aria-hidden>·</span>
                                <span className={openRateTone(lastCampaign.openRate)}>
                                    {t('opened', { value: fmtPercent(lastCampaign.openRate, locale) })}
                                </span>
                            </>
                        )}
                        {lastCampaign.failedCount > 0 && (
                            <>
                                <span aria-hidden>·</span>
                                <span className="text-red-600 dark:text-red-400">
                                    {t('failed', { count: lastCampaign.failedCount })}
                                </span>
                            </>
                        )}
                    </p>
                </div>
            ) : (
                <p className="mt-4 text-xs text-muted-foreground">{t('noCampaign')}</p>
            )}

            {newsletter.scheduledCampaigns > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-sky-600 dark:text-sky-400">
                    <CalendarClock className="h-3 w-3" />
                    {t('scheduled', { count: newsletter.scheduledCampaigns })}
                </p>
            )}
        </Panel>
    );
}
