// src/components/admin/donations/PreviewTable.tsx
'use client'

import { useState, useTransition } from 'react'
import { formatDistanceToNow } from '@/lib/utils'
import { Trophy, Clock, Pencil, Check, X, AlertTriangle } from 'lucide-react'
import { editDonationMessage } from '@/app/[locale]/admin/donations/actions'
import { MessageModal } from '@/components/support/MessageModal'

type PreviewDonation = {
    id: string
    name: string | null
    message: string | null
    amount: number
    coffees: number
    createdAt: Date
    currency: string
}

interface Props {
    title: string
    subtitle: string
    icon: 'trophy' | 'clock'
    donations: PreviewDonation[]
}

type ModalState = { name: string | null; message: string } | null

export function PreviewTable({ title, subtitle, icon, donations }: Props) {
    const Icon = icon === 'trophy' ? Trophy : Clock

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [modal, setModal] = useState<ModalState>(null)

    function startEdit(d: PreviewDonation) {
        setEditingId(d.id)
        setEditValue(d.message ?? '')
        setError(null)
    }

    function cancelEdit() {
        setEditingId(null)
        setEditValue('')
        setError(null)
    }

    function saveEdit(id: string) {
        startTransition(async () => {
            const res = await editDonationMessage(id, editValue)
            if ('error' in res && res.error) {
                setError(res.error)
            } else {
                setEditingId(null)
                setError(null)
            }
        })
    }

    return (
        <>
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        {title}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                </div>

                {donations.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-10">Nenhuma doação.</p>
                ) : (
                    <ol className="divide-y divide-border">
                        {donations.map((d, i) => {
                            const isEditing = editingId === d.id
                            const amountFmt = d.currency === 'ETH'
                                ? `${(d.amount / 1e18).toFixed(4)} ETH`
                                : (d.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                            return (
                                <li key={d.id} className="px-6 py-3">
                                    {/* Linha principal */}
                                    <div className="flex items-center gap-3">
                                        {icon === 'trophy' ? (
                                            <span className={`text-xs font-bold w-6 shrink-0 ${i === 0 ? 'text-amber-500'
                                                    : i === 1 ? 'text-gray-400'
                                                        : i === 2 ? 'text-orange-600'
                                                            : 'text-muted-foreground'
                                                }`}>
                                                #{i + 1}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground w-6 shrink-0 text-center">
                                                {i + 1}
                                            </span>
                                        )}

                                        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-400 shrink-0">
                                            {d.name ? d.name.charAt(0).toUpperCase() : '?'}
                                        </div>

                                        <span className="flex-1 text-sm text-foreground truncate">
                                            {d.name || 'Anônimo'}
                                        </span>

                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {formatDistanceToNow(d.createdAt)}
                                        </span>

                                        <span className="text-sm font-semibold text-foreground shrink-0">
                                            {amountFmt}
                                        </span>

                                        {!isEditing && (
                                            <button
                                                onClick={() => startEdit(d)}
                                                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
                                                title="Editar mensagem"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Mensagem / edição */}
                                    <div className="ml-[60px] mt-1.5">
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value.slice(0, 500))}
                                                    maxLength={500}
                                                    rows={2}
                                                    className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                                    placeholder="Mensagem (deixe vazio para remover)"
                                                    autoFocus
                                                />
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {editValue.length}/500
                                                    </span>
                                                    {error && (
                                                        <span className="text-xs text-red-500 flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            {error}
                                                        </span>
                                                    )}
                                                    <div className="flex gap-2 ml-auto">
                                                        <button
                                                            onClick={cancelEdit}
                                                            disabled={isPending}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors"
                                                        >
                                                            <X className="w-3 h-3" /> Cancelar
                                                        </button>
                                                        <button
                                                            onClick={() => saveEdit(d.id)}
                                                            disabled={isPending}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                            {isPending ? 'Salvando…' : 'Salvar'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : d.message ? (
                                            <button
                                                onClick={() => setModal({ name: d.name, message: d.message! })}
                                                className="text-xs text-muted-foreground italic hover:text-foreground transition-colors text-left max-w-full"
                                                title="Ver mensagem completa"
                                            >
                                                <span className="block truncate max-w-xs">"{d.message}"</span>
                                            </button>
                                        ) : (
                                            <p className="text-xs text-muted-foreground/40 italic">sem mensagem</p>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                    </ol>
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