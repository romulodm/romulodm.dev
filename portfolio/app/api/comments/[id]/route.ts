import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Montar tree individual de um comentário específico
export async function GET(
    req: NextRequest,
    { params }: { params: { commentId: string } }
) {
    const commentId = params.commentId;

    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
            author: {
                select: { id: true, username: true, email: true },
            },
            votes: true,
            parent: {
                include: {
                    author: {
                        select: { id: true, username: true, email: true },
                    },
                },
            },
            replies: {
                include: {
                    author: {
                        select: { id: true, username: true, email: true },
                    },
                    votes: true,
                    replies: {
                        include: {
                            author: {
                                select: { id: true, username: true, email: true },
                            },
                            votes: true,
                            replies: true,
                        },
                    },
                },
            },
        },
    });

    if (!comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json(comment);
}

// PATCH: Atualizar comentário
export async function PATCH(
    req: NextRequest,
    { params }: { params: { commentId: string } }
) {
    const commentId = params.commentId;
    const { bodyMd, authorId } = await req.json();

    if (!bodyMd) {
        return NextResponse.json({ error: 'bodyMd required' }, { status: 400 });
    }

    // Verificar se é o autor
    const existing = await prisma.comment.findUnique({
        where: { id: commentId },
    });

    if (!existing || existing.authorId !== authorId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const comment = await prisma.comment.update({
        where: { id: commentId },
        data: { bodyMd },
        include: {
            author: {
                select: { id: true, username: true, email: true },
            },
        },
    });

    return NextResponse.json(comment);
}

// DELETE: Deletar comentário
export async function DELETE(
    req: NextRequest,
    { params }: { params: { commentId: string } }
) {
    const commentId = params.commentId;
    const { searchParams } = new URL(req.url);
    const authorId = searchParams.get('authorId');

    if (!authorId) {
        return NextResponse.json({ error: 'authorId required' }, { status: 400 });
    }

    const existing = await prisma.comment.findUnique({
        where: { id: commentId },
    });

    if (!existing || existing.authorId !== authorId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.comment.delete({
        where: { id: commentId },
    });

    return NextResponse.json({ success: true });
}