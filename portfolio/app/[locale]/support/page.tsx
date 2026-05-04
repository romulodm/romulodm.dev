import { prisma } from '@romulo/database'
import { Metadata } from 'next'
import { DonationWidget } from '@/components/support/DonationWidget'
import { SupportersSidebar } from '@/components/support/SupportSidebar'
import Navbar from '@/components/navigation/Navbar'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
    title: 'Apoie o blog',
    description: 'Me pague um café e ajude a manter o blog no ar!',
}

async function getStats() {
    const [topDonors, recentDonors, stats] = await Promise.all([
        prisma.donation.findMany({
            where: { status: 'COMPLETED', currency: 'BRL' },
            orderBy: { amount: 'desc' },
            take: 10,
            select: {
                id: true, name: true, message: true, isPrivate: true,
                amount: true, coffees: true, createdAt: true,
                userId: true,
                user: { select: { username: true } },
            },
        }),
        prisma.donation.findMany({
            where: { status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
            take: 8,
            select: {
                id: true, name: true, message: true, isPrivate: true,
                amount: true, coffees: true, createdAt: true, currency: true,
                userId: true,
                user: { select: { username: true } },
            },
        }),
        prisma.donation.aggregate({
            where: { status: 'COMPLETED', currency: 'BRL' },
            _count: { id: true },
        }),
    ])

    return {
        topDonors: topDonors.map((d) => ({
            ...d,
            message: d.isPrivate ? null : d.message,
            username: (d as any).user?.username as string | null ?? null,
        })),
        recentDonors: recentDonors.map((d) => ({
            ...d,
            message: d.isPrivate ? null : d.message,
            username: (d as any).user?.username as string | null ?? null,
        })),
        stats,
    }
}

export default async function SupportPage() {
    const { topDonors, recentDonors, stats } = await getStats()
    const totalSupporters = stats._count.id

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 py-24">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Compre um café</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Cada café me ajuda a continuar escrevendo e mantendo o blog.
                        Obrigado pelo apoio! ☕
                    </p>
                    {totalSupporters > 0 && (
                        <div className="flex gap-6 justify-center mt-4 text-sm text-muted-foreground">
                            <span><strong className="text-foreground">{totalSupporters}</strong> apoiadores</span>
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