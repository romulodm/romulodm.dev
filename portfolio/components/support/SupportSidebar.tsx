// src/components/support/SupportSidebar.tsx
'use client'

import { useState } from 'react'
import { formatDistanceToNow } from '@/lib/utils'
import { Trophy, Clock } from 'lucide-react'
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
}

interface Props {
    topDonors: Donor[]
    recentDonors: Donor[]
}

function coffeeEmoji(n: number) {
    return '☕'.repeat(Math.min(n, 5))
}

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
    if (isPrivate) {
        return (
            <p className="text-xs text-muted-foreground/60 mt-0.5 italic">
                Mensagem privada.
            </p>
        )
    }
    if (!message) {
        return (
            <p className="text-xs text-muted-foreground/60 mt-0.5 italic">
                Sem mensagem.
            </p>
        )
    }
    return (
        <button
            onClick={onOpen}
            className="text-xs text-primary/70 hover:text-primary mt-0.5 underline underline-offset-2 transition-colors text-left"
        >
            Ver mensagem
        </button>
    )
}

export function SupportersSidebar({ topDonors, recentDonors }: Props) {
    const [modal, setModal] = useState<ModalState>(null)

    function openModal(name: string | null, message: string) {
        setModal({ name, message })
    }

    console.log(recentDonors)

    return (
        <>
            <div className="space-y-8">
                {/* Ranking */}
                {topDonors.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h2 className="font-bold text-foreground flex items-center gap-2 mb-4">
                            <Trophy className="w-4 h-4 text-primary" />
                            Top apoiadores
                        </h2>
                        <ol className="space-y-3">
                            {topDonors.map((d, i) => (
                                <li key={d.id} className="flex items-start gap-1">
                                    <span className={`text-sm font-bold min-w-[24px] ${i === 0 ? 'text-amber-500'
                                        : i === 1 ? 'text-slate-600 dark:text-slate-200'
                                            : i === 2 ? 'text-orange-600'
                                                : 'text-muted-foreground'
                                        }`}>
                                        #{i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-medium text-sm text-foreground truncate">
                                                {d.name || 'Anônimo'}
                                                <span className="text-muted-foreground font-normal ml-1">
                                                    · {d.coffees} café{d.coffees > 1 ? 's' : ''}
                                                </span>
                                            </span>
                                            <span className="text-sm font-semibold text-foreground shrink-0">
                                                R$ {(d.amount / 100).toFixed(2)}
                                            </span>
                                        </div>
                                        <MessageLine
                                            isPrivate={d.isPrivate}
                                            message={d.message}
                                            onOpen={() => openModal(d.name, d.message!)}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {/* Recentes */}
                {recentDonors.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h2 className="font-bold text-foreground flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-primary" />
                            Apoios recentes
                        </h2>
                        <div className="space-y-4">
                            {recentDonors.map((d) => (
                                <div key={d.id} className="flex items-start gap-3 pb-1">
                                    <div className="w-8 h-8 rounded-full bg-primary/30 dark:bg-primary/10 flex items-center justify-center text-sm shrink-0">
                                        ☕
                                    </div>
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-medium text-sm text-foreground truncate">
                                                {d.name || 'Alguém'}
                                            </span>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {formatDistanceToNow(d.createdAt)}
                                            </span>
                                        </div>
                                        <MessageLine
                                            isPrivate={d.isPrivate}
                                            message={d.message}
                                            onOpen={() => openModal(d.name, d.message!)}
                                        />
                                        <span className="text-xs text-muted-foreground mt-1">
                                            {d.currency === 'ETH'
                                                ? `${(d.amount / 1e18).toFixed(4)} ETH`
                                                : `R$ ${(d.amount / 100).toFixed(2)}`
                                            } · {d.coffees} café{d.coffees > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {topDonors.length === 0 && recentDonors.length === 0 && (
                    <div className="rounded-xl border border-border bg-card p-10 text-center">
                        <p className="text-4xl mb-3">☕</p>
                        <p className="text-muted-foreground text-sm">Seja o primeiro a apoiar!</p>
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