import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@romulo/database";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { moderate } from '@/lib/moderation';

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

// PATCH /api/comments/:id
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const comment = await prisma.comment.findUnique({
        where: { id: params.id },
        select: { id: true, authorId: true },
    });

    if (!comment) {
        return NextResponse.json({ error: 'Comentário não encontrado.' }, { status: 404 });
    }

    // Somente o dono pode editar
    if (comment.authorId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { bodyMd } = body;

    if (!bodyMd || typeof bodyMd !== 'string' || !bodyMd.trim()) {
        return NextResponse.json({ error: 'Comentário não pode estar vazio.' }, { status: 400 });
    }
    if (bodyMd.length > 2000) {
        return NextResponse.json({ error: 'Comentário muito longo (máx. 2000 caracteres).' }, { status: 400 });
    }

    const { allowed, reason } = await moderate(bodyMd);

    if (!allowed) {
        // 201 to avoid revealing that the comment was blocked
        return NextResponse.json(
            { id: "pending", bodyMd: bodyMd.trim(), pending: true },
            { status: 201 }
        );
    }

    const updated = await prisma.comment.update({
        where: { id: params.id },
        data: { bodyMd: bodyMd.trim(), editedAt: new Date() },
        include: {
            author: { select: { id: true, username: true, image: true } },
        },
    });

    return NextResponse.json(updated);
}

// DELETE /api/comments/:id
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const comment = await prisma.comment.findUnique({
        where: { id: params.id },
        select: { id: true, authorId: true, postId: true, parentId: true },
    });

    if (!comment) {
        return NextResponse.json({ error: 'Comentário não encontrado.' }, { status: 404 });
    }

    const isOwner = comment.authorId === session.user.id;
    const isAdmin = (session.user as any).admin === true;

    if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Conta quantos comentários serão removidos (o próprio + replies aninhadas)
    // para decrementar commentsCount corretamente
    const descendantCount = await countDescendants(params.id);
    const totalToRemove = 1 + descendantCount;

    // Deleta em cascata (Prisma cuida das replies se tiver onDelete: Cascade no schema)
    await prisma.$transaction([
        prisma.comment.delete({ where: { id: params.id } }),
        prisma.post.update({
            where: { id: comment.postId },
            data: { commentsCount: { decrement: totalToRemove } },
        }),
    ]);

    return NextResponse.json({ ok: true });
}

async function countDescendants(commentId: string): Promise<number> {
    const replies = await prisma.comment.findMany({
        where: { parentId: commentId },
        select: { id: true },
    });

    if (replies.length === 0) return 0;

    const counts = await Promise.all(
        replies.map((r) => countDescendants(r.id))
    );

    return replies.length + counts.reduce((a, b) => a + b, 0);
}