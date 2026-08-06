import { NextResponse } from 'next/server'

import { routing } from '@/i18n/routing'
import { buildRssFeed } from '@/lib/feed'

export const revalidate = 600

/**
 * Feed na raiz, sem prefixo de locale.
 *
 * O matcher do middleware de i18n exclui qualquer path com ponto
 * (`.*\\..*`), entao `/feed.xml` nunca seria redirecionado para
 * `/pt/feed.xml` — cairia em 404. Como `/feed.xml` e o endereco que as pessoas
 * tentam por convencao, esta rota serve o feed do locale padrao direto.
 */
export async function GET() {
  const xml = await buildRssFeed(routing.defaultLocale)

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=3600',
    },
  })
}
