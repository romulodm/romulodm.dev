import nodemailer from "nodemailer";
import type SMTPPool from "nodemailer/lib/smtp-pool/index.js";
import type { EmailProvider, SendEmailOptions, SendResult } from "./base.provider";

export class SmtpProvider implements EmailProvider {
  readonly name = "smtp";
  private transporter: nodemailer.Transporter<SMTPPool.SentMessageInfo>;
  private fromAddress: string;
  private fromName: string;

  constructor() {
    this.fromAddress = process.env.SMTP_FROM ?? "noreply@yourdomain.com";
    this.fromName = process.env.EMAIL_FROM_NAME ?? "Newsletter";

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
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
    });
  }

  async send(opts: SendEmailOptions): Promise<SendResult> {
    const info = await this.transporter.sendMail({
      from: opts.from ?? `"${this.fromName}" <${this.fromAddress}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
      messageId: opts.messageId,
    });

    return { messageId: info.messageId, success: true };
  }

  async verify(): Promise<boolean> {
    await this.transporter.verify();
    return true;
  }
}