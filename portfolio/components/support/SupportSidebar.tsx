'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { formatDistanceToNow } from '@/lib/utils'
import { Trophy, Clock, Infinity as InfinityIcon, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import { MessageModal } from './MessageModal'

interface Donor {
    id: string
    name: string | null
    message: string | null
    isPrivate: boolean
    amount: number
    coffees: number
    createdAt: Date
    currency?: string
    // Linked account (optional)
    userId: string | null
    username: string | null
}

export type RankingPeriod = 'all' | 'week' | 'month'

interface Props {
    topDonors: Record<RankingPeriod, Donor[]>
    recentDonors: Donor[]
}

const PERIOD_OPTIONS: { value: RankingPeriod; icon: LucideIcon }[] = [
    { value: 'all', icon: InfinityIcon },
    { value: 'week', icon: CalendarDays },
    { value: 'month', icon: CalendarRange },
]

const PAGE_SIZE = 10
/** Only the all-time ranking paginates; the server sends at most MAX_PAGES * PAGE_SIZE rows. */
const MAX_PAGES = 3

type ModalState = { name: string | null; message: string } | null

function MessageLine({
    isPrivate,
    message,
    onOpen,
}: {
    isPrivate: boolean
    message: string | null
    onOpen: () => void
}) {
    const t = useTranslations('support')
    if (isPrivate)
        return <p className="text-xs text-muted-foreground/60 mt-0.5 italic">{t('sidebar.privateMessage')}</p>
    if (!message)
        return <p className="text-xs text-muted-foreground/60 mt-0.5 italic">{t('sidebar.noMessage')}</p>
    return (
        <button
            onClick={onOpen}
            className="text-xs text-primary/70 hover:text-primary mt-0.5 underline underline-offset-2 transition-colors text-left"
        >
            {t('sidebar.viewMessage')}
        </button>
    )
}

function DonorName({
    donor,
    locale,
}: {
    donor: Donor
    locale: string
}) {
    const t = useTranslations('support')
    const displayName = donor.username ?? donor.name

    if (donor.username) {
        return (
            <Link
                href={`/${locale}/profile/${donor.username}`}
                className="font-medium text-sm text-foreground hover:text-primary transition-colors truncate"
            >
                @{donor.username}
            </Link>
        )
    }

    return (
        <span className="font-medium text-sm text-foreground truncate">
            {displayName || t('sidebar.anonymous')}
        </span>
    )
}

export function SupportersSidebar({ topDonors, recentDonors }: Props) {
    const t = useTranslations('support')
    const locale = useLocale()
    const [modal, setModal] = useState<ModalState>(null)
    const [period, setPeriod] = useState<RankingPeriod>('all')
    const [page, setPage] = useState(0)

    const periodDonors = topDonors[period]
    const pageCount = period === 'all'
        ? Math.min(MAX_PAGES, Math.ceil(periodDonors.length / PAGE_SIZE))
        : 1
    const offset = period === 'all' ? page * PAGE_SIZE : 0
    const visibleDonors = periodDonors.slice(offset, offset + PAGE_SIZE)
    const hasAnyDonor = topDonors.all.length > 0 || recentDonors.length > 0

    const handlePeriodChange = (next: RankingPeriod) => {
        if (next === period) return
        setPeriod(next)
        setPage(0)
    }

    return (
        <>
            <div className="space-y-8">
                {topDonors.all.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-6">
                        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                            <h2 className="type-h3 text-foreground flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-primary" />
                                {t('sidebar.topSupporters')}
                            </h2>
                            <div
                                role="tablist"
                                aria-label={t('sidebar.period.label')}
                                className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-gray-300/30 dark:bg-neutral-800/50"
                            >
                                {PERIOD_OPTIONS.map(({ value, icon: Icon }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        role="tab"
                                        aria-selected={period === value}
                                        onClick={() => handlePeriodChange(value)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                                            ${period === value
                                                ? 'bg-gray-400/40 dark:bg-neutral-800 text-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <Icon className="w-3 h-3" />
                                        {t(`sidebar.period.${value}`)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {visibleDonors.length === 0 && (
                            <p className="text-sm text-muted-foreground py-6 text-center">
                                {t(`sidebar.period.empty.${period}`)}
                            </p>
                        )}
                        <ol className="space-y-3" start={offset + 1}>
                            {visibleDonors.map((donor, i) => {
                                const index = offset + i
                                return (
                                <li key={donor.id} className="flex items-start gap-1">
                                    <span className={`text-sm font-bold min-w-[28px] ${index === 0 ? 'text-amber-500'
                                            : index === 1 ? 'text-slate-600 dark:text-slate-200'
                                                : index === 2 ? 'text-orange-600'
                                                    : 'text-muted-foreground'
                                        }`}>
                                        #{index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1 min-w-0">
                                                <DonorName donor={donor} locale={locale} />
                                                <span className="text-muted-foreground font-normal text-sm shrink-0">
                                                    · {t('sidebar.coffees', { count: donor.coffees })}
                                                </span>
                                            </div>
                                            <span className="text-sm font-semibold text-foreground shrink-0">
                                                R$ {(donor.amount / 100).toFixed(2)}
                                            </span>
                                        </div>
                                        <MessageLine
                                            isPrivate={donor.isPrivate}
                                            message={donor.message}
                                            onOpen={() => setModal({ name: donor.name, message: donor.message! })}
                                        />
                                    </div>
                                </li>
                                )
                            })}
                        </ol>
                        {pageCount > 1 && (
                            <nav
                                aria-label={t('sidebar.pagination.label')}
                                className="flex items-center justify-center gap-1 mt-5 pt-4 border-t border-border"
                            >
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => p - 1)}
                                    disabled={page === 0}
                                    aria-label={t('sidebar.pagination.previous')}
                                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: pageCount }, (_, p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPage(p)}
                                        aria-current={page === p ? 'page' : undefined}
                                        className={`min-w-[28px] h-7 px-2 rounded-md text-xs font-medium transition-all
                                            ${page === p
                                                ? 'bg-gray-400/40 dark:bg-neutral-800 text-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {p + 1}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={page >= pageCount - 1}
                                    aria-label={t('sidebar.pagination.next')}
                                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </nav>
                        )}
                    </div>
                )}

                {recentDonors.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h2 className="type-h3 text-foreground flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-primary" />
                            {t('sidebar.recentSupport')}
                        </h2>
                        <div className="space-y-4">
                            {recentDonors.map((donor) => (
                                <div key={donor.id} className="flex items-start gap-3 pb-1">
                                    <div className="w-8 h-8 rounded-full bg-primary/30 dark:bg-primary/10 flex items-center justify-center text-sm shrink-0">
                                        ☕
                                    </div>
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <DonorName donor={donor} locale={locale} />
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {formatDistanceToNow(donor.createdAt, locale)}
                                            </span>
                                        </div>
                                        <MessageLine
                                            isPrivate={donor.isPrivate}
                                            message={donor.message}
                                            onOpen={() => setModal({ name: donor.name, message: donor.message! })}
                                        />
                                        <span className="text-xs text-muted-foreground mt-1">
                                            {donor.currency === 'ETH'
                                                ? `${(donor.amount / 1e18).toFixed(4)} ETH`
                                                : `R$ ${(donor.amount / 100).toFixed(2)}`
                                            } · {t('sidebar.coffees', { count: donor.coffees })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!hasAnyDonor && (
                    <div className="rounded-xl border border-border bg-card p-10 text-center">
                        <p className="text-4xl mb-3">☕</p>
                        <p className="text-muted-foreground text-sm">{t('sidebar.beFirst')}</p>
                    </div>
                )}
            </div>

            <MessageModal
                open={modal !== null}
                onOpenChange={(open) => { if (!open) setModal(null) }}
                name={modal?.name ?? null}
                message={modal?.message ?? ''}
            />
        </>
    )
}