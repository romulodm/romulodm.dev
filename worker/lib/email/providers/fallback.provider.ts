// src/lib/email/providers/fallback.provider.ts
//
// Combina dois EmailProviders em um só: tenta o primário primeiro, cai para o
// secundário quando a cota do primário está esgotada — ou quando não sobra
// mais chance de tentar de novo.
//
// ── Cota esgotada (erro DEFINITIVO) ─────────────────────────────────────────
//
// A Resend impõe dois tetos no plano grátis — 100/dia e 3.000/mês. Insistir
// nela a cada envio novo depois de estourar um teto é desperdício. Num
// `ResendQuotaExceededError`:
//
//   - Grava no Redis uma chave com TTL cobrindo a janela de reset: 24h para
//     cota diária, até a virada do mês (UTC) para cota mensal.
//   - Enquanto essa chave existir, o primário nem é chamado — vai direto pro
//     secundário.
//   - TTL expira sozinho, sem cron — o próximo envio tenta o primário de novo.
//
// ── Erro AMBÍGUO (timeout/rede) ─────────────────────────────────────────────
//
// Um `ResendAmbiguousError` significa que a chamada falhou sem resposta — não
// dá pra saber se a Resend processou o envio antes da rede cair. Cair direto
// pro SES nesse caso arriscaria mandar o mesmo email duas vezes (uma por
// provedor — isso não tem como ser evitado por nenhuma idempotency key, já
// que são sistemas diferentes). Em vez disso:
//
//   - Se ainda sobra tentativa no BullMQ (`!opts.isFinalAttempt`), relança o
//     erro. O retry seguinte chama a Resend DE NOVO — e como o
//     `ResendProvider` manda a mesma `Idempotency-Key` por email lógico, isso
//     é seguro: se a primeira chamada tiver sido processada, a Resend não
//     manda de novo, só devolve o resultado original.
//   - Só na ÚLTIMA tentativa, se ainda está ambíguo, cai pro SES mesmo assim
//     — a essa altura, garantir a entrega pesa mais que o risco (pequeno,
//     residual) de uma duplicata numa falha dupla rara.
//
// Qualquer outro erro definitivo (payload malformado, destinatário inválido)
// cai pro secundário na hora, mesmo sem ser cota — o objetivo de ter dois
// provedores é não deixar um problema pontual no primário derrubar um email
// transacional.

import { redis } from "../../redis";
import type { EmailProvider, SendEmailOptions, SendResult } from "./base.provider";
import { ResendAmbiguousError, ResendQuotaExceededError } from "./resend.provider";

const COOLDOWN_KEY = "email:resend:cooldown";
const DAILY_COOLDOWN_SECONDS = 24 * 60 * 60;

/** Segundos até 00:00 UTC do dia 1 do próximo mês, a partir de agora. */
function secondsUntilNextUtcMonth(): number {
  const now = new Date();
  const nextMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0);
  return Math.max(1, Math.ceil((nextMonth - now.getTime()) / 1000));
}

export class FallbackProvider implements EmailProvider {
  readonly name: string;

  constructor(
    private readonly primary: EmailProvider,
    private readonly secondary: EmailProvider,
  ) {
    this.name = `${primary.name}->${secondary.name}`;
  }

  async send(opts: SendEmailOptions): Promise<SendResult> {
    const cooldownActive = await this.isCoolingDown();

    if (!cooldownActive) {
      try {
        return await this.primary.send(opts);
      } catch (error) {
        if (error instanceof ResendQuotaExceededError) {
          // Definitivo — a Resend respondeu e recusou. Seguro cair na hora.
          await this.startCooldown(error.reason);
        } else if (error instanceof ResendAmbiguousError && !opts.isFinalAttempt) {
          // Ambíguo, e ainda sobra retry: deixa o BullMQ tentar a Resend de
          // novo (idempotente via Idempotency-Key) em vez de arriscar mandar
          // pelos dois provedores.
          throw error;
        } else {
          console.error(
            `[FallbackProvider] ${this.primary.name} falhou` +
              (error instanceof ResendAmbiguousError
                ? " (ambíguo, última tentativa — arriscando duplicata pra garantir entrega)"
                : "") +
              ` — caindo para ${this.secondary.name}:`,
            error,
          );
        }
        // Cai para o secundário em todos os outros casos.
      }
    }

    return this.secondary.send(opts);
  }

  async verify(): Promise<boolean> {
    const [primaryOk, secondaryOk] = await Promise.all([
      this.primary.verify?.() ?? Promise.resolve(true),
      this.secondary.verify?.() ?? Promise.resolve(true),
    ]);

    // O secundário é quem garante o envio quando o primário está de molho —
    // não pode falhar. O primário sem API key configurada é só um aviso (já
    // logado pelo próprio ResendProvider), não motivo pra reprovar o boot.
    return secondaryOk;
  }

  private async isCoolingDown(): Promise<boolean> {
    try {
      const value = await redis.get(COOLDOWN_KEY);
      return value !== null;
    } catch (error) {
      // Redis fora do ar: melhor tentar a Resend e deixar o próprio erro dela
      // decidir do que assumir cota esgotada às cegas.
      console.error("[FallbackProvider] Redis indisponível ao checar cooldown:", error);
      return false;
    }
  }

  private async startCooldown(reason: "daily" | "monthly"): Promise<void> {
    const ttl = reason === "daily" ? DAILY_COOLDOWN_SECONDS : secondsUntilNextUtcMonth();

    try {
      await redis.set(COOLDOWN_KEY, reason, "EX", ttl);
      console.warn(
        `[FallbackProvider] Cota da Resend esgotada (${reason}) — usando ${this.secondary.name} pelas próximas ${ttl}s.`,
      );
    } catch (error) {
      console.error("[FallbackProvider] Falha ao gravar cooldown no Redis:", error);
    }
  }
}
