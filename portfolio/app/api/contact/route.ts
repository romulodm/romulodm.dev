/**
 * POST /api/contact — o único caminho de entrada do formulário de contato.
 *
 * A ordem do código abaixo é a ordem das defesas, e ela é deliberada: cada
 * portão é mais caro que o anterior, então nada caro roda antes de algo
 * barato. A única chamada de rede (Turnstile) é a penúltima coisa a acontecer.
 *
 *   01  limit_req no nginx          ~µs      flood de um IP só
 *   02  parse + tamanho do body     ~0       payload gigante
 *   03  honeypot                    ~0       bot de formulário
 *   04  rate limit por IP           1 INCR   o que escapou do nginx
 *   05  rate limit GLOBAL           1 INCR   ataque distribuído
 *   06  Turnstile siteverify        ~100ms   curl / Postman / script
 *   07  zod + sanitize              ~0       lixo estrutural
 *   08  insert no Postgres          ~5ms     chegou aqui, é mensagem
 *
 * O portão 05 é o que responde "não quero receber mil mensagens num dia":
 * limite por IP não salva de mil IPs mandando uma mensagem cada; um teto
 * global no endpoint salva.
 *
 * Só existe POST. Um endpoint sem GET já elimina metade da varredura
 * automática que passa por aí.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@romulo/database";

import {
  badRequestResponse,
  forbiddenResponse,
  internalErrorResponse,
  logApiError,
  rateLimitResponse,
  validationErrorResponse,
} from "@/lib/api-errors";
import { getApiTranslator, resolveApiLocale } from "@/lib/api-intl";
import {
  RequestValidationError,
  sanitizeMultilineText,
  sanitizePlainText,
} from "@/lib/api-validation";
import {
  CONTACT_LIMITS,
  CONTACT_PREVIEW_LENGTH,
  createContactSchema,
  hashIp,
} from "@/lib/contact";
import { enqueueNotification } from "@/lib/queues/notification.queue";
import { getRedis } from "@/lib/redis";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

// ── Orçamentos ───────────────────────────────────────────────────────────────

/** Por IP. Ninguém escreve para você três vezes numa hora de boa-fé. */
const PER_IP_MAX = 3;
const PER_IP_WINDOW_SECONDS = 60 * 60;

/**
 * Teto global do endpoint, a defesa contra ataque distribuído.
 *
 * O volume normal do formulário é de algumas dezenas por MÊS. Cinquenta numa
 * hora só acontece em duas situações: ataque, ou um post viralizando. Nos dois
 * casos o comportamento certo é parar e avisar, não continuar aceitando.
 */
const GLOBAL_MAX = 50;
const GLOBAL_WINDOW_SECONDS = 60 * 60;

/**
 * Acima disto, para de notificar mensagem por mensagem e manda um resumo.
 *
 * Não é só carinho com a sua tela de bloqueio: a API do Telegram limita ~1
 * mensagem por segundo no mesmo chat, então um pico viraria fila travada e
 * jobs falhando em cascata.
 */
const NOTIFY_INDIVIDUALLY_MAX = 10;
const NOTIFY_WINDOW_SECONDS = 60 * 60;

/** Chave que garante UM alerta de flood por hora, em vez de um por request. */
const FLOOD_ALERT_KEY = "contact:flood:alerted";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Dispara o alerta de flood no máximo uma vez por janela.
 *
 * `SET ... NX EX` é atômico: o primeiro request a cruzar o teto ganha a chave e
 * manda o aviso; os outros 499 não fazem nada. Sem isso, o próprio alerta
 * viraria o flood.
 */
async function alertFloodOnce(): Promise<void> {
  try {
    const claimed = await getRedis().set(
      FLOOD_ALERT_KEY,
      "1",
      "EX",
      GLOBAL_WINDOW_SECONDS,
      "NX",
    );

    if (claimed !== "OK") return;

    await enqueueNotification({
      type: "contact-flood",
      max: GLOBAL_MAX,
      windowMinutes: Math.round(GLOBAL_WINDOW_SECONDS / 60),
    });
  } catch (error) {
    // Alerta é observabilidade, não é a defesa. O 429 já foi decidido.
    logApiError("contact-flood-alert", error);
  }
}

/**
 * Decide entre notificação individual e silêncio (o resumo já foi enviado por
 * `alertFloodOnce`). Falha aberta: se o Redis não responde, notifica — errar
 * mandando é melhor que errar calando quando o volume está normal.
 */
