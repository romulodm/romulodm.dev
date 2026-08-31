/**
 * GET    /api/admin/contact/[id] — uma mensagem só, pelo id.
 * PATCH  /api/admin/contact/[id] — muda o status de uma mensagem.
 * DELETE /api/admin/contact/[id] — apaga de vez.
 *
 * O GET existe por causa do link direto (`/admin/contact?message=<id>`), que
 * chega do Telegram. Não dá para resolver esse id na listagem: ela é paginada e
 * filtrada, e a mensagem linkada pode estar na página 7 ou fora do filtro atual.
 *
 * O status carrega um timestamp junto. Guardar `readAt`/`repliedAt`/`closedAt`
 * em vez de só o estado atual é o que permite, depois, responder "quanto tempo
 * eu levo para responder alguém?" — pergunta que o estado sozinho não responde.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma, type Prisma } from "@romulo/database";

import { requireAdmin } from "@/lib/auth-helpers";
import {
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import {
  parseJsonBodyWithMessages,
  RequestValidationError,
} from "@/lib/api-validation";
import { CONTACT_STATUSES, type ContactStatusValue } from "@/lib/contact";

function createStatusSchema(t: Awaited<ReturnType<typeof getApiTranslator>>) {
  return z.object({
    status: z.enum(CONTACT_STATUSES, {
      required_error: t("common.invalidRequest"),
      invalid_type_error: t("common.invalidRequest"),
    }),
  });
}

/**
 * Timestamps derivados do status.
 *
 * `readAt` é acumulativo: qualquer status adiante de RECEIVED implica que a
 * mensagem foi lida, então ele é preenchido se ainda estiver vazio e nunca é
 * apagado. `repliedAt` e `closedAt` são específicos e voltam a `null` quando o
 * status sai daquele estado — o que mantém o dado honesto se você reabrir algo
 * por engano.
 */
function timestampsFor(
  status: ContactStatusValue,
  current: { readAt: Date | null },
): Prisma.ContactMessageUpdateInput {
  const now = new Date();
  const readAt = status === "RECEIVED" ? current.readAt : (current.readAt ?? now);

  return {
    status,
    readAt,
    repliedAt: status === "REPLIED" ? now : null,
    closedAt: status === "CLOSED" || status === "SPAM" ? now : null,
  };
}

/**
 * O `select` é o mesmo da listagem de propósito: o modal do painel monta a
 * partir de qualquer uma das duas origens, e um campo a menos aqui só apareceria
 * como buraco na tela quando aberto pelo link.
 */
const MESSAGE_SELECT = {
  id: true,
  name: true,
  email: true,
  topic: true,
  message: true,
  status: true,
  locale: true,
  createdAt: true,
  readAt: true,
  repliedAt: true,
  closedAt: true,
} as const;

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(req);
  const { id } = await props.params;

  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401
      ? unauthorizedResponse(t("common.unauthorized"))
      : forbiddenResponse(t("common.forbidden"));
  }

  try {
    const message = await prisma.contactMessage.findUnique({
      where: { id },
      select: MESSAGE_SELECT,
    });

    // 404 e o caso esperado, nao excecao: link de uma mensagem ja apagada.
    if (!message) return notFoundResponse(t("common.notFound"));

    return NextResponse.json(message);
  } catch (error) {
    return internalErrorResponse(
      "admin-contact-get",
      error,
      t("common.internalError"),
      { id },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(req);
  const { id } = await props.params;

  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401
      ? unauthorizedResponse(t("common.unauthorized"))
      : forbiddenResponse(t("common.forbidden"));
  }

  try {
    const { status } = await parseJsonBodyWithMessages(
      req,
      createStatusSchema(t),
      {
        invalidBodyMessage: t("common.invalidBody"),
        fallbackMessage: t("common.invalidRequest"),
      },
    );

    // Lê antes de escrever porque `readAt` depende do valor atual. Duas idas ao
    // banco, mas este endpoint é usado por uma pessoa clicando — não é caminho
    // quente e a legibilidade vale mais que a ida economizada.
    const existing = await prisma.contactMessage.findUnique({
      where: { id },
      select: { readAt: true },
    });

    if (!existing) return notFoundResponse(t("common.notFound"));

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: timestampsFor(status, existing),
      select: {
        id: true,
        status: true,
        readAt: true,
        repliedAt: true,
        closedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error, t("common.invalidRequest"));
    }

    return internalErrorResponse(
      "admin-contact-update",
      error,
      t("common.internalError"),
      { id },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(req);
  const { id } = await props.params;

  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401
      ? unauthorizedResponse(t("common.unauthorized"))
      : forbiddenResponse(t("common.forbidden"));
  }

  try {
    // `deleteMany` em vez de `delete`: apagar algo que já não existe devolve
    // count 0 em vez de estourar P2025. Deleção é idempotente por natureza, e
    // um duplo clique no painel não deve virar erro na tela.
    const { count } = await prisma.contactMessage.deleteMany({ where: { id } });

    if (count === 0) return notFoundResponse(t("common.notFound"));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return internalErrorResponse(
      "admin-contact-delete",
      error,
      t("common.internalError"),
      { id },
    );
  }
}
