import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@romulo/database";
import { requireAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status });

    const posts = await prisma.post.findMany({ select: { id: true } });

    await Promise.all(
        posts.map(async ({ id }) => {
            const count = await prisma.comment.count({ where: { postId: id } });
            return prisma.post.update({
                where: { id },
                data: { commentsCount: count },
            });
        })
    );

    return NextResponse.json({ ok: true, synced: posts.length });
}