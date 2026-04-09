// app/api/posts/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@romulo/database";
import { requireAuth } from '@/lib/auth';
import {
    internalErrorResponse,
    rateLimitResponse,
    unauthorizedResponse,
} from "@/lib/api-errors";
import { getRequestIp, rateLimit } from '@/lib/rate-limit';

// POST: Toggle like no post (atômico via transaction)
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await requireAuth();
    if (!auth.ok) {
        return unauthorizedResponse();
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
            return rateLimitResponse();
        }

        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.postLike.findUnique({
                where: { postId_userId: { postId, userId } },
            });

            if (existing) {
                // Unlike: remove like e decrementa contador atomicamente
                await tx.postLike.delete({ where: { id: existing.id } });
                const updated = await tx.post.update({
                    where: { id: postId },
                    data: { likes: { decrement: 1 } },
                    select: { likes: true },
                });
                return { liked: false, likes: Math.max(0, updated.likes) };
            } else {
                // Like: cria like e incrementa contador atomicamente
                await tx.postLike.create({ data: { postId, userId } });
                const updated = await tx.post.update({
                    where: { id: postId },
                    data: { likes: { increment: 1 } },
                    select: { likes: true },
                });
                return { liked: true, likes: updated.likes };
            }
        });

        return NextResponse.json(result);
    } catch (error) {
        return internalErrorResponse('posts-like', error);
    }
}

// GET: Verificar se usuário curtiu o post
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
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
