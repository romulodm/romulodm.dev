import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@romulo/database";
import { requireAdmin } from "@/lib/auth-helpers";
import { forbiddenResponse, internalErrorResponse, unauthorizedResponse, validationErrorResponse } from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { parseJsonBodyWithMessages, RequestValidationError } from "@/lib/api-validation";

function createBanSchema(t: Awaited<ReturnType<typeof getApiTranslator>>) {
  return z.object({
    banned: z.boolean({ required_error: t("common.invalidRequest"), invalid_type_error: t("common.invalidRequest") }),
    banReason: z.string().max(500).optional(),
  });
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const t = await getApiTranslator(req);
  const params = await props.params;
  const auth = await requireAdmin();
  if (!auth.ok)
    return auth.status === 401
      ? unauthorizedResponse(t("common.unauthorized"))
      : forbiddenResponse(t("common.forbidden"));

  try {
    const { banned, banReason } = await parseJsonBodyWithMessages(req, createBanSchema(t), {
      invalidBodyMessage: t("common.invalidBody"),
      fallbackMessage: t("common.invalidRequest"),
    });

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        banned,
        bannedAt: banned ? new Date() : null,
        banReason: banned ? (banReason ?? null) : null,
      },
      select: { id: true, username: true, banned: true, bannedAt: true, banReason: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError)
      return validationErrorResponse(error, t("common.invalidRequest"));
    return internalErrorResponse("admin-ban-user", error, t("common.internalError"));
  }
}