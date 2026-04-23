// app/api/admin/analytics/route.ts
// Rota PRIVADA — retorna dados do GA4 para o dashboard admin.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import {
    getTopCountries,
    getTopPages,
    getTrafficSources,
    getDailyVisitors,
    getDeviceBreakdown,
    getPeriodTotals,
} from '@/lib/ga4';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status });

    const days = Number(req.nextUrl.searchParams.get('days') ?? '30');

    try {
        const [totals, countries, pages, sources, daily, devices] = await Promise.all([
            getPeriodTotals(days),
            getTopCountries(days, 10),
            getTopPages(days, 10),
            getTrafficSources(days),
            getDailyVisitors(days),
            getDeviceBreakdown(days),
        ]);

        return NextResponse.json(
            { days, collectedAt: new Date().toISOString(), totals, countries, pages, sources, daily, devices },
            { headers: { 'Cache-Control': 'private, max-age=300' } }, // 5min — GA4 tem latencia de dados
        );
    } catch (err) {
        console.error('[ga4] failed:', err);
        return NextResponse.json({ error: 'GA4 unavailable', detail: String(err) }, { status: 503 });
    }
}