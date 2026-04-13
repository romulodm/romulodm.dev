'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronUp } from 'lucide-react'

interface Heading {
    id: string
    text: string
    level: number
}

const EXCLUDED_TEXTS = /comentário|comment/i

function collectHeadings(): Heading[] {
    const elements = Array.from(
        document.querySelectorAll('article h1, article h2, article h3')
    ).filter((el) => !EXCLUDED_TEXTS.test(el.textContent ?? ''))

    elements.forEach((el) => {
        if (!el.id) {
            el.id =
                el.textContent
                    ?.toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .replace(/\s+/g, '-')
                    .trim() ?? Math.random().toString(36).slice(2)
        }
    })

    return elements.map((el) => ({
        id: el.id,
        text: el.textContent ?? '',
        level: Number(el.tagName[1]),
    }))
}

const NAVBAR_HEIGHT = 90

function getActiveId(headings: Heading[]): string {
    //if (window.scrollY < 5 * NAVBAR_HEIGHT) return ''

    // Percorre de trás pra frente, retorna o primeiro que já passou a navbar
    for (let i = headings.length - 1; i >= 0; i--) {
        const el = document.getElementById(headings[i].id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= NAVBAR_HEIGHT + 320) {
            return headings[i].id
        }
    }

    return headings[0]?.id ?? ''
}

export function TableOfContents() {
    const pathname = usePathname()
    const [headings, setHeadings] = useState<Heading[]>([])
    const [activeId, setActiveId] = useState<string>('')
    const [showScrollTop, setShowScrollTop] = useState(false)
    const isScrollingRef = useRef(false)
    const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const headingsRef = useRef<Heading[]>([])

    useEffect(() => {
        setHeadings([])
        setActiveId('')
        headingsRef.current = []

        let mutationObserver: MutationObserver | null = null

        const onScroll = () => {
            setShowScrollTop(window.scrollY > 400)

            if (isScrollingRef.current) return
            if (headingsRef.current.length === 0) return

            const id = getActiveId(headingsRef.current)
            setActiveId(id)
        }

        function setup() {
            const found = collectHeadings()
            if (found.length === 0) return false

            headingsRef.current = found
            setHeadings(found)

            // Calcula o ativo imediatamente ao montar
            setActiveId(getActiveId(found))

            return true
        }

        window.addEventListener('scroll', onScroll, { passive: true })

        if (!setup()) {
            const article = document.querySelector('article') ?? document.body
            mutationObserver = new MutationObserver(() => {
                if (setup()) mutationObserver?.disconnect()
            })
            mutationObserver.observe(article, { childList: true, subtree: true })
        }

        return () => {
            window.removeEventListener('scroll', onScroll)
            mutationObserver?.disconnect()
            if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
        }
    }, [pathname])

    const scrollToHeading = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault()
        const el = document.getElementById(id)
        if (!el) return

        isScrollingRef.current = true
        setActiveId(id)

        const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT
        window.scrollTo({ top, behavior: 'smooth' })

        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
        scrollTimerRef.current = setTimeout(() => {
            isScrollingRef.current = false
        }, 700)
    }

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

    if (headings.length === 0) return null

    return (
        <div className="p-5 space-y-3">
            <h3 className="font-bold text-foreground text-sm">On this page</h3>

            <nav className="space-y-1">
                {headings.map((heading) => (
                    <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        onClick={(e) => scrollToHeading(e, heading.id)}
                        className={[
                            'block leading-snug transition-colors hover:text-foreground text-xs',
                            heading.level === 3 ? 'pl-3' : '',
                            activeId === heading.id
                                ? 'text-primary font-semibold'
                                : 'text-muted-foreground',
                        ].join(' ')}
                    >
                        {heading.text}
                    </a>
                ))}
            </nav>

            {
                showScrollTop && (
                    <button
                        onClick={scrollToTop}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-2 border-t border-border w-full"
                    >
                        <ChevronUp className="w-3.5 h-3.5" />
                        Scroll to top
                    </button>
                )
            }
        </div >
    )
}