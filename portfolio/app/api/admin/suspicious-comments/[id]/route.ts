import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@romulo/database";

import { requireAdmin } from "@/lib/auth-helpers";
import {
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(req);
  const params = await props.params;
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401
      ? unauthorizedResponse(t("common.unauthorized"))
      : forbiddenResponse(t("common.forbidden"));
  }

  try {
    const suspicious = await prisma.suspiciousComment.findUnique({
      where: { id: params.id },
      include: { post: { select: { id: true } } },
    });
    if (!suspicious) {
      return notFoundResponse(t("admin.suspiciousComments.notFound"));
    }

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          postId: suspicious.postId,
          parentId: suspicious.parentId,
          authorId: suspicious.authorId,
          bodyMd: suspicious.bodyMd,
        },
      });

      await tx.post.update({
        where: { id: suspicious.postId },
        data: { commentsCount: { increment: 1 } },
      });

      await tx.suspiciousComment.delete({ where: { id: params.id } });

      return created;
    });

    return NextResponse.json(comment);
  } catch (error) {
    return internalErrorResponse(
      "admin-suspicious-comments-approve",
      error,
      t("common.internalError"),
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(req);
  const params = await props.params;
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401
      ? unauthorizedResponse(t("common.unauthorized"))
      : forbiddenResponse(t("common.forbidden"));
  }

  try {
    await prisma.suspiciousComment.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return internalErrorResponse(
      "admin-suspicious-comments-delete",
      error,
      t("common.internalError"),
    );
  }
}
