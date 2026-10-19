// app/api/status/analytics/route.ts
// Rota PUBLICA - sem autenticacao. Audiencia dos ultimos 7 dias (GA4) para o
// topo da pagina /status. Polled by WeeklyAudience; the first payload is
// rendered by the page on the server (see lib/status-payload.ts).
//
// Separada de /api/status de proposito: o GA4 e lento (centenas de ms) e pode
// falhar por quota ou credencial, e nada disso deve atrasar nem derrubar o
// health check, que precisa responder rapido e refletir so o servidor.

import { NextResponse } from 'next/server';

import { logApiError } from '@/lib/api-errors';
import {
    AUDIENCE_STALE_SECONDS,
    AUDIENCE_TTL_SECONDS,
    getAudiencePayload,
} from '@/lib/status-payload';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const payload = await getAudiencePayload();

        return NextResponse.json(payload, {
            headers: {
                'Cache-Control': `public, s-maxage=${AUDIENCE_TTL_SECONDS}, stale-while-revalidate=${AUDIENCE_STALE_SECONDS}`,
            },
        });
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
