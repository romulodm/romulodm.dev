'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

/**
 * Ultima linha de defesa: pega erro lancado dentro do proprio root layout —
 * provider quebrado, falha no carregamento das mensagens de i18n, etc.
 *
 * Como substitui o layout raiz inteiro, precisa renderizar <html> e <body>
 * proprios e nao pode depender de next-intl (o provider e justamente o que pode
 * ter falhado), por isso os textos aqui sao bilingues fixos.
 */
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

  return (
    <html lang="en">
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
            Something went wrong
          </h1>

          <p style={{ color: '#a3a3a3', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
            Algo quebrou por aqui. O erro foi registrado e eu vou dar uma olhada.
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
              Tentar novamente
            </button>

            <a
              href="/"
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
              Voltar ao início
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
