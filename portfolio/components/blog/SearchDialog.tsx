'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock, Loader2 } from 'lucide-react'
import { useLocale } from 'next-intl'
import Image from 'next/image'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface SearchHit {
    slug: string
    title: string
    summary: string
    coverImageUrl: string | null
    tags: string[]
    score?: number
}

export function SearchDialog() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [hits, setHits] = useState<SearchHit[]>([])
    const [isPending, startTransition] = useTransition()
    const [timeMs, setTimeMs] = useState<number | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const router = useRouter()
    const locale = useLocale()

    // Atalho Cmd/Ctrl + K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setOpen(v => !v)
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [])

    // Limpa estado ao fechar
    useEffect(() => {
        if (!open) {
            setQuery('')
            setHits([])
            setTimeMs(null)
        } else {
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [open])

    // Debounce da busca — aponta para o motor Go via /api/search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (query.length < 2) { setHits([]); return }

        debounceRef.current = setTimeout(() => {
            startTransition(async () => {
                const res = await fetch(
                    `/api/search?q=${encodeURIComponent(query)}&locale=${locale}`
                )
                const data = await res.json()
                setHits(data.hits ?? [])
                setTimeMs(data.processingTimeMs ?? null)
            })
        }, 180)
    }, [query, locale])

    function navigate(slug: string) {
        router.push(`/${locale}/blog/${slug}`)
        setOpen(false)
    }

    return (
        <>
            {/* Trigger */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground
                    border border-border rounded-lg hover:border-foreground/30 transition-colors"
            >
                <Search size={14} />
                <span className="hidden sm:inline">Buscar</span>
                <kbd className="hidden sm:inline text-xs bg-muted px-1.5 py-0.5 rounded">
                    ⌘+K
                </kbd>
            </button>

            {/* Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className="
                        p-0 gap-0 overflow-hidden
                        bg-background border-border
                        sm:max-w-xl w-full
                        fixed left-[50%] top-[12%]
                        -translate-x-[50%] translate-y-0
                        data-[state=open]:slide-in-from-top-4
                        data-[state=closed]:slide-out-to-top-4
                    "
                >
                    {/* Título acessível — visualmente oculto */}
                    <DialogHeader className="sr-only">
                        <DialogTitle>Buscar posts</DialogTitle>
                    </DialogHeader>

                    {/* Input */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                        {isPending
                            ? <Loader2 size={18} className="shrink-0 text-muted-foreground animate-spin" />
                            : <Search size={18} className="shrink-0 text-muted-foreground" />
                        }
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar posts..."
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                        <div className="flex items-center gap-2 mr-7 shrink-0">
                            {query && (
                                <button
                                    onClick={() => setQuery('')}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                            <kbd className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                                Esc
                            </kbd>
                        </div>
                    </div>

                    {/* Resultados */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {hits.length > 0 ? (
                            <>
                                {/* Meta — contagem + tempo */}
                                <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        {hits.length} resultado{hits.length !== 1 ? 's' : ''}
                                    </span>
                                    {timeMs !== null && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock size={11} /> {timeMs}ms
                                        </span>
                                    )}
                                </div>

                                {/* Lista */}
                                <ul className="p-2">
                                    {hits.map(hit => (
                                        <li key={hit.slug}>
                                            <button
                                                onClick={() => navigate(hit.slug)}
                                                className="w-full flex items-start gap-3 p-2.5 rounded-xl
                                                    hover:bg-muted text-left transition-colors"
                                            >
                                                {hit.coverImageUrl && (
                                                    <Image
                                                        src={hit.coverImageUrl}
                                                        alt=""
                                                        width={48}
                                                        height={48}
                                                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className="text-sm font-medium text-foreground line-clamp-1
                                                            [&_mark]:bg-primary/20 [&_mark]:text-primary [&_mark]:rounded-sm"
                                                        dangerouslySetInnerHTML={{ __html: hit.title }}
                                                    />
                                                    {hit.summary && (
                                                        <p
                                                            className="text-xs text-muted-foreground mt-0.5 line-clamp-2
                                                                [&_mark]:bg-primary/20 [&_mark]:text-primary [&_mark]:rounded-sm"
                                                            dangerouslySetInnerHTML={{ __html: hit.summary }}
                                                        />
                                                    )}
                                                    {hit.tags.length > 0 && (
                                                        <div className="flex gap-1 mt-1.5 flex-wrap">
                                                            {hit.tags.slice(0, 3).map(tag => (
                                                                <span
                                                                    key={tag}
                                                                    className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full"
                                                                >
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : query.length >= 2 && !isPending ? (
                            <div className="py-12 text-center text-muted-foreground text-sm">
                                Nenhum resultado para{' '}
                                <strong className="text-foreground">"{query}"</strong>
                            </div>
                        ) : query.length > 0 ? (
                            <div className="py-8 text-center text-muted-foreground text-xs">
                                Continue digitando...
                            </div>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground text-xs">
                                Digite para buscar nos posts
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}