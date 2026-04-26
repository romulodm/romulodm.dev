// ── Queue names ───────────────────────────────────────────────────────────────
export const QUEUE_TRANSACTIONAL = "newsletter-transactional";
export const QUEUE_CAMPAIGN = "newsletter-campaign";
export const QUEUE_NOTIFICATIONS = "notifications";
export const QUEUE_BACKUPS = "backups";

// ── Job names (repeatable) ────────────────────────────────────────────────────
export const DAILY_STATUS_JOB_NAME = "daily-status-cron";
export const FLUSH_VIEWS_JOB_NAME = "flush-views-cron";
export const RETRY_ONCHAIN_JOB_NAME = "retry-onchain-cron";

// ── Redis keys ────────────────────────────────────────────────────────────────
export const VIEWS_BUFFER_KEY = "views:buffer";