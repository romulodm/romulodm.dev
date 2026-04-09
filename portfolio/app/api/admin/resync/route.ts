import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@romulo/database";
import { requireAdmin } from '@/lib/auth';
import {
    forbiddenResponse,
    internalErrorResponse,
    unauthorizedResponse,
} from "@/lib/api-errors";

export async function POST(_req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) {
        return auth.status === 401 ? unauthorizedResponse() : forbiddenResponse();
    }

    try {
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
    } catch (error) {
        return internalErrorResponse("admin-comments-resync", error);
    }
}
