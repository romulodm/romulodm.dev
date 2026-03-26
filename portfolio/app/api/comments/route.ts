// app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@romulo/database";
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import { notificationQueue } from '@/lib/queues/notification.queue';

// In-memory rate limiter: userId -> timestamps[]
const rateLimitMap = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

function isRateLimited(userId: string): boolean {
    const now = Date.now();
    const prev = rateLimitMap.get(userId) ?? [];
    const recent = prev.filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    rateLimitMap.set(userId, recent);
    return recent.length > MAX_REQUESTS;
}

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
    // ── Auth ─────────────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limit ────────────────────────────────────────────────────────────
    if (isRateLimited(session.user.id)) {
        return NextResponse.json(
            { error: "Muitos comentários em pouco tempo. Aguarde um momento." },
            { status: 429 }
        );
    }

    // ── Body parsing — guard against empty/malformed body ────────────────────
    let body: { postId?: string; parentId?: string | null; bodyMd?: string };
    try {
        const text = await request.text();
        if (!text || text.trim() === "") {
            return NextResponse.json({ error: "Corpo da requisição vazio." }, { status: 400 });
        }
        body = JSON.parse(text);
    } catch {
        return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }

    const { postId, parentId, bodyMd } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!postId || typeof postId !== "string") {
        return NextResponse.json({ error: "postId é obrigatório." }, { status: 400 });
    }
    if (!bodyMd || typeof bodyMd !== "string" || !bodyMd.trim()) {
        return NextResponse.json({ error: "Comentário não pode estar vazio." }, { status: 400 });
    }
    if (bodyMd.length > 2000) {
        return NextResponse.json({ error: "Comentário muito longo (máx. 2000 caracteres)." }, { status: 400 });
    }

    // ── Validate post ─────────────────────────────────────────────────────────
    const post = await prisma.post.findUnique({
        where: { id: postId, status: "PUBLISHED" },
        select: {
            id: true,
            slug: true,
            title: true
        },
    });
    if (!post) {
        return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
    }

    // ── Validate parent ───────────────────────────────────────────────────────
    if (parentId) {
        const parent = await prisma.comment.findUnique({
            where: { id: parentId },
            select: { id: true },
        });
        if (!parent) {
            return NextResponse.json({ error: "Comentário pai não encontrado." }, { status: 404 });
        }
    }

    // ── Create ────────────────────────────────────────────────────────────────
    const comment = await prisma.$transaction(async (tx) => {
        const created = await tx.comment.create({
            data: {
                postId,
                parentId: parentId ?? null,
                authorId: session.user.id,
                bodyMd: bodyMd.trim(),
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

    const job = await notificationQueue.add('comment', {
        type: 'comment',
        author: comment.author.username,
        postTitle: post.title,
        postSlug: post.slug,
    })
    console.log(`[Queue] Job publicado: ${job.id}`)

    return NextResponse.json(comment, { status: 201 });
}