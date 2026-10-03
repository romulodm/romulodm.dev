import { prisma } from '@romulo/database'
import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { DonationWidget } from '@/components/support/DonationWidget'
import { SupportersSidebar } from '@/components/support/SupportSidebar'
import Navbar from '@/components/navigation/Navbar'
import { Footer } from '@/components/Footer'
import { buildPageMetadata } from '@/lib/seo'
import { AnimatedEmoji } from '@/components/ui/AnimatedEmoji'

// Ranking de apoiadores muda com pouca frequencia; 5 min de cache e suficiente
// e evita uma query por visita.
export const revalidate = 300

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'seo.support' })

    return buildPageMetadata({
        locale,
        path: 'support',
        title: t('title'),
        description: t('description'),
    })
}

const DONOR_SELECT = {
    id: true, name: true, message: true, isPrivate: true,
    amount: true, coffees: true, createdAt: true, currency: true,
    userId: true,
    user: { select: { username: true } },
} as const

const DAY_MS = 24 * 60 * 60 * 1000

/** All-time ranking is capped at 3 pages of 10 (see SupportersSidebar). */
const TOP_ALL_LIMIT = 30
const TOP_PERIOD_LIMIT = 10

function topDonorsQuery(take: number, since?: Date) {
    return prisma.donation.findMany({
        where: {
            status: 'COMPLETED',
            currency: 'BRL',
            ...(since && { createdAt: { gte: since } }),
        },
        orderBy: [{ amount: 'desc' }, { createdAt: 'asc' }],
        take,
        select: DONOR_SELECT,
    })
}

type RawDonor = Awaited<ReturnType<typeof topDonorsQuery>>[number]

function toPublicDonor(d: RawDonor) {
    return {
        ...d,
        message: d.isPrivate ? null : d.message,
        username: d.user?.username ?? null,
    }
}

async function getStats() {
    // Week and month are rolling windows (last 7 / 30 days) rather than calendar
    // periods, so the ranking never resets to empty on the 1st or on Monday.
    // Computed per render; with revalidate=300 the window drifts by at most 5 min.
    const now = Date.now()
    const weekStart = new Date(now - 7 * DAY_MS)
    const monthStart = new Date(now - 30 * DAY_MS)

    const [topAll, topWeek, topMonth, recentDonors, stats] = await Promise.all([
        topDonorsQuery(TOP_ALL_LIMIT),
        topDonorsQuery(TOP_PERIOD_LIMIT, weekStart),
        topDonorsQuery(TOP_PERIOD_LIMIT, monthStart),
        prisma.donation.findMany({
            where: { status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
            take: 8,
            select: DONOR_SELECT,
        }),
        prisma.donation.aggregate({
            where: { status: 'COMPLETED', currency: 'BRL' },
            _count: { id: true },
        }),
    ])

    return {
        topDonors: {
            all: topAll.map(toPublicDonor),
            week: topWeek.map(toPublicDonor),
            month: topMonth.map(toPublicDonor),
        },
        recentDonors: recentDonors.map(toPublicDonor),
        stats,
    }
}

export default async function SupportPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    // Requisito do next-intl para render estatico — ver app/[locale]/layout.tsx.
    const { locale } = await params
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'support.page' })

    const { topDonors, recentDonors, stats } = await getStats()
    const totalSupporters = stats._count.id

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 py-24">
                <div className="text-center mb-8">
                    <h1 className="type-h1 text-foreground mb-2 flex items-center justify-center gap-3">
                        {t('title')}
                        <AnimatedEmoji code="2615" />
                    </h1>
                    <p className="type-body text-muted-foreground max-w-md mx-auto">
                        {t.rich('description', {
                            repo: (chunks) => (
                                <a
                                    href="https://github.com/romulodm/romulodm.dev"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
                                >
                                    {chunks}
                                </a>
                            ),
                        })}
                    </p>
                    {totalSupporters > 0 && (
                        <div className="flex gap-6 justify-center mt-4 text-sm text-muted-foreground">
                            <span>{t.rich('supporters', { count: totalSupporters, strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3">
                        <SupportersSidebar topDonors={topDonors} recentDonors={recentDonors} />
                    </div>
                    <div className="lg:col-span-2">
                        <div className="sticky top-20">
                            <DonationWidget />
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}