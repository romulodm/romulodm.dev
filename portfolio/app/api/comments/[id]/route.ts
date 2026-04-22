import { NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { prisma } from "@romulo/database";
import { requireOwnerOrAdmin } from '@/lib/auth-helpers';
import {
    forbiddenResponse,
    internalErrorResponse,
    notFoundResponse,
    unauthorizedResponse,
    validationErrorResponse,
} from "@/lib/api-errors";
import {
    RequestValidationError,
    parseJsonBodyWithMessages,
    sanitizeMultilineText,
} from "@/lib/api-validation";
import { moderate } from '@/lib/moderation';
import { getApiTranslator } from '@/lib/api-intl'

function createUpdateCommentSchema(t: Awaited<ReturnType<typeof getApiTranslator>>) {
    return z.object({
        bodyMd: z
            .string({ required_error: t('comments.empty') })
            .transform((value) => sanitizeMultilineText(value, 2000))
            .refine((value) => value.length > 0, t('comments.empty'))
            .refine((value) => value.length <= 2000, t('comments.tooLong')),
    });
}

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const t = await getApiTranslator(req)
    const params = await props.params;
    const commentId = params.id;

    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
            author: {
                select: { id: true, username: true },
            },
            votes: {
                select: { value: true },
            },
            parent: {
                include: {
                    author: {
                        select: { id: true, username: true },
                    },
                },
            },
            replies: {
                include: {
                    author: {
                        select: { id: true, username: true },
                    },
                    votes: {
                        select: { value: true },
                    },
                    replies: {
                        include: {
                            author: {
                                select: { id: true, username: true },
                            },
                            votes: {
                                select: { value: true },
                            },
                            replies: true,
                        },
                    },
                },
            },
        },
    });

    if (!comment) {
        return notFoundResponse(t('comments.commentNotFound'));
    }

    return NextResponse.json(comment);
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const t = await getApiTranslator(req)
    const params = await props.params;
    try {
        const comment = await prisma.comment.findUnique({
            where: { id: params.id },
            select: { id: true, authorId: true },
        });

        if (!comment) {
            return notFoundResponse(t('comments.commentNotFound'));
        }

        const auth = await requireOwnerOrAdmin(comment.authorId);
        if (!auth.ok) {
            return auth.status === 401
                ? unauthorizedResponse(t('common.unauthorized'))
                : forbiddenResponse(t('common.forbidden'));
        }

        const { bodyMd } = await parseJsonBodyWithMessages(req, createUpdateCommentSchema(t), {
            invalidBodyMessage: t('common.invalidBody'),
            fallbackMessage: t('common.invalidRequest'),
        });
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
            return validationErrorResponse(error, t('common.invalidRequest'));
        }

        return internalErrorResponse("comments-update", error, t('common.internalError'));
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const t = await getApiTranslator(req)
    const params = await props.params;
    try {
        const comment = await prisma.comment.findUnique({
            where: { id: params.id },
            select: { id: true, authorId: true, postId: true, parentId: true },
        });

        if (!comment) {
            return notFoundResponse(t('comments.commentNotFound'));
        }

        const auth = await requireOwnerOrAdmin(comment.authorId);
        if (!auth.ok) {
            return auth.status === 401
                ? unauthorizedResponse(t('common.unauthorized'))
                : forbiddenResponse(t('common.forbidden'));
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
        return internalErrorResponse("comments-delete", error, t('common.internalError'));
    }
}

async function countDescendants(commentId: string): Promise<number> {
    const replies = await prisma.comment.findMany({
        where: { parentId: commentId },
        select: { id: true },
    });

    if (replies.length === 0) return 0;

    const counts = await Promise.all(
        replies.map((reply) => countDescendants(reply.id))
    );

    return replies.length + counts.reduce((accumulator, current) => accumulator + current, 0);
}
