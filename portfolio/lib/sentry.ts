// lib/sentry.ts

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

/** true quando ha DSN configurado. Fora isso, todo o SDK e no-op. */
export const sentryEnabled = SENTRY_DSN.length > 0;

/** Ambiente logico reportado ao Sentry (dev / production / preview). */
export const sentryEnvironment =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development";

/** Release — preenchido no build via SENTRY_RELEASE (ver Dockerfile). */
export const sentryRelease = process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined;

function parseRate(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback;
}

/** Amostragem de tracing. Default 10% em prod, 100% em dev. */
export const tracesSampleRate = parseRate(
  process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  process.env.NODE_ENV === "production" ? 0.1 : 1,
);

/**
 * Erros de rede/abort do browser e ruido de extensao. Nao sao bugs da
 * aplicacao e so consomem a cota do plano free.
 */
export const ignoredErrors = [
  "AbortError",
  "Failed to fetch",
  "NetworkError when attempting to fetch resource",
  "Load failed",
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  // next-auth dispara isso quando a sessao expira em background
  "CLIENT_FETCH_ERROR",
];

/**
 * Opcoes comuns aos tres runtimes.
 *
 * sendDefaultPii fica em false de proposito: nao enviamos email, IP nem
 * headers de request. O vinculo com o usuario e feito so pelo id
 * (ver components/observability/SentryUserContext.tsx).
 */
export const baseSentryOptions = {
  dsn: SENTRY_DSN,
  enabled: sentryEnabled,
  environment: sentryEnvironment,
  release: sentryRelease,
  sendDefaultPii: false,
  tracesSampleRate,
  ignoreErrors: ignoredErrors,
  // Em dev o SDK loga bastante; so ligamos com SENTRY_DEBUG=true.
  debug: process.env.SENTRY_DEBUG === "true",
};
