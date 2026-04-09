// app/api/comments/[id]/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@romulo/database";
import { requireAuth } from "@/lib/auth";
import {
    internalErrorResponse,
    rateLimitResponse,
    unauthorizedResponse,
    validationErrorResponse,
} from "@/lib/api-errors";
import {
    RequestValidationError,
    parseJsonBody,
} from "@/lib/api-validation";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

const voteSchema = z.object({
    value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await requireAuth();
    if (!auth.ok) {
        return unauthorizedResponse();
    }

    try {
        const limited = await rateLimit(
            `comments:vote:${auth.user.id}:${params.id}:${getRequestIp(request)}`,
            30,
            60,
        );
        if (limited) {
            return rateLimitResponse();
        }

        const { value } = await parseJsonBody(request, voteSchema);
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
            return validationErrorResponse(error);
        }

        return internalErrorResponse("comments-vote", error);
    }
}
