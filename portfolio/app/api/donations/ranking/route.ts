import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { prisma } from '@romulo/database'

export const dynamic = 'force-dynamic'

const DONATION_RANKING_REVALIDATE_SECONDS = 300

const getCachedDonationRanking = unstable_cache(
    async () => {
        const [top, recent] = await Promise.all([
            prisma.donation.findMany({
                where: { status: 'COMPLETED', isPrivate: false, currency: 'BRL' },
                orderBy: [{ amount: 'desc' }, { createdAt: 'desc' }],
                take: 10,
                select: { id: true, name: true, message: true, amount: true, coffees: true, createdAt: true, provider: true },
            }),
            prisma.donation.findMany({
                where: { status: 'COMPLETED', isPrivate: false },
                orderBy: { createdAt: 'desc' },
                take: 6,
                select: { id: true, name: true, message: true, amount: true, coffees: true, createdAt: true, currency: true },
            }),
        ])

        return { top, recent }
    },
    ['donation-ranking'],
    { revalidate: DONATION_RANKING_REVALIDATE_SECONDS },
)

export async function GET() {
    const payload = await getCachedDonationRanking()

    return NextResponse.json(payload)
}
