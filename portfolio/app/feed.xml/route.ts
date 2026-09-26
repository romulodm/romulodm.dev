import { NextResponse } from 'next/server'

import { routing } from '@/i18n/routing'
import { buildRssFeed } from '@/lib/feed'

// Era `revalidate = 600`, que obrigava o Next a montar o feed durante o
// `next build` — e nem a imagem Docker nem o runner do CI tem banco. O cache
// continua existindo pelo header Cache-Control abaixo, que os leitores de RSS
// respeitam.
//
// A linha abaixo e redundante no Next 16 (GET handler ja e dinamico por
// padrao; foi o `revalidate` que optava pelo estatico). Fica como guardrail:
// deixa explicito que esta rota nao pode ser prerenderizada, e quebra cedo se
// alguem reintroduzir `revalidate` sem se lembrar do porque.
export const dynamic = 'force-dynamic'

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
