import { NextResponse } from 'next/server'

import { routing } from '@/i18n/routing'
import { buildRssFeed } from '@/lib/feed'

// Feed e lido por robo em loop, entao o cache importa — mas ele vem do header
// Cache-Control da resposta, nao de ISR. `revalidate = 600` obrigava o Next a
// executar markdown + query no `next build`, e o build da imagem nao tem banco.
//
// A linha abaixo e redundante no Next 16 (GET handler ja e dinamico por
// padrao) e fica como guardrail contra reintroduzir `revalidate`. O que de
// fato protege o banco aqui e o Cache-Control publico da resposta — por isso
// esta rota nao precisa da zona proxy_cache que /sitemap.xml usa.
export const dynamic = 'force-dynamic'

// generateStaticParams foi removido junto: com force-dynamic nao ha prerender
// para parametrizar, e a validacao de locale ja acontece no GET abaixo.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    return new NextResponse('Not found', { status: 404 })
  }

  const xml = await buildRssFeed(locale)

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=3600',
    },
  })
}
