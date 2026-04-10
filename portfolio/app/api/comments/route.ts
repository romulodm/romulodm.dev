// app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { prisma } from "@romulo/database";
import { requireAuth } from "@/lib/auth";
import {
    forbiddenResponse,
    internalErrorResponse,
    notFoundResponse,
    rateLimitResponse,
    unauthorizedResponse,
    validationErrorResponse,
} from "@/lib/api-errors";
import {
    RequestValidationError,
    parseJsonBody,
    sanitizeMultilineText,
} from "@/lib/api-validation";
import { notificationQueue } from '@/lib/queues/notification.queue';
import { moderate } from '@/lib/moderation';
import { getRequestIp, rateLimit } from '@/lib/rate-limit';
import { buildNotificationJobId, notificationJobOptions } from "@romulo/queues";

const createCommentSchema = z.object({
    postId: z.string().trim().min(1, "postId é obrigatório."),
    parentId: z.union([z.string().trim().min(1), z.null()]).optional().transform((value) => value ?? null),
    bodyMd: z
        .string({ required_error: "Comentário não pode estar vazio." })
        .transform((value) => sanitizeMultilineText(value, 2000))
        .refine((value) => value.length > 0, "Comentário não pode estar vazio.")
        .refine((value) => value.length <= 2000, "Comentário muito longo (máx. 2000 caracteres)."),
});

// GET: Pegar comentários por relevância ou data
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');
    const sortBy = searchParams.get('sortBy') || 'score'; // 'score' ou 'createdAt'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;
    const skip = (page - 1) * limit;

    if (!postId) {
        return NextResponse.json({ error: 'postId required' }, { status: 400 });
    }

    // Buscar apenas comentários raiz (sem parentId)
    const orderBy = sortBy === 'score'
        ? [{ score: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];

    const comments = await prisma.comment.findMany({
        where: {
            postId,
            parentId: null, // Apenas raiz
        },
        orderBy,
        skip,
        take: limit,
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
                    replies: {
                        include: {
                            author: {
                                select: { id: true, username: true, email: true },
                            },
                            votes: true,
                            replies: true, // Mais níveis se necessário
                        },
                    },
                },
            },
        },
    });

    const total = await prisma.comment.count({
        where: { postId, parentId: null },
    });

    return NextResponse.json({
        comments,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });
}

// POST: Criar comentário
export async function POST(request: NextRequest) {
    const auth = await requireAuth();
    if (!auth.ok) {
        return unauthorizedResponse();
    }

    try {
        const ip = getRequestIp(request);
        const limited = await rateLimit(`comments:create:${auth.user.id}:${ip}`, 5, 60);
        if (limited) {
            return rateLimitResponse("Muitos comentários em pouco tempo. Aguarde um momento.");
        }

        const user = await prisma.user.findUnique({
            where: { id: auth.user.id },
            select: { banned: true },
        });
        if (user?.banned) {
            return forbiddenResponse("Você não pode comentar.");
        }

        const { postId, parentId, bodyMd } = await parseJsonBody(request, createCommentSchema);

        const post = await prisma.post.findUnique({
            where: { id: postId, status: "PUBLISHED" },
            select: {
                id: true,
                slug: true,
                translations: {
                    select: { title: true, locale: true },
                },
            },
        });
        if (!post) {
            return notFoundResponse("Post não encontrado.");
        }

        if (parentId) {
            const parent = await prisma.comment.findUnique({
                where: { id: parentId },
                select: { id: true },
            });
            if (!parent) {
                return notFoundResponse("Comentário pai não encontrado.");
            }
        }

        const { allowed, reason } = await moderate(bodyMd);

        if (!allowed) {
            await prisma.suspiciousComment.create({
                data: {
                    postId,
                    parentId,
                    authorId: auth.user.id,
                    bodyMd,
                    reason,
                },
            });

            return NextResponse.json(
                { id: "pending", bodyMd, pending: true },
                { status: 201 }
            );
        }

        const comment = await prisma.$transaction(async (tx) => {
            const created = await tx.comment.create({
                data: {
                    postId,
                    parentId,
                    authorId: auth.user.id,
                    bodyMd,
                },
                include: {
                    author: { select: { id: true, username: true, image: true } },
                },
            });

            await tx.post.update({
                where: { id: postId },
                data: { commentsCount: { increment: 1 } },
            });

            return created;
        });

        const notificationJob = {
            type: 'comment' as const,
            id: comment.id,
            author: comment.author.username,
            postTitle: post.translations[0]?.title ?? post.slug,
            postSlug: post.slug,
        };
        const job = await notificationQueue.add('comment', notificationJob, {
            ...notificationJobOptions,
            jobId: buildNotificationJobId(notificationJob),
        });
        console.log(`[Queue] Job publicado: ${job.id}`);

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError || error instanceof RequestValidationError) {
            return validationErrorResponse(error);
        }

        return internalErrorResponse("comments-create", error);
    }
}
