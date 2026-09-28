// src/lib/email/providers/resend.provider.ts

import { createHash } from "node:crypto";
import type { EmailProvider, SendEmailOptions, SendResult } from "./base.provider";

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Requisição para a Resend nunca deve travar o worker indefinidamente — se a
 * API deles ficar lenta, o FallbackProvider precisa poder desistir e cair
 * para o SES (ou deixar o BullMQ tentar de novo) dentro de um tempo
 * previsível.
 */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Lançado quando a Resend recusa o envio porque uma cota (diária ou mensal)
 * foi esgotada. A Resend RESPONDEU — não há ambiguidade sobre o que
 * aconteceu — então é seguro o FallbackProvider cair pro secundário na hora.
 */
export class ResendQuotaExceededError extends Error {
  constructor(
    public readonly reason: "daily" | "monthly",
    message: string,
  ) {
    super(message);
    this.name = "ResendQuotaExceededError";
  }
}

/**
 * Lançado quando a chamada à Resend falha SEM resposta — timeout, conexão
 * derrubada, DNS, etc. Diferente de `ResendQuotaExceededError` (e de um erro
 * HTTP normal, onde a Resend respondeu e recusou): aqui não dá pra saber se a
 * Resend processou o envio antes da rede cair. É por isso que esse erro é um
 * tipo separado — o FallbackProvider trata "ambíguo" diferente de
 * "definitivo" pra não arriscar mandar o mesmo email pelos dois provedores.
 */
export class ResendAmbiguousError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ResendAmbiguousError";
  }
}

interface ResendErrorBody {
  name?: string;
  message?: string;
}

export class ResendProvider implements EmailProvider {
  readonly name = "resend";

  private apiKey: string;
  private fromAddress: string;
  private fromName: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY ?? "";

    this.fromAddress =
      process.env.RESEND_FROM ?? process.env.SES_FROM ?? "noreply@romulodm.dev";

    this.fromName = process.env.EMAIL_FROM_NAME ?? "Newsletter";

    if (!this.apiKey) {
      console.warn(
        "[ResendProvider] RESEND_API_KEY não configurada — envios vão falhar em runtime.",
      );
    }
  }

  async send(opts: SendEmailOptions): Promise<SendResult> {
    const from = opts.from ?? `"${this.fromName}" <${this.fromAddress}>`;

    // Toda chamada carrega uma Idempotency-Key. Se essa mesma chave for
    // reenviada (retry do BullMQ, ou o fallback tentando de novo), a Resend
    // garante um único envio em vez de mandar duplicado — é o que torna
    // seguro deixar o BullMQ tentar de novo CONTRA A MESMA Resend depois de
    // um erro ambíguo, em vez de já cair pro SES. Preferimos opts.messageId
    // (determinístico por email lógico, ver buildEmailMessageId); na falta
    // dele, derivamos um hash do conteúdo — nunca mandamos sem chave.
    const idempotencyKey =
      opts.messageId ??
      createHash("sha256").update(`${opts.to}|${opts.subject}|${opts.html}`).digest("hex");

    let response: Response;
    try {
      response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          from,
          to: [opts.to],
          subject: opts.subject,
          html: opts.html,
          ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
          ...(opts.headers ? { headers: opts.headers } : {}),
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      // fetch() lançou: não houve resposta HTTP nenhuma (timeout do
      // AbortSignal, conexão recusada/derrubada, DNS). Não sabemos se a
      // Resend chegou a processar o envio — erro AMBÍGUO, não definitivo.
      throw new ResendAmbiguousError(
        `[ResendProvider] Falha de rede sem resposta: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }

    if (!response.ok) {
      // A Resend respondeu — seja lá o que aconteceu, é definitivo.
      const body = (await response.json().catch(() => ({}))) as ResendErrorBody;
      const errorName = body.name;
      const message = body.message ?? response.statusText;

      if (response.status === 429 && errorName === "daily_quota_exceeded") {
        throw new ResendQuotaExceededError("daily", message);
      }
      if (response.status === 429 && errorName === "monthly_quota_exceeded") {
        throw new ResendQuotaExceededError("monthly", message);
      }

      throw new Error(`[ResendProvider] ${response.status} ${errorName ?? ""}: ${message}`);
    }

    const data = (await response.json()) as { id?: string };
    return { messageId: data.id ?? "", success: true };
  }

  async verify(): Promise<boolean> {
    // A Resend não tem um endpoint dedicado de "ping" barato; a verificação
    // real acontece no primeiro send(). Aqui só confirmamos que a API key foi
    // configurada, para pegar o erro de config no boot em vez de no primeiro
    // email de um usuário real.
    return Boolean(this.apiKey);
  }
}
