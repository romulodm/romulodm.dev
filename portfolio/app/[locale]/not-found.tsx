import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import Navbar from '@/components/navigation/Navbar'

/**
 * 404 dentro do locale. O `app/not-found.tsx` da raiz continua existindo para o
 * caso de locale invalido, mas ele renderiza o `next/error` cru — este aqui e o
 * que o visitante ve ao acessar um post que nao existe.
 */
export default async function LocaleNotFound() {
  const t = await getTranslations('notFound')

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="w-full max-w-lg text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-primary">
            404
          </p>

          <h1 className="mb-3 text-2xl font-semibold text-foreground">{t('title')}</h1>

          <p className="mb-8 leading-relaxed text-muted-foreground">
            {t('description')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded bg-primary px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {t('home')}
            </Link>

            <Link
              href="/blog"
              className="rounded border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {t('blog')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
