'use client'

import * as Sentry from '@sentry/nextjs'
import { RotateCw } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

/**
 * Error boundary de todas as rotas com locale.
 *
 * Fica abaixo de `app/[locale]/layout.tsx`, entao o NextIntlClientProvider ja
 * esta montado e da para traduzir normalmente — diferente do global-error.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('error')

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-lg text-center">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-primary">
          500
        </p>

        <h1 className="mb-3 text-2xl font-semibold text-foreground">{t('title')}</h1>

        <p className="mb-8 leading-relaxed text-muted-foreground">
          {t('description')}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <RotateCw className="h-4 w-4" />
            {t('retry')}
          </button>

          <Link
            href="/"
            className="rounded border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t('home')}
          </Link>
        </div>

        {/* O digest e o unico elo entre o que o usuario viu e o evento no
            Sentry — sem ele, reporte de erro vira adivinhacao. */}
        {error.digest && (
          <p className="mt-8 font-mono text-xs text-muted-foreground/60">
            {t('digest')}: {error.digest}
          </p>
        )}
      </div>
    </main>
  )
}
