'use client'

import { useEffect, useState } from 'react'
import type { LegalHeading } from '@/lib/legal'

interface LegalTocProps {
  headings: LegalHeading[]
  label: string
}

export function LegalToc({ headings, label }: LegalTocProps) {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '')

  useEffect(() => {
    if (headings.length === 0) return

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    // Guarda a razão de interseção de cada título para escolher, a cada passo,
    // o mais visível — evita o "pisca-pisca" entre duas seções curtas.
    const ratios = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }

        // Prioriza o título visível mais alto na página.
        const visible = elements.filter((el) => (ratios.get(el.id) ?? 0) > 0)

        if (visible.length > 0) {
          setActiveId(visible[0].id)
          return
        }

        // Nenhum título na faixa observada: usa o último que já passou pelo topo.
        const passed = elements.filter((el) => el.getBoundingClientRect().top < 140)
        if (passed.length > 0) setActiveId(passed[passed.length - 1].id)
      },
      {
        // Faixa de leitura: do topo fixo da navbar até ~40% da viewport.
        rootMargin: '-120px 0px -60% 0px',
        threshold: [0, 1],
      },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav
      aria-label={label}
      className="sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <ul className="space-y-2 border-l border-border">
        {headings.map((heading) => {
          const active = heading.id === activeId
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={active ? 'location' : undefined}
                onClick={() => setActiveId(heading.id)}
                className={[
                  '-ml-px block border-l pl-3 text-xs leading-snug transition-colors',
                  active
                    ? 'border-primary font-semibold text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                ].join(' ')}
              >
                {heading.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
