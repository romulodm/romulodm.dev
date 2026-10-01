// components/legal/LegalPage.tsx
// Layout compartilhado pelas páginas /legal/terms e /legal/privacy-policy.

import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import Navbar from '@/components/navigation/Navbar'
import { Footer } from '@/components/Footer'
import { LegalToc } from '@/components/legal/LegalToc'
import type { LegalDocumentSlug, LegalHeading } from '@/lib/legal'

const TABS: { slug: LegalDocumentSlug; labelKey: 'terms' | 'privacyPolicy' }[] = [
  { slug: 'terms', labelKey: 'terms' },
  { slug: 'privacy-policy', labelKey: 'privacyPolicy' },
]

/**
 * Binds each prose element to the site's theme tokens instead of the plugin's
 * gray palette, so the legal pages match the rest of the site in both themes.
 * Same approach as the blog post page.
 */
const PROSE_CLASSES = [
  'prose prose-neutral dark:prose-invert max-w-none',

  // Variáveis do plugin que não têm variante `prose-*` dedicada.
  '[--tw-prose-bullets:hsl(var(--muted-foreground))]',
  '[--tw-prose-counters:hsl(var(--muted-foreground))]',
  '[--tw-prose-th-borders:hsl(var(--border))]',
  '[--tw-prose-td-borders:hsl(var(--border))]',
  '[--tw-prose-invert-bullets:hsl(var(--muted-foreground))]',
  '[--tw-prose-invert-counters:hsl(var(--muted-foreground))]',
  '[--tw-prose-invert-th-borders:hsl(var(--border))]',
  '[--tw-prose-invert-td-borders:hsl(var(--border))]',

  // Corpo do texto.
  'prose-p:text-foreground/85 prose-p:leading-relaxed',
  'prose-li:text-foreground/85 prose-li:leading-relaxed',
  'prose-strong:text-foreground prose-strong:font-semibold',
  'prose-em:text-foreground/85',

  // Títulos.
  'prose-headings:text-foreground prose-headings:font-semibold prose-headings:scroll-mt-28',
  'prose-h2:mt-14 prose-h2:border-t prose-h2:border-border prose-h2:pt-10 prose-h2:text-2xl',
  'prose-h3:mt-8 prose-h3:text-lg',

  // Links.
  'prose-a:text-primary prose-a:font-medium prose-a:underline-offset-2 hover:prose-a:opacity-80',

  // Tabelas.
  'prose-table:text-sm',
  'prose-th:text-left prose-th:text-foreground prose-th:font-semibold',
  'prose-td:text-foreground/85 prose-td:align-top',

  // Destaques e separadores.
  'prose-blockquote:border-l-primary prose-blockquote:not-italic',
  'prose-blockquote:bg-muted/40 prose-blockquote:rounded-r-lg',
  'prose-blockquote:py-1 prose-blockquote:pr-4',
  'prose-blockquote:text-foreground',
  'prose-code:text-foreground prose-code:bg-muted prose-code:rounded prose-code:px-1',
  'prose-hr:border-border',
].join(' ')

interface LegalPageProps {
  locale: string
  slug: LegalDocumentSlug
  title: string
  updatedAt: string | null
  headings: LegalHeading[]
  html: string
}

export async function LegalPage({
  locale,
  slug,
  title,
  updatedAt,
  headings,
  html,
}: LegalPageProps) {
  const t = await getTranslations({ locale, namespace: 'legal.page' })
  const tocLabel = t('toc')

  return (
    // `min-h-screen bg-background` é o mesmo wrapper usado por /blog, /wall,
    // /support e /resume. Sem ele a página herda o fundo padrão do navegador,
    // que destoa do tema escuro.
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 pt-28 pb-16 sm:px-6">
        {/* ── Cabeçalho ── */}
        <header className="mx-auto max-w-3xl text-center">
          {updatedAt && (
            <p className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-primary">
              {t('updatedAt', { date: updatedAt })}
            </p>
          )}

          <h1 className="type-h1 mt-3 text-foreground">
            {title}
          </h1>
        </header>

        {/* ── Alternador entre documentos ── */}
        <nav
          aria-label={t('documentsNav')}
          className="mx-auto mt-8 flex w-fit gap-1 rounded-full border border-border bg-muted/40 p-1"
        >
          {TABS.map((tab) => {
            const active = tab.slug === slug
            return (
              <Link
                key={tab.slug}
                href={`/${locale}/legal/${tab.slug}`}
                aria-current={active ? 'page' : undefined}
                className={[
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {t(`tabs.${tab.labelKey}`)}
              </Link>
            )
          })}
        </nav>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
          {/* ── Documento ── */}
          <article
            className={PROSE_CLASSES}
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* ── Índice com seção ativa ── */}
          <aside className="hidden lg:block">
            <LegalToc headings={headings} label={tocLabel} />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
