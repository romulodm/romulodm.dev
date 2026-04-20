import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@romulo/database";

import { requireAdmin } from "@/lib/auth-helpers";
import {
  forbiddenResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";

export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401
      ? unauthorizedResponse(t("common.unauthorized"))
      : forbiddenResponse(t("common.forbidden"));
  }

  try {
    const posts = await prisma.post.findMany({ select: { id: true } });

    await Promise.all(
      posts.map(async ({ id }) => {
        const count = await prisma.comment.count({ where: { postId: id } });
        return prisma.post.update({
          where: { id },
          data: { commentsCount: count },
        });
      }),
    );

    return NextResponse.json({ ok: true, synced: posts.length });
  } catch (error) {
    return internalErrorResponse(
      "admin-comments-resync",
      error,
      t("common.internalError"),
    );
  }
}
