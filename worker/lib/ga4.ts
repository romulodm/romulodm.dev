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
 * Igual a `getDailyStats`, mas PROPAGA o erro.
 *
 * Existe porque o `catch` logo abaixo é indistinguível: "não configurado",
 * "credencial errada", "service account sem acesso" e "o dia teve zero acesso
 * mesmo" saem todos como os mesmos zeros. Isso é o comportamento certo em
 * produção — analytics não pode derrubar a notificação diária — e é exatamente
 * o que impede diagnosticar qualquer coisa. Quem quiser saber o motivo chama
 * esta versão; ver `scripts/ga4-check.ts`.
 */
export async function fetchDailyStats(
    startDate: string,
    endDate: string = startDate,
): Promise<DailyStats> {
    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId) throw new Error("GA4_PROPERTY_ID não configurado");

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

/**
 * Offset do fuso, em minutos, na instante dado.
 *
 * Existe porque `new Date("2026-08-28T00:00:00")` (sem sufixo) e interpretado
 * no fuso do PROCESSO, e o container do worker roda em UTC — nao ha TZ no
 * compose nem no Dockerfile. Como `yesterdayDate` responde em America/Sao_Paulo,
 * a data ia para o GA4 no fuso certo e para o Prisma tres horas deslocada: as
 * contagens do "dia" pegavam das 21h da vespera as 21h do dia.
 */
function tzOffsetMinutes(at: Date, timeZone: string): number {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(at);

    const get = (type: Intl.DateTimeFormatPartTypes) =>
        Number(parts.find((part) => part.type === type)?.value ?? 0);

    const asUTC = Date.UTC(
        get("year"),
        get("month") - 1,
        get("day"),
        get("hour") % 24,
        get("minute"),
        get("second"),
    );

    return (asUTC - (at.getTime() - at.getMilliseconds())) / 60_000;
}

/**
 * Intervalo `[start, end)` que cobre um dia YYYY-MM-DD no fuso informado.
 * Use com `{ gte: start, lt: end }` no Prisma — nunca um `gte` sozinho, que
 * deixa a janela aberta ate agora.
 */
export function dayRange(
    date: string,
    timeZone = process.env.TZ || "America/Sao_Paulo",
): { start: Date; end: Date } {
    const midnightUtc = new Date(`${date}T00:00:00Z`);
    const start = new Date(midnightUtc.getTime() - tzOffsetMinutes(midnightUtc, timeZone) * 60_000);

    return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

/** Data de ontem no formato YYYY-MM-DD, no fuso configurado (default America/Sao_Paulo). */
export function yesterdayDate(timeZone = process.env.TZ || "America/Sao_Paulo"): string {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // en-CA formata como YYYY-MM-DD
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(yesterday);
}
