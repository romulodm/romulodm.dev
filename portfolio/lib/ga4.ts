// lib/ga4.ts
// Busca dados do GA4 Data API para o dashboard admin.
// Requer: npm install @google-analytics/data
// Requer: GOOGLE_APPLICATION_CREDENTIALS ou GOOGLE_SA_KEY no .env

import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Suporta tanto arquivo de credenciais quanto JSON inline (útil em produção/Docker)
function getClient() {
    const saKey = process.env.GOOGLE_SA_KEY;
    if (saKey) {
        const credentials = JSON.parse(saKey);
        return new BetaAnalyticsDataClient({ credentials });
    }
    // Fallback: usa GOOGLE_APPLICATION_CREDENTIALS (caminho para o arquivo JSON)
    return new BetaAnalyticsDataClient();
}

const client = getClient();
const propertyId = process.env.GA4_PROPERTY_ID!; // ex: "123456789"

// ── Países com mais sessões (últimos N dias) ──────────────────────────────────

export async function getTopCountries(days = 30, limit = 10) {
    const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dimensions: [{ name: 'country' }, { name: 'countryId' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit,
    });

    return (response.rows ?? []).map((row) => ({
        country: row.dimensionValues?.[0].value ?? '',
        countryCode: row.dimensionValues?.[1].value ?? '',
        sessions: Number(row.metricValues?.[0].value ?? 0),
        activeUsers: Number(row.metricValues?.[1].value ?? 0),
    }));
}

// ── Páginas mais visitadas ────────────────────────────────────────────────────

export async function getTopPages(days = 30, limit = 10) {
    const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'averageSessionDuration' }],
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        // Exclui páginas de admin e API
        dimensionFilter: {
            notExpression: {
                filter: {
                    fieldName: 'pagePath',
                    stringFilter: { matchType: 'BEGINS_WITH', value: '/admin' },
                },
            },
        },
        limit,
    });

    return (response.rows ?? []).map((row) => ({
        path: row.dimensionValues?.[0].value ?? '',
        title: row.dimensionValues?.[1].value ?? '',
        pageViews: Number(row.metricValues?.[0].value ?? 0),
        avgSessionDuration: Math.round(Number(row.metricValues?.[1].value ?? 0)),
    }));
}

// ── Fontes de tráfego ─────────────────────────────────────────────────────────

export async function getTrafficSources(days = 30) {
    const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
        metrics: [{ name: 'sessions' }, { name: 'newUsers' }],
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 8,
    });

    return (response.rows ?? []).map((row) => ({
        channel: row.dimensionValues?.[0].value ?? '',
        sessions: Number(row.metricValues?.[0].value ?? 0),
        newUsers: Number(row.metricValues?.[1].value ?? 0),
    }));
}

// ── Visitantes diarios (sparkline) ───────────────────────────────────────────

export async function getDailyVisitors(days = 30) {
    const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    return (response.rows ?? []).map((row) => ({
        // "20260422" → "2026-04-22"
        date: row.dimensionValues?.[0].value?.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') ?? '',
        activeUsers: Number(row.metricValues?.[0].value ?? 0),
        sessions: Number(row.metricValues?.[1].value ?? 0),
    }));
}

// ── Dispositivos ──────────────────────────────────────────────────────────────

export async function getDeviceBreakdown(days = 30) {
    const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }],
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    });

    return (response.rows ?? []).map((row) => ({
        device: row.dimensionValues?.[0].value ?? '',
        sessions: Number(row.metricValues?.[0].value ?? 0),
    }));
}

// ── Totais do periodo ─────────────────────────────────────────────────────────

export async function getPeriodTotals(days = 30) {
    const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'newUsers' },
        ],
        dateRanges: [
            { startDate: `${days}daysAgo`, endDate: 'today', name: 'current' },
            { startDate: `${days * 2}daysAgo`, endDate: `${days}daysAgo`, name: 'previous' },
        ],
    });

    function parseRow(rows: any[], dateRangeName: string) {
        const row = rows.find((r) => r.dimensionValues?.[0]?.value === dateRangeName);
        const m = row?.metricValues ?? [];
        return {
            activeUsers: Number(m[0]?.value ?? 0),
            sessions: Number(m[1]?.value ?? 0),
            pageViews: Number(m[2]?.value ?? 0),
            bounceRate: Math.round(Number(m[3]?.value ?? 0) * 100),
            avgSessionDuration: Math.round(Number(m[4]?.value ?? 0)),
            newUsers: Number(m[5]?.value ?? 0),
        };
    }

    const rows = response.rows ?? [];
    const current = parseRow(rows, 'current');
    const previous = parseRow(rows, 'previous');

    function growth(c: number, p: number) {
        if (p === 0) return c > 0 ? 100 : null;
        return Math.round(((c - p) / p) * 100);
    }

    return {
        current,
        previous,
        growth: {
            activeUsers: growth(current.activeUsers, previous.activeUsers),
            sessions: growth(current.sessions, previous.sessions),
            pageViews: growth(current.pageViews, previous.pageViews),
        },
    };
}
// ── Tempo real: usuários ativos agora ─────────────────────────────────────────

/**
 * Usuários ativos nos últimos 30 minutos.
 *
 * `runRealtimeReport` sem dimensão nenhuma devolve uma única linha com o total.
 * Pedir uma dimensão aqui (país, página) multiplicaria as linhas e ainda exigiria
 * somar de volta — e o dado que a home mostra é só a contagem.
 */
export async function getRealtimeActiveUsers(): Promise<number> {
    const [response] = await client.runRealtimeReport({
        property: `properties/${propertyId}`,
        metrics: [{ name: 'activeUsers' }],
        minuteRanges: [{ startMinutesAgo: 29, endMinutesAgo: 0 }],
    });

    return Number(response.rows?.[0]?.metricValues?.[0]?.value ?? 0);
}