async function shouldNotifyIndividually(): Promise<boolean> {
  try {
    return !(await rateLimit(
      "contact:notified",
      NOTIFY_INDIVIDUALLY_MAX,
      NOTIFY_WINDOW_SECONDS,
      "open",
    ));
  } catch {
    return true;
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);
  const ip = getRequestIp(req);

  // ── 02 · Parse defensivo ───────────────────────────────────────────────────
  // O nginx já cortou corpos acima de 8k nesta location; aqui só falta o caso
  // de JSON malformado, que não pode virar 500.
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return badRequestResponse(t("common.invalidBody"));
  }

  if (typeof raw !== "object" || raw === null) {
    return badRequestResponse(t("common.invalidBody"));
  }

  const body = raw as Record<string, unknown>;

  // ── 03 · Honeypot ──────────────────────────────────────────────────────────
  // Campo invisível para gente, irresistível para bot que preenche tudo.
  //
  // A resposta é 201, não 400: devolver erro ensina o autor do bot a ajustar o
  // payload até passar. Um sucesso falso faz ele ir embora satisfeito e nunca
  // descobrir que a mensagem não existiu.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  try {
    // ── 04 · Rate limit por IP ───────────────────────────────────────────────
    // `closed`: se o Redis está fora, recusa. Diferente de /api/wall, que usa
    // `open` porque negar leitura do mural é pior que contar errado. Aqui é o
    // contrário — não conseguir contar é razão suficiente para não aceitar.
    if (
      await rateLimit(
        `contact:ip:${ip}`,
        PER_IP_MAX,
        PER_IP_WINDOW_SECONDS,
        "closed",
      )
    ) {
      return rateLimitResponse(t("contact.rateLimited"));
    }

    // ── 05 · Rate limit global ───────────────────────────────────────────────
    // Só chega aqui o que já passou pelo limite por IP, então o contador mede
    // mensagens que seriam aceitas — não tentativas. É o número que interessa.
    if (
      await rateLimit(
        "contact:global",
        GLOBAL_MAX,
        GLOBAL_WINDOW_SECONDS,
        "closed",
      )
    ) {
      await alertFloodOnce();
      return rateLimitResponse(t("contact.rateLimited"));
    }

    // ── 06 · Turnstile ───────────────────────────────────────────────────────
    // A única chamada de rede do handler, depois de todas as defesas locais.
    const token = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
    const verdict = await verifyTurnstile(token, ip);

    if (!verdict.ok) {
      console.warn(`[Contact] Turnstile recusou: ${verdict.reason}`);
      return forbiddenResponse(t("contact.captchaFailed"));
    }

    // ── 07 · Validação e sanitização ─────────────────────────────────────────
    const parsed = createContactSchema(t).safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error, t("common.invalidRequest"));
    }

    const name = sanitizePlainText(parsed.data.name, CONTACT_LIMITS.nameMax);
    const message = sanitizeMultilineText(
      parsed.data.message,
      CONTACT_LIMITS.messageMax,
    );

    // A sanitização pode esvaziar o que o zod aprovou (uma mensagem só de
    // caracteres de controle, por exemplo). Revalidar o tamanho é barato.
    if (name.length < CONTACT_LIMITS.nameMin) {
      return badRequestResponse(t("contact.nameRequired"));
    }
    if (message.length < CONTACT_LIMITS.messageMin) {
      return badRequestResponse(t("contact.messageTooShort"));
    }

    // ── 08 · Persiste ────────────────────────────────────────────────────────
    // O banco é a fonte da verdade. Notificação é conveniência: se o Telegram
    // estiver fora, a mensagem continua no painel.
    const created = await prisma.contactMessage.create({
      data: {
        name,
        email: parsed.data.email,
        topic: parsed.data.topic,
        message,
        locale: resolveApiLocale(req),
        ipHash: hashIp(ip),
        userAgent: sanitizePlainText(
          req.headers.get("user-agent") ?? "",
          CONTACT_LIMITS.userAgentMax,
        ) || null,
      },
      select: { id: true, name: true, topic: true, message: true },
    });

    // ── Notificação, fora do caminho crítico ─────────────────────────────────
    // Sem `await`: a mensagem já está salva, e nem o visitante deve esperar o
    // BullMQ nem uma falha aqui pode desfazer o que já foi persistido.
    if (await shouldNotifyIndividually()) {
      void enqueueNotification({
        type: "contact",
        id: created.id,
        name: created.name,
        topic: created.topic,
        preview: created.message.slice(0, CONTACT_PREVIEW_LENGTH),
      }).catch((error) => logApiError("contact-notify", error));
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error, t("common.invalidRequest"));
    }

    return internalErrorResponse("contact-create", error, t("common.internalError"));
  }
}
