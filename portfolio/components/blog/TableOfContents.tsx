'use client'

import { useEffect, useState, useRef } from 'react'
import { ChevronUp } from 'lucide-react'

interface Heading {
    id: string
    text: string
    level: number
}

export function TableOfContents() {
    const [headings, setHeadings] = useState<Heading[]>([])
    const [activeId, setActiveId] = useState<string>('')
    const [showScrollTop, setShowScrollTop] = useState(false)
    const observerRef = useRef<IntersectionObserver | null>(null)

    useEffect(() => {
        // Coleta todos os headings do artigo
        const elements = Array.from(
            document.querySelectorAll('article h1, article h2, article h3')
        )

        // Garante que cada heading tem um id único
        elements.forEach((el) => {
            if (!el.id) {
                el.id = el.textContent
                    ?.toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .replace(/\s+/g, '-')
                    .trim() ?? Math.random().toString(36).slice(2)
            }
        })

        setHeadings(
            elements.map((el) => ({
                id: el.id,
                text: el.textContent ?? '',
                level: Number(el.tagName[1]),
            }))
        )

        // Intersection observer para destacar a seção ativa
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id)
                    }
                })
            },
            { rootMargin: '0px 0px -60% 0px', threshold: 0 }
        )

        elements.forEach((el) => observerRef.current?.observe(el))

        // Mostra botão de scroll to top
        const onScroll = () => setShowScrollTop(window.scrollY > 400)
        window.addEventListener('scroll', onScroll)

        return () => {
            observerRef.current?.disconnect()
            window.removeEventListener('scroll', onScroll)
        }
    }, [])

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

    if (headings.length === 0) return null

    return (
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <h3 className="font-bold text-foreground text-sm">On this page</h3>

            <nav className="space-y-1">
                {headings.map((heading) => (
                    <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        onClick={(e) => {
                            e.preventDefault()
                            const el = document.getElementById(heading.id)
                            if (!el) return
                            const navbarHeight = 80 // ajuste conforme a altura da sua navbar
                            const top = el.getBoundingClientRect().top + window.scrollY - navbarHeight
                            window.scrollTo({ top, behavior: 'smooth' })
                        }}
                        className={[
                            'block text-xs leading-snug transition-colors hover:text-foreground',
                            heading.level === 2 ? 'pl-0' : 'pl-3',
                            activeId === heading.id
                                ? 'text-primary font-semibold'
                                : 'text-muted-foreground',
                        ].join(' ')}
                    >
                        {heading.text}
                    </a>
                ))}
            </nav>

            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-2 border-t border-border w-full"
                >
                    <ChevronUp className="w-3.5 h-3.5" />
                    Scroll to top
                </button>
            )}
        </div>
    )
}