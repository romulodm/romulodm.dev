// src/lib/email/email.service.ts
//
// Selects the provider via EMAIL_PROVIDER=ses|smtp (default: smtp).
//
// Two isolated service instances are exported:
//
//   transactionalEmailService — for user-triggered one-off emails.
//     No SMTP rate limiting. Circuit breaker with tight threshold so a
//     failing provider is detected quickly and callers can surface errors.
//
//   campaignEmailService — for bulk campaign sends.
//     SMTP rate limiting is configured at the provider level. Looser circuit
//     breaker threshold to tolerate transient failures during long-running
//     campaigns without tripping the breaker prematurely.
//
// Sharing a single instance was the root cause of transactional emails being
// delayed by campaign rate limits: nodemailer's pool rate limiter is global
// across all callers of the same transporter.
//
// `emailService` is kept as a backward-compatible alias for
// `transactionalEmailService` so callers that only do verify() / warmUp() in
// index.ts do not need to be updated.

import type { EmailProvider, SendEmailOptions } from "./providers/base.provider";
import { SmtpProvider, type SmtpMode } from "./providers/smtp.provider";
import { SesProvider } from "./providers/ses.provider";

// ── Provider factory ──────────────────────────────────────────────────────────

/**
 * Creates the appropriate email provider for the given mode.
 *
 * SES does not need a mode-aware constructor because rate limiting for SES is
 * enforced by AWS on their side (via sending quotas), not by a local pool.
 * SMTP needs separate transporter instances per mode so their pool rate limits
 * remain isolated.
 */
function createProvider(mode: SmtpMode): EmailProvider {
  const chosen = (process.env.EMAIL_PROVIDER ?? "smtp").toLowerCase();

  switch (chosen) {
    case "ses":
      // SES has no local pool — AWS enforces rate limits server-side.
      // A single SesProvider constructor is sufficient for both modes.
      return new SesProvider();
    case "smtp":
    default:
      return new SmtpProvider(mode);
  }
}

// ── Circuit breaker ───────────────────────────────────────────────────────────

type CBState = "CLOSED" | "OPEN" | "HALF_OPEN";

class CircuitBreaker {
  private state: CBState = "CLOSED";
  private failures = 0;
  private nextAttempt = 0;

  constructor(
    private readonly threshold = 5,
    private readonly cooldownMs = 60_000,
  ) { }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        throw new Error("Circuit breaker OPEN — email provider unavailable");
      }
      this.state = "HALF_OPEN";
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = "CLOSED";
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.cooldownMs;
      console.error(
        `[EmailService] Circuit breaker OPEN — retry after ${new Date(this.nextAttempt).toISOString()}`,
      );
    }
  }

  isOpen() {
    return this.state === "OPEN" && Date.now() < this.nextAttempt;
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

class EmailService {
  private provider: EmailProvider;
  private breaker: CircuitBreaker;

  /**
   * @param mode - Controls provider configuration (pool size, rate limiting).
   *   "transactional" uses a tighter circuit breaker (threshold=3) because a
   *   failing confirmation email should surface quickly. "campaign" uses a
   *   looser threshold (threshold=10) to tolerate transient failures in a long
   *   bulk send without tripping the breaker for the whole campaign.
   */
  constructor(mode: SmtpMode = "transactional") {
    this.provider = createProvider(mode);

    const breakerThreshold = mode === "transactional" ? 3 : 10;
    this.breaker = new CircuitBreaker(breakerThreshold, 60_000);

    console.log(
      `[EmailService] mode=${mode} provider=${this.provider.name} breakerThreshold=${breakerThreshold}`,
    );
  }

  async send(opts: SendEmailOptions): Promise<void> {
    await this.breaker.run(() => this.provider.send(opts));
  }

  async verify(): Promise<void> {
    if (this.provider.verify) {
      const ok = await this.provider.verify();
      if (ok) console.log(`[EmailService] Provider "${this.provider.name}" verified ✅`);
    }
  }

  /**
   * Pre-warms the underlying transport connection pool. Call once on startup
   * so the first real send does not pay the TLS handshake cost. Delegates to
   * the provider's warmUp() if it exposes one (SmtpProvider does; SesProvider
   * uses HTTP and has no persistent pool to warm).
   *
   * Safe to call after verify() — both open a connection; this is intentionally
   * a no-op for providers that don't benefit from pre-warming.
   */
  async warmUp(): Promise<void> {
    if ("warmUp" in this.provider && typeof (this.provider as { warmUp?: unknown }).warmUp === "function") {
      await (this.provider as { warmUp: () => Promise<void> }).warmUp();
      console.log(`[EmailService] Pool warmed up (provider: ${this.provider.name})`);
    }
  }

  isAvailable(): boolean {
    return !this.breaker.isOpen();
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────

/**
 * Dedicated service for transactional emails (confirmation, welcome, password
 * reset, unsubscribe confirm). No SMTP rate limiting — these must be fast.
 */
export const transactionalEmailService = new EmailService("transactional");

/**
 * Dedicated service for campaign bulk sends. SMTP rate limiting is applied at
 * the provider level to stay within hosting quotas.
 */
export const campaignEmailService = new EmailService("campaign");

/**
 * Backward-compatible alias. index.ts calls verify() and warmUp() on this
 * reference at startup; pointing it at the transactional instance is correct
 * because that is the pool most sensitive to cold-start latency.
 */
export const emailService = transactionalEmailService;

export type { SendEmailOptions };