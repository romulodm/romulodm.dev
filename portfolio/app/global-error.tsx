'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect, useState } from 'react'
import en from '@/messages/en.json'
import pt from '@/messages/pt.json'

/**
 * Last line of defense: catches errors thrown inside the root layout itself —
 * a broken provider, a failure loading the i18n messages, and so on.
 *
 * Because it replaces the whole root layout, it has to render its own <html>
 * and <body> and cannot depend on next-intl (the provider is exactly what may
 * have failed). The copy is imported straight from messages/*.json and picked
 * by the locale prefix of the URL, bypassing the provider entirely.
 */
const MESSAGES = { en: en.error, pt: pt.error } as const
type Locale = keyof typeof MESSAGES

function localeFromPath(): Locale {
  if (typeof window === 'undefined') return 'pt'
  const seg = window.location.pathname.split('/')[1]
  return seg === 'en' ? 'en' : 'pt'
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Sem esta chamada, erro no layout raiz nunca chega ao Sentry: o
    // instrumentation-client so cobre o que renderiza abaixo do layout.
    Sentry.captureException(error)
  }, [error])

  const [locale, setLocale] = useState<Locale>('pt')
  useEffect(() => setLocale(localeFromPath()), [])
  const t = MESSAGES[locale]

  return (
    <html lang={locale}>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#fafafa',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          padding: '1.5rem',
        }}
      >
        <main style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '0.8125rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#f97316',
              margin: '0 0 0.75rem',
            }}
          >
            500
          </p>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 0.75rem' }}>
            {t.title}
          </h1>

          <p style={{ color: '#a3a3a3', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
            {t.description}
          </p>

          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => reset()}
              style={{
                background: '#f97316',
                color: '#fff',
                border: 'none',
                borderRadius: '0.375rem',
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {t.retry}
            </button>

            <a
              href={`/${locale}`}
              style={{
                border: '1px solid #333',
                color: '#fafafa',
                borderRadius: '0.375rem',
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              {t.home}
            </a>
          </div>

          {error.digest && (
            <p
              style={{
                marginTop: '1.75rem',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '0.75rem',
                color: '#525252',
              }}
            >
              {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  )
}
