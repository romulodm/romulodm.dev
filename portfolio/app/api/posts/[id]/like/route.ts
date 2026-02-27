import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: Curtir post
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id;
    const { userId } = await req.json();

    if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Toggle like
    const existing = await prisma.postLike.findUnique({
        where: {
            postId_userId: {
                postId: id,
                userId,
            },
        },
    });

    if (existing) {
        // Unlike
        await prisma.postLike.delete({
            where: { id: existing.id },
        });

        await prisma.post.update({
            where: { id: id },
            data: { likes: { decrement: 1 } },
        });

        return NextResponse.json({ liked: false });
    } else {
        // Like
        await prisma.postLike.create({
            data: { postId: id, userId },
        });

        await prisma.post.update({
            where: { id: id },
            data: { likes: { increment: 1 } },
        });

        return NextResponse.json({ liked: true });
    }
}