import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@romulo/database";

import { requireAuth } from "@/lib/auth-helpers";
import {
  internalErrorResponse,
  rateLimitResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/api-errors";
import {
  RequestValidationError,
  parseJsonBodyWithMessages,
} from "@/lib/api-validation";
import { getApiTranslator } from "@/lib/api-intl";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

function createVoteSchema(t: Awaited<ReturnType<typeof getApiTranslator>>) {
  return z.object({
    value: z.coerce
      .number()
      .refine((value) => [-1, 0, 1].includes(value), t("comments.invalidVote")),
  });
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(request);
  const params = await props.params;
  const auth = await requireAuth();

  if (!auth.ok) {
    return unauthorizedResponse(t("common.unauthorized"));
  }

  try {
    const limited = await rateLimit(
      `comments:vote:${auth.user.id}:${params.id}:${getRequestIp(request)}`,
      30,
      60,
    );
    if (limited) {
      return rateLimitResponse(t("comments.rateLimited"));
    }

    const { value } = await parseJsonBodyWithMessages(
      request,
      createVoteSchema(t),
      {
        invalidBodyMessage: t("common.invalidBody"),
        fallbackMessage: t("common.invalidRequest"),
      },
    );
    const commentId = params.id;
    const userId = auth.user.id;

    if (value === 0) {
      await prisma.commentVote.deleteMany({ where: { commentId, userId } });
    } else {
      await prisma.commentVote.upsert({
        where: { commentId_userId: { commentId, userId } },
        create: { commentId, userId, value },
        update: { value },
      });
    }

    const agg = await prisma.commentVote.aggregate({
      where: { commentId },
      _sum: { value: true },
    });
    const newScore = agg._sum.value ?? 0;

    await prisma.comment.update({
      where: { id: commentId },
      data: { score: newScore },
    });

    return NextResponse.json({ score: newScore });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error, t("common.invalidRequest"));
    }

    return internalErrorResponse(
      "comments-vote",
      error,
      t("common.internalError"),
    );
  }
}
