// app/api/status/route.ts
// Rota PUBLICA - sem autenticacao. The payload itself is built in
// lib/status-payload.ts, which the /status page also renders on the server.

import { NextResponse } from 'next/server';

import {
    getStatusPayload,
    STATUS_PAYLOAD_STALE_SECONDS,
    STATUS_PAYLOAD_TTL_SECONDS,
} from '@/lib/status-payload';

export const dynamic = 'force-dynamic';

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
    const { data: payload, computedAt, source } = await getStatusPayload();

    return NextResponse.json(payload, {
        status: payload.status === 'unhealthy' ? 503 : 200,
        headers: {
            // s-maxage vale para cache compartilhado (Cloudflare / proxy). Hoje
            // ninguem honra: o nginx tem proxy_no_cache em /api/, exceto no
            // location dedicado de /api/status. Ver nginx/conf.d/app.conf.
            'Cache-Control': `public, s-maxage=${STATUS_PAYLOAD_TTL_SECONDS}, stale-while-revalidate=${STATUS_PAYLOAD_STALE_SECONDS}`,
            'X-Cache-Source': source,
            'X-Cache-Age': String(Math.max(0, Math.round((Date.now() - computedAt) / 1000))),
        },
    });
}