function readPositiveInt(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
    donationsReconcileIntervalMs: readPositiveInt("WORKER_DONATIONS_RECONCILE_INTERVAL_MS", 300_000),
    donationsReconcileBatchSize: readPositiveInt("WORKER_DONATIONS_RECONCILE_BATCH", 25),
    donationsReconcileWindowDays: readPositiveInt("WORKER_DONATIONS_RECONCILE_WINDOW_DAYS", 7),
} as const;