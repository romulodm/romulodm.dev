// src/lib/email/email.service.ts
//
// Seleciona o provider via EMAIL_PROVIDER=ses|smtp (padrão: smtp).
//

import type { EmailProvider, SendEmailOptions } from "./providers/base.provider";
import { SmtpProvider } from "./providers/smtp.provider";
import { SesProvider } from "./providers/ses.provider";

function createProvider(): EmailProvider {
  const chosen = (process.env.EMAIL_PROVIDER ?? "smtp").toLowerCase();

  switch (chosen) {
    case "ses":
      return new SesProvider();
    case "smtp":
    default:
      return new SmtpProvider();
  }
}

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

class EmailService {
  private provider: EmailProvider;
  private breaker: CircuitBreaker;

  constructor() {
    this.provider = createProvider();
    this.breaker = new CircuitBreaker(5, 60_000);
    console.log(`[EmailService] Provider: ${this.provider.name}`);
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

  isAvailable(): boolean {
    return !this.breaker.isOpen();
  }
}

export const emailService = new EmailService();
export type { SendEmailOptions };