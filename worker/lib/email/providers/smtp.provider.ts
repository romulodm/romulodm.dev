import nodemailer, { type SentMessageInfo, type Transporter } from "nodemailer";
import type { EmailProvider, SendEmailOptions, SendResult } from "./base.provider";

// ── Mode ──────────────────────────────────────────────────────────────────────
//
// "transactional" — user-triggered one-off emails (confirmation, password reset,
//   welcome, unsubscribe). Must be fast. No rate limiting so a burst of campaign
//   sends never delays a confirmation email. Fewer max connections because these
//   jobs fire sparsely.
//
// "campaign"      — bulk sends to many recipients. Rate-limited to stay within
//   provider thresholds. More connections to sustain throughput across the BullMQ
//   campaign worker's concurrency.

export type SmtpMode = "transactional" | "campaign";

const TRANSACTIONAL_CONFIG = {
  maxConnections: 3,
  maxMessages: 50,
  // No rateLimit / rateDelta — transactional emails must never queue behind
  // a campaign burst.
} as const;

const CAMPAIGN_CONFIG = {
  maxConnections: 5,
  maxMessages: 100,
  // 5 messages per second — keeps us under most shared-hosting SMTP limits
  // (e.g. Hostinger allows ~100/h on lower plans; tune via env if needed).
  rateDelta: 1_000,
  rateLimit: 5,
} as const;

export class SmtpProvider implements EmailProvider {
  readonly name = "smtp";
  private transporter: Transporter<SentMessageInfo>;
  private fromAddress: string;
  private fromName: string;

  constructor(mode: SmtpMode = "transactional") {
    this.fromAddress = process.env.SMTP_FROM ?? "noreply@yourdomain.com";
    this.fromName = process.env.EMAIL_FROM_NAME ?? "Newsletter";

    const modeConfig = mode === "campaign" ? CAMPAIGN_CONFIG : TRANSACTIONAL_CONFIG;

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.hostinger.com",
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: process.env.SMTP_SECURE !== "false",
      ...(process.env.SMTP_USER
        ? {
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        }
        : {}),
      pool: true,
      ...modeConfig,
    });

    console.log(`[SmtpProvider] mode=${mode} maxConnections=${modeConfig.maxConnections}`);
  }

  async send(opts: SendEmailOptions): Promise<SendResult> {
    const info = await this.transporter.sendMail({
      from: opts.from ?? `"${this.fromName}" <${this.fromAddress}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
      messageId: opts.messageId,
      headers: opts.headers,
    });

    return { messageId: info.messageId, success: true };
  }

  async verify(): Promise<boolean> {
    await this.transporter.verify();
    return true;
  }

  /**
   * Pre-warms the connection pool by opening a TCP+TLS connection to the SMTP
   * server without sending any message. Call once on worker startup so the first
   * real email does not pay the TLS handshake cost (~200–800 ms).
   *
   * This is essentially the same as `verify()` but semantically distinct: verify
   * is a health-check assertion, warmUp is a performance optimisation. Both open
   * a connection; warmUp is safe to call even after verify has already run.
   */
  async warmUp(): Promise<void> {
    await this.transporter.verify();
  }
}