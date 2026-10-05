// lib/alerts.ts

import { workerEnvironment } from "./environment";
import { notifyWorkerAlert, telegramConfigured } from "./telegram";

const ALERT_WINDOW_MS = Number(process.env.WORKER_ALERT_WINDOW_MS ?? 15 * 60 * 1000);
const ALERTS_ENABLED = process.env.WORKER_TELEGRAM_ALERTS !== "false";

/** assinatura do alerta -> timestamp do ultimo envio */
const lastSentAt = new Map<string, number>();

function shouldSend(signature: string): boolean {
    const now = Date.now();
    const previous = lastSentAt.get(signature);

    if (previous && now - previous < ALERT_WINDOW_MS) {
        return false;
    }

    lastSentAt.set(signature, now);

    // Evita crescimento indefinido do Map em processo de longa duracao.
    if (lastSentAt.size > 200) {
        for (const [key, timestamp] of lastSentAt) {
            if (now - timestamp > ALERT_WINDOW_MS) lastSentAt.delete(key);
        }
    }

    return true;
}

/**
 * Dispara alerta no Telegram. Nunca lanca e nunca bloqueia o caller por muito
 * tempo (timeout de TELEGRAM_TIMEOUT_MS) — se o Telegram falhar o erro e
 * ignorado (o Sentry ja registrou).
 */
export async function sendWorkerAlert(options: {
    event: string;
    error: unknown;
    queue?: string;
    jobId?: string;
}): Promise<void> {
    if (!ALERTS_ENABLED) return;
    if (!telegramConfigured()) return;

    const message =
        options.error instanceof Error ? options.error.message : String(options.error ?? "erro desconhecido");

    // Agrupa por evento + fila + mensagem para nao repetir o mesmo alerta.
    if (!shouldSend(`${options.event}:${options.queue ?? "-"}:${message}`)) return;

    try {
        await notifyWorkerAlert({
            event: options.event,
            message,
            queue: options.queue,
            jobId: options.jobId,
            environment: workerEnvironment(),
        });
    } catch {
        // silencioso de proposito — alerta nao pode quebrar o worker
    }
}

/** Versao fire-and-forget para usar em handler sincrono de evento. */
export function sendWorkerAlertAsync(options: {
    event: string;
    error: unknown;
    queue?: string;
    jobId?: string;
}): void {
    void sendWorkerAlert(options);
}
