function readPositiveInt(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readString(name: string, fallback: string): string {
    const raw = process.env[name]?.trim();
    return raw ? raw : fallback;
}

export const queueRuntimeConfig = {
    transactionalWorkerConcurrency: readPositiveInt("WORKER_TRANSACTIONAL_CONCURRENCY", 8),
    campaignWorkerConcurrency: readPositiveInt("WORKER_CAMPAIGN_CONCURRENCY", 12),
    campaignRateLimitMax: readPositiveInt("WORKER_CAMPAIGN_RATE_LIMIT_MAX", 20),
    campaignRateLimitDurationMs: readPositiveInt("WORKER_CAMPAIGN_RATE_LIMIT_DURATION_MS", 1_000),
    notificationWorkerConcurrency: readPositiveInt("WORKER_NOTIFICATION_CONCURRENCY", 1),
    viewsFlushBatchSize: readPositiveInt("WORKER_VIEWS_FLUSH_BATCH_SIZE", 100),
    viewsFlushIntervalMs: readPositiveInt("WORKER_VIEWS_FLUSH_INTERVAL_MS", 120_000),
    onchainRetryIntervalMs: readPositiveInt("WORKER_ONCHAIN_RETRY_INTERVAL_MS", 300_000),
    /** Varre a fila transacional atrás de jobs que esgotaram os 3 retries do BullMQ (~15s) e tenta de novo — a rede de seguranca contra provedor fora do ar por mais tempo que isso. */
    transactionalEmailSweepIntervalMs: readPositiveInt("WORKER_TRANSACTIONAL_EMAIL_SWEEP_INTERVAL_MS", 600_000),
    donationsReconcileIntervalMs: readPositiveInt("WORKER_DONATIONS_RECONCILE_INTERVAL_MS", 300_000),
    donationsReconcileBatchSize: readPositiveInt("WORKER_DONATIONS_RECONCILE_BATCH", 25),
    donationsReconcileWindowDays: readPositiveInt("WORKER_DONATIONS_RECONCILE_WINDOW_DAYS", 7),
    /** Corta chamada pendurada ao provedor — sem isso um fetch travado segura o batch inteiro. */
    donationsProviderTimeoutMs: readPositiveInt("WORKER_DONATIONS_PROVIDER_TIMEOUT_MS", 10_000),
    /**
     * Fuso do fechamento contabil. O container roda em UTC; sem isto o "dia
     * anterior" da auditoria seria o dia UTC, que nao e o dia que o cron das
     * 08:30 BRT pretende fechar.
     */
    donationsAuditTimezone: readString("WORKER_DONATIONS_AUDIT_TZ", "America/Sao_Paulo"),
} as const;