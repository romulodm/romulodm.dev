import { NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { prisma } from "@romulo/database";
import { requireOwnerOrAdmin } from '@/lib/auth';
import {
    forbiddenResponse,
    internalErrorResponse,
    notFoundResponse,
    unauthorizedResponse,
    validationErrorResponse,
} from "@/lib/api-errors";
import {
    RequestValidationError,
    parseJsonBody,
    sanitizeMultilineText,
} from "@/lib/api-validation";
import { moderate } from '@/lib/moderation';

const updateCommentSchema = z.object({
    bodyMd: z
        .string({ required_error: "Comentário não pode estar vazio." })
        .transform((value) => sanitizeMultilineText(value, 2000))
        .refine((value) => value.length > 0, "Comentário não pode estar vazio.")
        .refine((value) => value.length <= 2000, "Comentário muito longo (máx. 2000 caracteres)."),
});

// GET: Montar tree individual de um comentário específico
export async function GET(
    _req: NextRequest,
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
        return notFoundResponse('Comentário não encontrado.');
    }

    return NextResponse.json(comment);
}

// PATCH /api/comments/:id
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const comment = await prisma.comment.findUnique({
            where: { id: params.id },
            select: { id: true, authorId: true },
        });

        if (!comment) {
            return notFoundResponse('Comentário não encontrado.');
        }

        const auth = await requireOwnerOrAdmin(comment.authorId);
        if (!auth.ok) {
            return auth.status === 401
                ? unauthorizedResponse('Autenticação necessária.')
                : forbiddenResponse('Acesso negado.');
        }

        const { bodyMd } = await parseJsonBody(req, updateCommentSchema);
        const { allowed } = await moderate(bodyMd);

        if (!allowed) {
            return NextResponse.json(
                { id: "pending", bodyMd, pending: true },
                { status: 201 }
            );
        }

        const updated = await prisma.comment.update({
            where: { id: params.id },
            data: { bodyMd, editedAt: new Date() },
            include: {
                author: { select: { id: true, username: true, image: true } },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError || error instanceof RequestValidationError) {
            return validationErrorResponse(error);
        }

        return internalErrorResponse("comments-update", error);
    }
}

// DELETE /api/comments/:id
export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const comment = await prisma.comment.findUnique({
            where: { id: params.id },
            select: { id: true, authorId: true, postId: true, parentId: true },
        });

        if (!comment) {
            return notFoundResponse('Comentário não encontrado.');
        }

        const auth = await requireOwnerOrAdmin(comment.authorId);
        if (!auth.ok) {
            return auth.status === 401
                ? unauthorizedResponse('Autenticação necessária.')
                : forbiddenResponse('Acesso negado.');
        }

        const descendantCount = await countDescendants(params.id);
        const totalToRemove = 1 + descendantCount;

        await prisma.$transaction([
            prisma.comment.delete({ where: { id: params.id } }),
            prisma.post.update({
                where: { id: comment.postId },
                data: { commentsCount: { decrement: totalToRemove } },
            }),
        ]);

        return NextResponse.json({ ok: true });
    } catch (error) {
        return internalErrorResponse("comments-delete", error);
    }
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
