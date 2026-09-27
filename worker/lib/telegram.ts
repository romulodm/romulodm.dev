import { UnrecoverableError } from "bullmq";
import { prisma } from "@romulo/database";
import { dayRange, getDailyStats, yesterdayDate } from "./ga4";

const BOT_URL = process.env.TELEGRAM_BOT_URL!;
const BOT_SECRET = process.env.TELEGRAM_NOTIFY_SECRET!;

/**
 * O bot vive no plano free do Render, que hiberna por inatividade: a primeira
 * chamada depois de um periodo parado paga um cold start de dezenas de
 * segundos. Sem `signal`, o `fetch` do Node nao tem timeout nenhum — o job
 * ficava pendurado sem limite segurando o unico slot de concorrencia da fila de
 * notificacoes, e o `sendWorkerAlert`, que promete no proprio docstring nao
 * bloquear o caller, bloqueava.
 *
 * O default e generoso de proposito: a tentativa que acorda o servico e
 * justamente a lenta, e o backoff do BullMQ cobre o resto. Alerta usa um teto
 * menor porque ali a mensagem importa menos que nao travar quem chamou.
 */
const DEFAULT_TIMEOUT_MS = Number(process.env.TELEGRAM_BOT_TIMEOUT_MS ?? 30_000);
const ALERT_TIMEOUT_MS = Number(process.env.TELEGRAM_ALERT_TIMEOUT_MS ?? 10_000);

// ── Core

async function notifyBot(payload: object, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<void> {
    let res: Response;

    try {
        res = await fetch(`${BOT_URL}/notify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${BOT_SECRET}`,
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(timeoutMs),
        });
    } catch (error) {
        // Timeout e falha de rede sao transitorios: erro comum, o BullMQ repete.
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Telegram bot inalcancavel (timeout ${timeoutMs}ms): ${reason}`);
    }

    if (res.ok) return;

    const body = await res.text().catch(() => "");
    const message = `Telegram bot error ${res.status}: ${body.slice(0, 500)}`;

    /*
     * 4xx nao melhora com repeticao: ou o payload nao bate com o schema do bot,
     * ou o segredo esta errado. Repetir tres vezes so atrasa a ida para a fila
     * de falhas e gasta um cold start por tentativa. 408 e 429 ficam de fora —
     * esses o tempo resolve.
     */
    const permanent =
        res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429;

    throw permanent ? new UnrecoverableError(message) : new Error(message);
}

// ── Handlers

export async function notifyWorkerAlert(alert: {
    event: string;
    message: string;
    queue?: string;
    jobId?: string;
    environment?: string;
}): Promise<void> {
    await notifyBot({ type: "worker-alert", ...alert }, ALERT_TIMEOUT_MS);
}

export async function notifyComment(comment: {
    id: string;
    author: string;
    postTitle: string;
    postSlug: string;
}): Promise<void> {
    await notifyBot({ type: "comment", ...comment });
}

export async function notifyContact(contact: {
    id: string;
    name: string;
    topic: string;
    preview: string;
}): Promise<void> {
    await notifyBot({ type: "contact", ...contact });
}

/**
 * Aviso unico de que o teto global do formulario de contato foi atingido.
 *
 * Nao e "chegou mensagem", e "parei de aceitar". Quem garante que isto dispara
 * no maximo uma vez por janela e o `SET NX EX` na rota — aqui nao ha
 * deduplicacao nenhuma.
 */
export async function notifyContactFlood(flood: {
    max: number;
    windowMinutes: number;
}): Promise<void> {
    await notifyBot({ type: "contact-flood", ...flood });
}

/**
 * Resumo do dia anterior.
 *
 * Tudo aqui e de UM dia de referencia (`yesterdayDate()`), e a data vai no
 * payload: o bot carimbava `datetime.now()` no cabecalho, que no Render e UTC,
 * e mostrava uma data que nao era a dos numeros.
 */
export async function sendDailyStatus(): Promise<void> {
    await notifyBot(await buildDailyStatus());
}

/**
 * Monta o payload sem enviar — o que permite conferir os numeros em
 * desenvolvimento sem gastar uma mensagem no chat. Ver `scripts/ga4-check.ts`.
 */
export async function buildDailyStatus(): Promise<Record<string, unknown>> {
    const date = yesterdayDate();
    const stats = await getDailyStats(date);

    // Janela fechada. O `gte` sozinho que estava aqui nao tinha teto superior:
    // "novos hoje" somava tambem quem entrou depois da meia-noite, ate 32h de
    // dados num campo que o bot rotula como um dia.
    const { start, end } = dayRange(date);
    const window = { gte: start, lt: end };

    const [
        likes,
        comments,
        newSubscribers,
        unsubscribed,
        totalSubscribers,
        totalPosts,
        viewsAggregate,
    ] = await Promise.all([
        prisma.postLike.count({ where: { createdAt: window } }),
        prisma.comment.count({ where: { createdAt: window } }),
        prisma.newsletterSubscriber.count({ where: { isConfirmed: true, subscribedAt: window } }),
        prisma.newsletterSubscriber.count({ where: { unsubscribedAt: window } }),
        prisma.newsletterSubscriber.count({ where: { isConfirmed: true, unsubscribedAt: null } }),
        prisma.post.count({ where: { status: "PUBLISHED" } }),
        prisma.post.aggregate({ _sum: { views: true } }),
    ]);

    return {
        type: "daily-status",
        date,
        totalSubscribers,
        newToday: newSubscribers,
        // Estes dois eram zeros fixos com um "adicione a query se quiser" ao
        // lado. O resultado era o bot anunciando "Posts: 0" todo dia as 08:00.
        unsubscribedToday: unsubscribed,
        totalPosts,
        /*
         * `totalViews` e o acumulado do Postgres. Antes vinha de
         * `stats.pageviews` — ou seja, as views de UM dia, exibidas pelo bot
         * como "Views totais" — e `viewsToday` recebia `stats.visitors`, que
         * nem views e. Os dois rotulos mentiam.
         */
        totalViews: viewsAggregate._sum.views ?? 0,
        viewsToday: stats.pageviews,
        // Estes quatro ja eram calculados e descartados em silencio: o Pydantic
        // ignora campo extra por padrao, e o bot nao loga o corpo.
        visitors: stats.visitors,
        sessions: stats.sessions,
        avgTimeSec: stats.avgSessionDuration,
        likes,
        comments,
    };
}
