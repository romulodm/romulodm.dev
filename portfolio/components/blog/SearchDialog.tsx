'use client'

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Eraser, Clock, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { IconTooltip } from "@/components/navigation/IconTooltip";

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
    const t = useTranslations('navigation')
    const ts = useTranslations('blogSearch')

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
            <IconTooltip label={t('tooltip.search')}>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(true)}
                    aria-label={t('tooltip.search')}
                    className="hidden p-2.5 md:flex text-foreground hover:bg-gray-400/60 dark:hover:bg-neutral-800/50 hover:text-black dark:hover:text-foreground"
                >
                    <Search className="h-4 w-4" />
                </Button>
            </IconTooltip>

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
                        <DialogTitle>{ts('title')}</DialogTitle>
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
                            placeholder={ts('placeholder')}
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                        <div className="flex items-center gap-2 mr-7 shrink-0">
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    aria-label={ts('clear')}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Eraser size={16} />
                                </button>
                            )}
                            <kbd className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                                {ts('escKey')}
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
                                        {ts('results', { count: hits.length })}
                                    </span>
                                    {timeMs !== null && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock size={11} /> {ts('timeMs', { ms: timeMs })}
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
                                                                    className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full"
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
                                {ts.rich('noResults', { query, strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}
                            </div>
                        ) : query.length > 0 ? (
                            <div className="py-8 text-center text-muted-foreground text-xs">
                                {ts('keepTyping')}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground text-xs">
                                {ts('prompt')}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}