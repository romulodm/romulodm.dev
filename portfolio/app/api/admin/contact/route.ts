/**
 * GET /api/admin/contact — listagem paginada das mensagens de contato.
 *
 * Mesmo molde de `app/api/admin/suspicious-comments/route.ts`: `requireAdmin`,
 * tradutor de API e `internalErrorResponse` para não vazar stack.
 *
 * Os filtros (status, tópico, busca) são combinados com AND. Todos são
 * opcionais, e ausência significa "qualquer valor" — não "nenhum".
 */

import { NextRequest, NextResponse } from "next/server";

import { prisma, type Prisma } from "@romulo/database";

import { requireAdmin } from "@/lib/auth-helpers";
import {
  forbiddenResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import {
  CONTACT_STATUSES,
  CONTACT_TOPICS,
  type ContactStatusValue,
  type ContactTopicValue,
} from "@/lib/contact";

const PAGE_SIZE = 20;
const MAX_SEARCH_LENGTH = 120;

/**
 * Valor fora do enum vira `null` (= sem filtro) em vez de erro. Um link antigo
 * ou um parâmetro digitado à mão não deve virar 500.
 */
function parseStatus(value: string | null): ContactStatusValue | null {
  return CONTACT_STATUSES.includes(value as ContactStatusValue)
    ? (value as ContactStatusValue)
    : null;
}

function parseTopic(value: string | null): ContactTopicValue | null {
  return CONTACT_TOPICS.includes(value as ContactTopicValue)
    ? (value as ContactTopicValue)
    : null;
}

export async function GET(req: NextRequest) {
  const t = await getApiTranslator(req);

  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401
      ? unauthorizedResponse(t("common.unauthorized"))
      : forbiddenResponse(t("common.forbidden"));
  }

  try {
    const params = req.nextUrl.searchParams;

    // Página inválida ou negativa vira 1: `skip` negativo estoura no Prisma.
    const rawPage = Number.parseInt(params.get("page") ?? "1", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

    const status = parseStatus(params.get("status"));
    const topic = parseTopic(params.get("topic"));
    const search = (params.get("search") ?? "").trim().slice(0, MAX_SEARCH_LENGTH);

    const where: Prisma.ContactMessageWhereInput = {
      ...(status ? { status } : {}),
      ...(topic ? { topic } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { message: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total, unread] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
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
        },
      }),
      prisma.contactMessage.count({ where }),
      // Fora do `where` de propósito: o contador de não lidas é global, senão
      // ele mudaria conforme o filtro e deixaria de servir como badge.
      prisma.contactMessage.count({ where: { status: "RECEIVED" } }),
    ]);

    return NextResponse.json({
      items,
      unread,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      },
    });
  } catch (error) {
    return internalErrorResponse(
      "admin-contact-list",
      error,
      t("common.internalError"),
    );
  }
}
