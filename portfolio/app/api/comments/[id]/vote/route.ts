// app/api/comments/[id]/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@romulo/database";

const voteRateLimit = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_VOTES = 30;

function isRateLimited(userId: string): boolean {
    const now = Date.now();
    const timestamps = voteRateLimit.get(userId) ?? [];
    const recent = timestamps.filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    voteRateLimit.set(userId, recent);
    return recent.length > MAX_VOTES;
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isRateLimited(session.user.id)) {
        return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
    }

    const { value } = await request.json(); // +1, -1 or 0
    if (![1, -1, 0].includes(value)) {
        return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
    }

    const commentId = params.id;
    const userId = session.user.id;

    if (value === 0) {
        await prisma.commentVote.deleteMany({ where: { commentId, userId } });
    } else {
        await prisma.commentVote.upsert({
            where: { commentId_userId: { commentId, userId } },
            create: { commentId, userId, value },
            update: { value },
        });
    }

    const agg = await prisma.commentVote.aggregate({
        where: { commentId },
        _sum: { value: true },
    });
    const newScore = agg._sum.value ?? 0;

    await prisma.comment.update({
        where: { id: commentId },
        data: { score: newScore },
    });

    return NextResponse.json({ score: newScore });
}