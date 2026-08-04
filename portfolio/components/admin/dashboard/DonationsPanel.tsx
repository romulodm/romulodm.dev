// components/admin/dashboard/DonationsPanel.tsx
'use client';

import { Coffee, CreditCard, Landmark, Users, Repeat, Receipt } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Panel, EmptyState } from './primitives';
import { fmtAmount, fmtCurrency, fmtNumber, fmtPercent, timeAgo } from './format';
import type { Donation, DashboardData } from './types';

const PROVIDER_META: Record<string, { icon: React.ReactNode; tone: string }> = {
    STRIPE: {
        icon: <CreditCard className="h-3 w-3" />,
        tone: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    PIX: {
        icon: <Landmark className="h-3 w-3" />,
        tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    ETH: {
        icon: <span className="text-[10px] font-bold leading-none">Ξ</span>,
        tone: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
};

function ProviderBadge({ provider, showLabel }: { provider: string; showLabel?: boolean }) {
    const meta = PROVIDER_META[provider] ?? {
        icon: null,
        tone: 'bg-muted text-muted-foreground',
    };
    return (
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.tone}`}>
            {meta.icon}
            {showLabel && provider}
        </span>
    );
}

function DonorRow({
    donation, index, showRank, showTime, locale, t,
}: {
    donation: Donation;
    index: number;
    showRank?: boolean;
    showTime?: boolean;
    locale: string;
    t: ReturnType<typeof useTranslations>;
}) {
    const name = donation.isPrivate
        ? t('anonymous')
        : donation.name || t('someone');

    const initial = donation.isPrivate || !donation.name
        ? '?'
        : donation.name.charAt(0).toUpperCase();

    return (
        <li className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-muted/40">
            {showRank && (
                <span className={`w-4 shrink-0 text-xs font-bold tabular-nums ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-orange-600' : 'text-muted-foreground/50'
                    }`}>
                    {index + 1}
                </span>
            )}
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {initial}
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{name}</p>
                <p className="text-[11px] text-muted-foreground">
                    {showTime && `${timeAgo(donation.createdAt, locale)} · `}
                    {t('coffees', { count: donation.coffees })}
                </p>
            </div>
            <ProviderBadge provider={donation.provider} showLabel={showTime} />
            <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                {fmtAmount(donation.amount, donation.currency, locale)}
            </span>
        </li>
    );
}

function DonationList({
    title, subtitle, items, showRank, showTime,
}: {
    title: string;
    subtitle: string;
    items: Donation[];
    showRank?: boolean;
    showTime?: boolean;
}) {
    const t = useTranslations('admin.dashboard.donations');
    const locale = useLocale();

    return (
        <Panel title={title} subtitle={subtitle} icon={Coffee} flush className="h-full">
            {items.length === 0 ? (
                <div className="px-5 pb-5">
                    <EmptyState icon={Coffee} message={t('empty')} />
                </div>
            ) : (
                <ul className="divide-y divide-border border-t border-border">
                    {items.map((d, i) => (
                        <DonorRow
                            key={d.id}
                            donation={d}
                            index={i}
                            showRank={showRank}
                            showTime={showTime}
                            locale={locale}
                            t={t}
                        />
                    ))}
                </ul>
            )}
        </Panel>
    );
}

/** Mix de provedores: onde o dinheiro realmente entra. */
function ProviderMix({
    mix, repeatDonors, totalSupporters, avgTicket,
}: {
    mix: DashboardData['donations']['providerMix'];
    repeatDonors: number;
    totalSupporters: number;
    avgTicket: number;
}) {
    const t = useTranslations('admin.dashboard.donations');
    const locale = useLocale();

    const totalCount = mix.reduce((s, m) => s + m.count, 0);

    return (
        <Panel title={t('mixTitle')} subtitle={t('mixSubtitle')} icon={Receipt} className="h-full">
            <div className="space-y-3">
                {totalCount === 0 ? (
                    <EmptyState icon={Receipt} message={t('empty')} />
                ) : (
                    mix.map((m) => {
                        const share = Math.round((m.count / totalCount) * 1000) / 10;
                        const tone = m.provider === 'PIX' ? '#10b981' : m.provider === 'STRIPE' ? '#3b82f6' : '#8b5cf6';
                        return (
                            <div key={m.provider}>
                                <div className="mb-1 flex items-baseline justify-between gap-2">
                                    <span className="flex items-center gap-2">
                                        <ProviderBadge provider={m.provider} />
                                        <span className="text-xs font-medium text-foreground">{m.provider}</span>
                                    </span>
                                    <span className="text-[11px] tabular-nums text-muted-foreground">
                                        {t('txCount', { count: m.count })} · {fmtPercent(share, locale)}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full transition-[width] duration-500"
                                        style={{ width: `${share}%`, background: tone }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
                <div>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Users className="h-3 w-3" />{t('supporters')}
                    </p>
                    <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">
                        {fmtNumber(totalSupporters, locale)}
                    </p>
                </div>
                <div>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Repeat className="h-3 w-3" />{t('repeat')}
                    </p>
                    <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">
                        {fmtNumber(repeatDonors, locale)}
                    </p>
                </div>
                <div>
                    <p className="text-[11px] text-muted-foreground">{t('avgTicket')}</p>
                    <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">
                        {fmtCurrency(avgTicket, locale)}
                    </p>
                </div>
            </div>
        </Panel>
    );
}

export function DonationsSection({ data }: { data: DashboardData }) {
    const t = useTranslations('admin.dashboard.donations');

    return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <DonationList
                title={t('recentTitle')}
                subtitle={t('recentSubtitle')}
                items={data.donations.recent}
                showTime
            />
            <DonationList
                title={t('topTitle')}
                subtitle={t('topSubtitle')}
                items={data.donations.top}
                showRank
            />
            <ProviderMix
                mix={data.donations.providerMix}
                repeatDonors={data.donations.repeatDonors}
                totalSupporters={data.overview.totalSupporters}
                avgTicket={data.overview.avgTicketBrl}
            />
        </div>
    );
}
