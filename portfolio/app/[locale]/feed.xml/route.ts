import { NextResponse } from 'next/server'

import { routing } from '@/i18n/routing'
import { buildRssFeed } from '@/lib/feed'

// Regenera no maximo a cada 10 min. Feed e lido por robo em loop; sem isso cada
// leitor de RSS dispara markdown + query a cada visita.
export const revalidate = 600

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

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
