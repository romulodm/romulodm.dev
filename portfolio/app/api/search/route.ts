// portfolio/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'

import { rateLimitResponse } from '@/lib/api-errors'
import { getApiTranslator } from '@/lib/api-intl'
import { getRequestIp, rateLimit } from '@/lib/rate-limit'
import { goSearch } from '@/lib/search'

// A busca é pública, sem auth, e dispara a cada tecla digitada no front —
// o limite precisa acomodar digitação real (~5/s em rajada) sem virar
// ferramenta de scraping do índice inteiro.
const SEARCH_MAX = 30
const SEARCH_WINDOW_SECONDS = 10

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const query = searchParams.get('q')?.trim() ?? ''
    const locale = searchParams.get('locale') ?? 'pt'
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 8, 1), 20)

    if (!query || query.length < 2) {
        return NextResponse.json({ hits: [], processingTimeMs: 0 })
    }

    // Query longa não ajuda ninguém e só faz o serviço Go trabalhar à toa.
    if (query.length > 128) {
        return NextResponse.json({ hits: [], processingTimeMs: 0 })
    }

    const ip = getRequestIp(req)
    const limited = await rateLimit(
        `search:${ip}`,
        SEARCH_MAX,
        SEARCH_WINDOW_SECONDS,
        'open',
    )

    if (limited) {
        const t = await getApiTranslator(req)
        return rateLimitResponse(t('common.rateLimited'))
    }

    try {
        const result = await goSearch(query, locale, limit)
        return NextResponse.json(result)
    } catch {
        // Fallback silencioso se o serviço Go estiver offline
        return NextResponse.json({ hits: [], processingTimeMs: 0, query })
    }
}
