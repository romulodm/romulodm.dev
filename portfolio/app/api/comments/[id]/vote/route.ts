import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@romulo/database";

import { requireAuth } from "@/lib/auth-helpers";
import {
  conflictResponse,
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
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

/**
 * Voting rules:
 * - A comment's score never goes below 0. A downvote is only accepted while the
 *   score without the voter's own vote is above 0, and the stored score is
 *   clamped at 0 to cover concurrent downvotes and retracted upvotes.
 * - Authors cannot vote on their own comments.
 * - Accounts that mostly downvote lose the right to cast new votes. Once a user
 *   has cast at least DOWNVOTE_ABUSE_MIN_VOTES votes, a downvote share at or
 *   above DOWNVOTE_ABUSE_RATIO blocks both upvotes and downvotes. Retracting a
 *   vote (value 0) is always allowed, which is also the way out of the block.
 */
const DOWNVOTE_ABUSE_MIN_VOTES = 5;
const DOWNVOTE_ABUSE_RATIO = 0.8;

async function isDownvoteAbuser(userId: string, commentId: string) {
  // The vote being replaced does not count toward the user's history.
  const where = { userId, commentId: { not: commentId } };
  const [total, downvotes] = await Promise.all([
    prisma.commentVote.count({ where }),
    prisma.commentVote.count({ where: { ...where, value: -1 } }),
  ]);

  return (
    total >= DOWNVOTE_ABUSE_MIN_VOTES &&
    downvotes / total >= DOWNVOTE_ABUSE_RATIO
  );
}

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

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });
    if (!comment) {
      return notFoundResponse(t("comments.notFound"));
    }

    if (value !== 0) {
      if (comment.authorId === userId) {
        return forbiddenResponse(t("comments.ownComment"));
      }

      if (await isDownvoteAbuser(userId, commentId)) {
        return forbiddenResponse(t("comments.votingBlocked"));
      }
    }

    if (value === -1) {
      const others = await prisma.commentVote.aggregate({
        where: { commentId, userId: { not: userId } },
        _sum: { value: true },
      });
      if ((others._sum.value ?? 0) <= 0) {
        return conflictResponse(t("comments.scoreFloor"));
      }
    }

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
    const newScore = Math.max(0, agg._sum.value ?? 0);

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
