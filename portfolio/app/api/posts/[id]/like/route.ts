import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@romulo/database";

import { requireAuth } from "@/lib/auth-helpers";
import {
  internalErrorResponse,
  rateLimitResponse,
  unauthorizedResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(req);
  const params = await props.params;
  const auth = await requireAuth();

  if (!auth.ok) {
    return unauthorizedResponse(t("common.unauthorized"));
  }

  const postId = params.id;
  const userId = auth.user.id;

  try {
    const limited = await rateLimit(
      `posts:like:${userId}:${postId}:${getRequestIp(req)}`,
      30,
      60,
    );
    if (limited) {
      return rateLimitResponse(t("common.rateLimited"));
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.postLike.findUnique({
        where: { postId_userId: { postId, userId } },
      });

      if (existing) {
        await tx.postLike.delete({ where: { id: existing.id } });
        const updated = await tx.post.update({
          where: { id: postId },
          data: { likes: { decrement: 1 } },
          select: { likes: true },
        });
        return { liked: false, likes: Math.max(0, updated.likes) };
      }

      await tx.postLike.create({ data: { postId, userId } });
      const updated = await tx.post.update({
        where: { id: postId },
        data: { likes: { increment: 1 } },
        select: { likes: true },
      });
      return { liked: true, likes: updated.likes };
    });

    return NextResponse.json(result);
  } catch (error) {
    return internalErrorResponse("posts-like", error, t("common.internalError"));
  }
}

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const auth = await requireAuth();
  if (!auth.ok) {
    return NextResponse.json({ liked: false });
  }

  const postId = params.id;
  const userId = auth.user.id;

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  return NextResponse.json({ liked: !!existing });
}
