// src/app/[locale]/admin/crypto-donations/page.tsx
import { prisma } from '@romulo/database'
import { redirect } from 'next/navigation'
import { Coins, Users, Coffee, TrendingUp, ArrowUpRight } from 'lucide-react'
import { isAdminAuthenticated } from '@/lib/auth-helpers'
import { getPrices, NETWORKS, type NetworkKey, type TokenKey } from '@romulo/web3'
import { CryptoTable } from '@/components/admin/crypto/CryptoTable'

// ── Data ──────────────────────────────────────────────────────────────────────

async function getStats() {
    const [donations, byNetwork, byToken, totals] = await Promise.all([
        prisma.onChainDonation.findMany({
            orderBy: { donatedAt: 'desc' },
        }),
        prisma.onChainDonation.groupBy({
            by: ['network'],
            _sum: { amountBrl: true, amountUsd: true },
            _count: { id: true },
        }),
        prisma.onChainDonation.groupBy({
            by: ['token'],
            _sum: { amountBrl: true },
            _count: { id: true },
        }),
        prisma.onChainDonation.aggregate({
            _sum: { amountBrl: true, amountUsd: true, coffees: true },
            _count: { id: true },
        }),
    ])

    return { donations, byNetwork, byToken, totals }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CryptoDonationsPage() {
    if (!(await isAdminAuthenticated())) redirect('/')

    const [{ donations, byNetwork, byToken, totals }, prices] = await Promise.all([
        getStats(),
        getPrices(),
    ])

    const totalBrl = totals._sum.amountBrl ?? 0
    const totalUsd = totals._sum.amountUsd ?? 0
    const totalCoffee = totals._sum.coffees ?? 0
    const totalCount = totals._count.id
    const avgBrl = totalCount > 0 ? totalBrl / totalCount : 0

    const statCards = [
        {
            label: 'Total arrecadado',
            value: totalBrl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            sub: `≈ $${totalUsd.toFixed(2)} USD`,
            icon: Coins,
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-50 dark:bg-green-900/20',
        },
        {
            label: 'Apoiadores',
            value: String(totalCount),
            sub: 'doações únicas',
            icon: Users,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
        },
        {
            label: 'Cafés',
            value: String(totalCoffee),
            sub: `≈ $${(totalCoffee * 2).toFixed(0)} USD`,
            icon: Coffee,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
        },
        {
            label: 'Ticket médio',
            value: avgBrl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            sub: 'por doação',
            icon: TrendingUp,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
        },
    ]

    const walletAddress = process.env.NEXT_PUBLIC_WALLET_ADDRESS ?? ''

    return (
        <main className="space-y-8 p-8">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Doações On-chain</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Pagamentos diretos em ETH, USDC e USDT — Arbitrum, Polygon e Base.
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => (
                    <div key={card.label} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}>
                                <card.icon className={`h-5 w-5 ${card.color}`} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{card.value}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Por rede + por token */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Por rede */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="border-b border-border px-6 py-4">
                        <h2 className="text-base font-semibold text-foreground">Por rede</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">Volume arrecadado por blockchain</p>
                    </div>
                    <div className="divide-y divide-border">
                        {byNetwork.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">Sem dados ainda.</p>
                        ) : (
                            byNetwork.map((row) => {
                                const net = NETWORKS[row.network as NetworkKey]
                                const brl = row._sum.amountBrl ?? 0
                                const pct = totalBrl > 0 ? (brl / totalBrl) * 100 : 0

                                return (
                                    <div key={row.network} className="px-6 py-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: net?.color ?? '#888' }}
                                                />
                                                <span className="text-sm font-medium text-foreground">
                                                    {net?.name ?? row.network}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({row._count.id} doações)
                                                </span>
                                            </div>
                                            <span className="text-sm font-semibold text-foreground">
                                                {brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${pct}%`, backgroundColor: net?.color ?? '#888' }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-xs text-muted-foreground">
                                                {pct.toFixed(1)}% do total
                                            </span>
                                            <a
                                                href={`${net?.explorer}/address/${walletAddress}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                Ver carteira
                                                <ArrowUpRight className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Por token */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="border-b border-border px-6 py-4">
                        <h2 className="text-base font-semibold text-foreground">Por token</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">Distribuição por moeda</p>
                    </div>

                    {byToken.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">Sem dados ainda.</p>
                    ) : (
                        <div className="p-6 space-y-5">
                            {byToken.map((row) => {
                                const token = row.token as TokenKey
                                const brl = row._sum.amountBrl ?? 0
                                const pct = totalBrl > 0 ? (brl / totalBrl) * 100 : 0

                                const tokenStyles: Record<TokenKey, { bar: string; badge: string }> = {
                                    ETH: { bar: 'bg-blue-500', badge: 'bg-blue-100  text-blue-700  dark:bg-blue-900/30  dark:text-blue-400' },
                                    USDC: { bar: 'bg-green-500', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
                                    USDT: { bar: 'bg-teal-500', badge: 'bg-teal-100  text-teal-700  dark:bg-teal-900/30  dark:text-teal-400' },
                                }

                                const style = tokenStyles[token] ?? { bar: 'bg-primary', badge: '' }

                                return (
                                    <div key={token}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style.badge}`}>
                                                    {token}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {row._count.id} doação{row._count.id > 1 ? 'ões' : ''}
                                                </span>
                                            </div>
                                            <span className="text-sm font-semibold text-foreground">
                                                {brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${style.bar}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground text-right">
                                            {pct.toFixed(1)}%
                                        </p>
                                    </div>
                                )
                            })}

                            {/* Cotações */}
                            <div className="mt-2 pt-4 border-t border-border grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
                                    <p className="text-xs text-muted-foreground mb-0.5">ETH/BRL</p>
                                    <p className="text-sm font-bold text-foreground">
                                        {prices.ethBrl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
                                    <p className="text-xs text-muted-foreground mb-0.5">USD/BRL</p>
                                    <p className="text-sm font-bold text-foreground">
                                        {prices.usdBrl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabela */}
            <CryptoTable donations={donations} />
        </main >
    )
}