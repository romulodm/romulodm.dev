// app/api/status/analytics/route.ts
// Rota PUBLICA - sem autenticacao. Audiencia dos ultimos 7 dias (GA4) para o
// topo da pagina /status.
//
// Separada de /api/status de proposito: o GA4 e lento (centenas de ms) e pode
// falhar por quota ou credencial, e nada disso deve atrasar nem derrubar o
// health check, que precisa responder rapido e refletir so o servidor.

import { NextResponse } from 'next/server';

import { logApiError } from '@/lib/api-errors';
import { getWeeklyAudience, type WeeklyAudience } from '@/lib/ga4';
import { cached } from '@/lib/status-cache';

export const dynamic = 'force-dynamic';

// 8 relatorios por recalculo. Com 10 min de TTL sao ~1.150 chamadas/dia no
// pior caso, longe da quota diaria da propriedade — e o GA4 so consolida os
// dados com algumas horas de atraso, entao um TTL menor nao mostraria nada novo.
const TTL_SECONDS = 600;
const STALE_SECONDS = 3600;

export async function GET() {
    try {
        const { data, computedAt } = await cached<WeeklyAudience>(
            { key: 'status:audience', ttlSeconds: TTL_SECONDS, staleSeconds: STALE_SECONDS },
            getWeeklyAudience,
        );

        return NextResponse.json(
            { ...data, collectedAt: new Date(computedAt).toISOString() },
            {
                headers: {
                    'Cache-Control': `public, s-maxage=${TTL_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
                },
            },
        );
    } catch (err) {
        logApiError('ga4', err);
        // Sem `detail`: a rota e publica e a mensagem do GA4 pode citar o
        // property id ou a service account.
        return NextResponse.json(
            { error: 'GA4 unavailable' },
            { status: 503, headers: { 'Cache-Control': 'no-store' } },
        );
    }
}
