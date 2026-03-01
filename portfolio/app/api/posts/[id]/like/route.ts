// app/api/posts/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST: Toggle like no post (atômico via transaction)
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const postId = params.id;
    const userId = session.user.id;

    try {
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
        console.error('Like error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET: Verificar se usuário curtiu o post
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ liked: false });
    }

    const postId = params.id;
    const userId = session.user.id;

    const existing = await prisma.postLike.findUnique({
        where: { postId_userId: { postId, userId } },
    });

    return NextResponse.json({ liked: !!existing });
}