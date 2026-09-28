// src/components/admin/crypto/CryptoTable.tsx
'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { getIntlLocaleCode } from '@/lib/locales'
import { ExternalLink, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { NETWORKS, type NetworkKey, type TokenKey } from '@romulo/web3'
import { formatDistanceToNow } from '@/lib/utils'

interface OnChainDonation {
    id: string
    txHash: string
    network: string
    token: string
    rawAmount: string
    amountUsd: number
    amountBrl: number
    coffees: number
    donor: string
    name: string | null
    message: string | null
    isPrivate: boolean
    donatedAt: Date
    createdAt: Date
}

const TOKEN_COLORS: Record<TokenKey, string> = {
    ETH: 'bg-blue-100  text-blue-700  dark:bg-blue-900/30  dark:text-blue-400',
    USDC: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    USDT: 'bg-teal-100  text-teal-700  dark:bg-teal-900/30  dark:text-teal-400',
}

function formatRaw(rawAmount: string, token: TokenKey): string {
    const raw = BigInt(rawAmount)
    if (token === 'ETH') return `${(Number(raw) / 1e18).toFixed(5)} ETH`
    return `${(Number(raw) / 1e6).toFixed(2)} ${token}`
}

function CopyButton({ text }: { text: string }) {
    const t = useTranslations('admin.cryptoDonations')
    const [copied, setCopied] = useState(false)

    async function copy() {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <button
            onClick={copy}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={t('table.copy')}
        >
            {copied
                ? <Check className="h-3 w-3 text-green-500" />
                : <Copy className="h-3 w-3" />
            }
        </button>
    )
}

export function CryptoTable({ donations }: { donations: OnChainDonation[] }) {
    const locale = useLocale()
    const t = useTranslations('admin.cryptoDonations')
    const [expanded, setExpanded] = useState<string | null>(null)

    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        {t('table.title')}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            ({donations.length})
                        </span>
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {t('table.subtitle')}
                    </p>
                </div>
            </div>

            {donations.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                    <p className="mb-3 text-4xl">⛓️</p>
                    <p className="text-sm">{t('table.empty')}</p>
                </div>
            ) : (
                <div className="divide-y divide-border">
                    {donations.map((d) => {
                        const net = NETWORKS[d.network as NetworkKey]
                        const tokenKey = d.token as TokenKey
                        const isOpen = expanded === d.id
                        const explorerTx = `${net?.explorer}/tx/${d.txHash}`

                        return (
                            <div key={d.id} className="px-6 py-4 hover:bg-muted/20 transition-colors">
                                <div className="flex items-start gap-4">

                                    {/* Network color bar */}
                                    <div
                                        className="w-1 self-stretch rounded-full shrink-0"
                                        style={{ backgroundColor: net?.color ?? '#888' }}
                                    />

                                    <div className="flex-1 min-w-0 space-y-2">

                                        {/* Row 1: nome + badges + data */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold text-sm text-foreground">
                                                {d.name || t('table.anonymous')}
                                            </span>

                                            {/* Network */}
                                            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                                                {net?.shortName ?? d.network}
                                            </span>

                                            {/* Token */}
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TOKEN_COLORS[tokenKey]}`}>
                                                {d.token}
                                            </span>

                                            {/* Privada */}
                                            {d.isPrivate && (
                                                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                                                    {t('table.private')}
                                                </span>
                                            )}

                                            <span className="ml-auto text-xs text-muted-foreground shrink-0">
                                                {formatDistanceToNow(d.donatedAt, locale)}
                                            </span>
                                        </div>

                                        {/* Row 2: valores + cafés */}
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                            <span className="font-semibold text-foreground text-sm">
                                                {formatRaw(d.rawAmount, tokenKey)}
                                            </span>
                                            <span>·</span>
                                            <span>
                                                {d.amountBrl.toLocaleString(getIntlLocaleCode(locale), { style: 'currency', currency: 'BRL' })}
                                            </span>
                                            <span>·</span>
                                            <span>
                                                ${d.amountUsd.toFixed(2)} USD
                                            </span>
                                            <span>·</span>
                                            <span>
                                                {t('table.coffees', { count: d.coffees })}
                                            </span>
                                        </div>

                                        {/* Row 3: mensagem */}
                                        {d.message && (
                                            <div>
                                                <button
                                                    onClick={() => setExpanded(isOpen ? null : d.id)}
                                                    className="flex items-center gap-1 text-xs italic text-muted-foreground hover:text-foreground transition-colors text-left"
                                                >
                                                    {isOpen
                                                        ? <ChevronUp className="h-3 w-3 shrink-0" />
                                                        : <ChevronDown className="h-3 w-3 shrink-0" />
                                                    }
                                                    {isOpen
                                                        ? <span className="whitespace-pre-wrap break-words">"{d.message}"</span>
                                                        : <span className="block max-w-sm truncate">"{d.message}"</span>
                                                    }
                                                </button>
                                            </div>
                                        )}

                                        {/* Row 4: endereços + tx */}
                                        <div className="flex flex-wrap items-center gap-3 pt-0.5">
                                            {/* Donor */}
                                            <div className="flex items-center gap-1">
                                                <span className="font-mono text-[10px] text-muted-foreground/60">
                                                    {d.donor.slice(0, 6)}…{d.donor.slice(-4)}
                                                </span>
                                                <CopyButton text={d.donor} />
                                            </div>

                                            <span className="text-muted-foreground/40 text-xs">·</span>

                                            {/* TX */}
                                            <div className="flex items-center gap-1">
                                                <span className="font-mono text-[10px] text-muted-foreground/60">
                                                    {d.txHash.slice(0, 10)}…
                                                </span>
                                                <CopyButton text={d.txHash} />
                                                <a
                                                    href={explorerTx}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-muted-foreground hover:text-primary transition-colors"
                                                    title={t('table.viewExplorer')}
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )
            }
        </div >
    )
}