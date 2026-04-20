// portfolio/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { goSearch } from '@/lib/search'

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const query = searchParams.get('q')?.trim() ?? ''
    const locale = searchParams.get('locale') ?? 'pt'
    const limit = Math.min(Number(searchParams.get('limit') ?? 8), 20)

    if (!query || query.length < 2) {
        return NextResponse.json({ hits: [], processingTimeMs: 0 })
    }

    try {
        const result = await goSearch(query, locale, limit)
        return NextResponse.json(result)
    } catch {
        // Fallback silencioso se o serviço Go estiver offline
        return NextResponse.json({ hits: [], processingTimeMs: 0, query })
    }
}