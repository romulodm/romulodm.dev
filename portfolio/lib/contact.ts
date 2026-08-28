/**
 * Regras do formulário de contato que só rodam no servidor.
 *
 * O vocabulário (tópicos, status, limites) mora em `lib/contact-topics.ts` e é
 * reexportado daqui por conveniência — este arquivo importa `node:crypto` e
 * `zod`, então o cliente deve importar aquele, nunca este.
 */

import { createHash } from "node:crypto";
import { z } from "zod";

import type { getApiTranslator } from "@/lib/api-intl";
import { CONTACT_LIMITS, CONTACT_TOPICS } from "@/lib/contact-topics";

export * from "@/lib/contact-topics";

// ── Anonimização do IP ───────────────────────────────────────────────────────

/**
 * Identificador estável e não reversível do remetente.
 *
 * Guardamos o hash, não o IP. O IP é dado pessoal e não é necessário: o rate
 * limit vive no Redis, com chave efêmera. O que sobra de útil é conseguir
 * responder "essas quarenta mensagens vieram do mesmo lugar?" — e para isso um
 * hash com sal serve igual.
 *
 * O sal é `APP_SECRET`. Sem ele o hash seria trivialmente reversível: o espaço
 * de endereços IPv4 tem 2^32 elementos e cabe numa rainbow table.
 */
export function hashIp(ip: string): string {
  const salt = process.env.APP_SECRET ?? "";

  if (!salt) {
    console.warn("[Contact] APP_SECRET ausente — hash de IP sem sal.");
  }

  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

// ── Validação ────────────────────────────────────────────────────────────────

type Translator = Awaited<ReturnType<typeof getApiTranslator>>;

/**
 * Schema do corpo do POST público.
 *
 * Recebe o tradutor porque as mensagens de erro voltam para o visitante e
 * precisam sair no idioma dele — mesmo padrão de `createBanSchema` em
 * `app/api/admin/users/[id]/ban/route.ts`.
 *
 * Repare que `website` (o honeypot) NÃO está aqui: ele é checado antes da
 * validação, na rota, e nunca chega a este ponto.
 */
export function createContactSchema(t: Translator) {
  return z.object({
    name: z
      .string({ required_error: t("contact.nameRequired") })
      .trim()
      .min(CONTACT_LIMITS.nameMin, t("contact.nameRequired"))
      .max(CONTACT_LIMITS.nameMax, t("contact.nameTooLong")),

    email: z
      .string({ required_error: t("common.emailRequired") })
      .trim()
      .min(1, t("common.emailRequired"))
      .email(t("common.emailInvalid"))
      .max(CONTACT_LIMITS.emailMax, t("common.emailInvalid"))
      .transform((value) => value.toLowerCase()),

    topic: z.enum(CONTACT_TOPICS, {
      required_error: t("contact.topicInvalid"),
      invalid_type_error: t("contact.topicInvalid"),
    }),

    message: z
      .string({ required_error: t("contact.messageRequired") })
      .trim()
      .min(CONTACT_LIMITS.messageMin, t("contact.messageTooShort"))
      .max(CONTACT_LIMITS.messageMax, t("contact.messageTooLong")),

    // O token do Turnstile é validado contra a Cloudflare ANTES desta etapa.
    // Aqui só garantimos que é uma string plausível, para não mandar lixo pela
    // rede. O token de teste (`XXXX.DUMMY.TOKEN.XXXX`) tem 22 caracteres.
    turnstileToken: z.string().min(10).max(2048),
  });
}

export type ContactInput = z.infer<ReturnType<typeof createContactSchema>>;
