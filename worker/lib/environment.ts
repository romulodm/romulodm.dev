// lib/environment.ts

/**
 * The environment name the worker reports to Sentry and prints in Telegram
 * alerts. Read on every call instead of once at import time, so it does not
 * depend on `env.ts` having loaded `.env` before this module was evaluated.
 *
 * `||` instead of `??`: an empty `SENTRY_ENVIRONMENT=` in `.env` should fall
 * through to `NODE_ENV`, not become an empty label.
 */
export function workerEnvironment(): string {
    return process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development";
}

export function isDevelopment(): boolean {
    return workerEnvironment() === "development";
}
