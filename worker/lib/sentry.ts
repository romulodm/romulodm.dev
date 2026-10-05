// lib/sentry.ts

import * as Sentry from "@sentry/node";

import { workerEnvironment } from "./environment";

const DSN = process.env.SENTRY_DSN ?? "";

export const sentryEnabled = DSN.length > 0;

function parseRate(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback;
}

if (sentryEnabled) {
  Sentry.init({
    dsn: DSN,
    environment: workerEnvironment(),
    release: process.env.SENTRY_RELEASE || undefined,

    // Sem PII: nada de IP, header ou corpo de request nos eventos.
    sendDefaultPii: false,

    // Tracing desligado por padrao no worker — os jobs sao numerosos e a cota
    // do plano free acaba rapido. Suba SENTRY_TRACES_SAMPLE_RATE se precisar
    // investigar latencia de fila.
    tracesSampleRate: parseRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0),

    // O SDK ja captura excecao nao tratada por padrao, mas queremos controlar o
    // shutdown (flush + alerta no Telegram) — ver index.ts.
    integrations: (defaults) =>
      defaults.filter(
        (integration) =>
          integration.name !== "OnUncaughtException" &&
          integration.name !== "OnUnhandledRejection",
      ),

    beforeSend(event) {
      event.tags = { ...event.tags, service: "worker" };
      return event;
    },
  });

  Sentry.setTag("service", "worker");
}

/**
 * Captura uma excecao com contexto de job/fila.
 *
 * Nunca lanca: falha de rede com o Sentry nao pode derrubar o worker.
 */
export function captureWorkerException(
  event: string,
  error: unknown,
  context: Record<string, unknown> = {},
) {
  if (!sentryEnabled) return;

  try {
    Sentry.withScope((scope) => {
      scope.setTag("worker_event", event);
      scope.setFingerprint(["worker", event]);
      scope.setContext("worker", context);

      if (error instanceof Error) {
        Sentry.captureException(error);
        return;
      }

      scope.setContext("raw_error", { value: String(error) });
      Sentry.captureMessage(`[${event}] ${String(error)}`, "error");
    });
  } catch {
    // silencioso de proposito
  }
}

/** Registra breadcrumb — vira historico anexado ao proximo erro capturado. */
export function addWorkerBreadcrumb(
  level: "info" | "warning" | "error",
  event: string,
  data: Record<string, unknown> = {},
) {
  if (!sentryEnabled) return;

  try {
    Sentry.addBreadcrumb({ category: "worker", level, message: event, data });
  } catch {
    // silencioso de proposito
  }
}

/**
 * Esvazia a fila de eventos antes do processo morrer. Sem isso, o erro que
 * causou o shutdown normalmente se perde.
 */
export async function flushSentry(timeoutMs = 2000): Promise<void> {
  if (!sentryEnabled) return;

  try {
    await Sentry.flush(timeoutMs);
  } catch {
    // silencioso de proposito
  }
}

export { Sentry };
