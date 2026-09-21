import { NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { prisma } from "@romulo/database";
import { requireAuth } from "@/lib/auth-helpers";
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
    parseJsonBodyWithMessages,
    sanitizeMultilineText,
} from "@/lib/api-validation";
import { AVATAR_SELECT } from "@/lib/avatar";
import { enqueueNotification } from '@/lib/queues/notification.queue';
import { moderate } from '@/lib/moderation';
import { getRequestIp, rateLimit } from '@/lib/rate-limit';
import { getApiTranslator } from '@/lib/api-intl';

function createCommentSchema(t: Awaited<ReturnType<typeof getApiTranslator>>) {
    return z.object({
        postId: z.string().trim().min(1, t('comments.postIdRequired')),
        parentId: z.union([z.string().trim().min(1), z.null()]).optional().transform((value) => value ?? null),
        bodyMd: z
            .string({ required_error: t('comments.empty') })
            .transform((value) => sanitizeMultilineText(value, 2000))
            .refine((value) => value.length > 0, t('comments.empty'))
            .refine((value) => value.length <= 2000, t('comments.tooLong')),
    });
}

export async function GET(req: NextRequest) {
    const t = await getApiTranslator(req);
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');
    const sortBy = searchParams.get('sortBy') || 'score';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;
    const skip = (page - 1) * limit;

    if (!postId) {
        return NextResponse.json({ error: t('comments.postIdRequired') }, { status: 400 });
    }

    const orderBy = sortBy === 'score'
        ? [{ score: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];

    const comments = await prisma.comment.findMany({
        where: { postId, parentId: null },
        orderBy,
        skip,
        take: limit,
        include: {
            author: { select: { id: true, username: true } },
            votes: { select: { value: true } },
            replies: {
                include: {
                    author: { select: { id: true, username: true } },
                    votes: { select: { value: true } },
                    replies: {
                        include: {
                            author: { select: { id: true, username: true } },
                            votes: { select: { value: true } },
                            replies: true,
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

export async function POST(request: NextRequest) {
    const t = await getApiTranslator(request);
    const auth = await requireAuth();
    if (!auth.ok) {
        return unauthorizedResponse(t('common.unauthorized'));
    }

    try {
        const ip = getRequestIp(request);
        const limited = await rateLimit(`comments:create:${auth.user.id}:${ip}`, 5, 60);
        if (limited) {
            return rateLimitResponse(t('comments.rateLimited'));
        }

        const user = await prisma.user.findUnique({
            where: { id: auth.user.id },
            select: { banned: true },
        });
        if (user?.banned) {
            return forbiddenResponse(t('comments.cannotComment'));
        }

        const { postId, parentId, bodyMd } = await parseJsonBodyWithMessages(
            request,
            createCommentSchema(t),
            {
                invalidBodyMessage: t('common.invalidBody'),
                fallbackMessage: t('common.invalidRequest'),
            },
        );

        const post = await prisma.post.findUnique({
            where: { id: postId, status: "PUBLISHED" },
            select: {
                id: true,
                slug: true,
                translations: { select: { title: true, locale: true } },
            },
        });
        if (!post) {
            return notFoundResponse(t('comments.postNotFound'));
        }

        if (parentId) {
            const parent = await prisma.comment.findUnique({
                where: { id: parentId },
                select: { id: true },
            });
            if (!parent) {
                return notFoundResponse(t('comments.parentNotFound'));
            }
        }

        const { allowed, reason } = await moderate(bodyMd);

        if (!allowed) {
            await prisma.suspiciousComment.create({
                data: { postId, parentId, authorId: auth.user.id, bodyMd, reason },
            });
            return NextResponse.json(
                { id: "pending", bodyMd, pending: true },
                { status: 201 },
            );
        }

        const comment = await prisma.$transaction(async (tx) => {
            const created = await tx.comment.create({
                data: { postId, parentId, authorId: auth.user.id, bodyMd },
                include: {
                    author: { select: { id: true, ...AVATAR_SELECT } },
                },
            });
            await tx.post.update({
                where: { id: postId },
                data: { commentsCount: { increment: 1 } },
            });
            return created;
        });

        const job = await enqueueNotification({
            type: 'comment',
            id: comment.id,
            author: comment.author.username,
            postTitle: post.translations[0]?.title ?? post.slug,
            postSlug: post.slug,
        });
        console.log(`[Queue] Job publicado: ${job.id}`);

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError || error instanceof RequestValidationError) {
            return validationErrorResponse(error, t('common.invalidRequest'));
        }
        return internalErrorResponse("comments-create", error, t('common.internalError'));
    }
}