// src/components/admin/donations/DonationsTable.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { formatDistanceToNow } from '@/lib/utils'
import { Pencil, Check, X, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { editDonationMessage, deleteDonation } from '@/app/[locale]/admin/donations/actions'
import { MessageModal } from '@/components/support/MessageModal'

type Donation = {
    id: string
    name: string | null
    message: string | null
    amount: number
    coffees: number
    currency: string
    status: string
    isPrivate: boolean
    provider: string
    createdAt: Date
}

type Filter = 'ALL' | 'COMPLETED' | 'PENDING'

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
    COMPLETED: { label: 'Concluído', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    PENDING: { label: 'Pendente', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    FAILED: { label: 'Falhou', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    EXPIRED: { label: 'Expirado', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'COMPLETED', label: 'Concluídos' },
    { value: 'PENDING', label: 'Pendentes' },
]

interface Props {
    donations: Donation[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    filter: Filter
}

type ModalState = { name: string | null; message: string } | null

export function DonationsTable({ donations, total, page, totalPages, filter }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [modal, setModal] = useState<ModalState>(null)

    function navigate(newPage: number, newFilter: Filter) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', String(newPage))
        if (newFilter === 'ALL') params.delete('filter')
        else params.set('filter', newFilter)
        router.push(`${pathname}?${params.toString()}`)
    }

    function startEdit(d: Donation) {
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
            if (res?.error) {
                setError(res.error)
            } else {
                setEditingId(null)
                setError(null)
            }
        })
    }

    function handleDelete(id: string) {
        if (!confirm('Excluir esta doação? Esta ação não pode ser desfeita.')) return
        startTransition(async () => { await deleteDonation(id) })
    }

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {/* Header com filtros */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">
                    Todas as doações
                    <span className="ml-2 text-sm font-normal text-muted-foreground">({total})</span>
                </h2>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    {FILTER_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => navigate(1, opt.value)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === opt.value
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {donations.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <p className="text-4xl mb-3">☕</p>
                    <p className="text-sm">Nenhuma doação encontrada.</p>
                </div>
            ) : (
                <>
                    <div className="divide-y divide-border">
                        {donations.map((d) => {
                            const badge = STATUS_LABELS[d.status] ?? STATUS_LABELS.PENDING
                            const isEditing = editingId === d.id
                            const amountFmt = d.currency === 'ETH'
                                ? `${(d.amount / 1e18).toFixed(4)} ETH`
                                : (d.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                            return (
                                <div key={d.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-sm font-bold text-amber-700 dark:text-amber-400 shrink-0">
                                            {d.name ? d.name.charAt(0).toUpperCase() : '?'}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-sm text-foreground">
                                                    {d.name || 'Anônimo'}
                                                </span>
                                                {d.isPrivate && (
                                                    <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
                                                        privado
                                                    </span>
                                                )}
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                                                    {badge.label}
                                                </span>
                                                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                                                    {formatDistanceToNow(d.createdAt)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                                <span className="font-semibold text-foreground">{amountFmt}</span>
                                                <span>·</span>
                                                <span>{d.coffees} café{d.coffees > 1 ? 's' : ''}</span>
                                                <span>·</span>
                                                <span>{d.provider}</span>
                                            </div>

                                            <div className="mt-2">
                                                {isEditing ? (
                                                    <div className="space-y-2">
                                                        <textarea
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value.slice(0, 500))}
                                                            maxLength={500}
                                                            rows={3}
                                                            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                                            placeholder="Mensagem (deixe vazio para remover)"
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
                                                        <span className="block truncate max-w-sm">"{d.message}"</span>
                                                    </button>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground/50 italic">sem mensagem</p>
                                                )}
                                            </div>
                                        </div>

                                        {!isEditing && (
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => startEdit(d)}
                                                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                    title="Editar mensagem"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(d.id)}
                                                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-500"
                                                    title="Excluir doação"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                                Página {page} de {totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate(page - 1, filter)}
                                    disabled={page <= 1}
                                    className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => navigate(page + 1, filter)}
                                    disabled={page >= totalPages}
                                    className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <MessageModal
                open={modal !== null}
                onOpenChange={(open) => { if (!open) setModal(null) }}
                name={modal?.name ?? null}
                message={modal?.message ?? ''}
            />
        </div>
    )
}