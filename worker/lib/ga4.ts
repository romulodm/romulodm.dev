// worker/lib/ga4.ts
// Busca dados do GA4 Data API para as notificações diárias do worker.
// Requer: GA4_PROPERTY_ID e (GOOGLE_SA_KEY | GOOGLE_APPLICATION_CREDENTIALS)

import { BetaAnalyticsDataClient } from "@google-analytics/data";

export interface DailyStats {
    visitors: number;
    pageviews: number;
    sessions: number;
    /** Tempo médio de sessão em segundos */
    avgSessionDuration: number;
}

const EMPTY_STATS: DailyStats = {
    visitors: 0,
    pageviews: 0,
    sessions: 0,
    avgSessionDuration: 0,
};

let cachedClient: BetaAnalyticsDataClient | null = null;

// Suporta tanto arquivo de credenciais quanto JSON inline (útil em produção/Docker)
function getClient(): BetaAnalyticsDataClient {
    if (cachedClient) return cachedClient;

    const saKey = process.env.GOOGLE_SA_KEY;
    cachedClient = saKey
        ? new BetaAnalyticsDataClient({ credentials: JSON.parse(saKey) })
        : new BetaAnalyticsDataClient();

    return cachedClient;
}

/**
 * Totais de um dia específico (YYYY-MM-DD) ou de um intervalo.
 * Retorna zeros se o GA4 não estiver configurado — as notificações não devem
 * quebrar por causa de analytics.
 */
export async function getDailyStats(
    startDate: string,
    endDate: string = startDate,
): Promise<DailyStats> {
    const propertyId = process.env.GA4_PROPERTY_ID;

    if (!propertyId) {
        console.warn("[ga4] GA4_PROPERTY_ID não configurado — retornando zeros.");
        return EMPTY_STATS;
    }

    try {
        const [response] = await getClient().runReport({
            property: `properties/${propertyId}`,
            metrics: [
                { name: "activeUsers" },
                { name: "screenPageViews" },
                { name: "sessions" },
                { name: "averageSessionDuration" },
            ],
            dateRanges: [{ startDate, endDate }],
        });

        const m = response.rows?.[0]?.metricValues ?? [];

        return {
            visitors: Number(m[0]?.value ?? 0),
            pageviews: Number(m[1]?.value ?? 0),
            sessions: Number(m[2]?.value ?? 0),
            avgSessionDuration: Math.round(Number(m[3]?.value ?? 0)),
        };
    } catch (err) {
        console.error("[ga4] Falha ao buscar stats:", err);
        return EMPTY_STATS;
    }
}

/** Data de ontem no formato YYYY-MM-DD, no fuso configurado (default America/Sao_Paulo). */
export function yesterdayDate(timeZone = process.env.TZ || "America/Sao_Paulo"): string {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // en-CA formata como YYYY-MM-DD
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(yesterday);
}
