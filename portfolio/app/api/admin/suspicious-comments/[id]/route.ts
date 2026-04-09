import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@romulo/database";
import { requireAdmin } from "@/lib/auth";
import {
    forbiddenResponse,
    internalErrorResponse,
    notFoundResponse,
    unauthorizedResponse,
} from "@/lib/api-errors";

// POST /api/admin/suspicious-comments/[id] → aprova (vira comentário real)
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await requireAdmin();
    if (!auth.ok) {
        return auth.status === 401 ? unauthorizedResponse() : forbiddenResponse();
    }

    try {
        const suspicious = await prisma.suspiciousComment.findUnique({
            where: { id: params.id },
            include: { post: { select: { id: true } } },
        });
        if (!suspicious) {
            return notFoundResponse("Comentário suspeito não encontrado.");
        }

        const comment = await prisma.$transaction(async (tx) => {
            const created = await tx.comment.create({
                data: {
                    postId: suspicious.postId,
                    parentId: suspicious.parentId,
                    authorId: suspicious.authorId,
                    bodyMd: suspicious.bodyMd,
                },
            });

            await tx.post.update({
                where: { id: suspicious.postId },
                data: { commentsCount: { increment: 1 } },
            });

            await tx.suspiciousComment.delete({ where: { id: params.id } });

            return created;
        });

        return NextResponse.json(comment);
    } catch (error) {
        return internalErrorResponse("admin-suspicious-comments-approve", error);
    }
}

// DELETE /api/admin/suspicious-comments/[id] → rejeita e exclui
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await requireAdmin();
    if (!auth.ok) {
        return auth.status === 401 ? unauthorizedResponse() : forbiddenResponse();
    }

    try {
        await prisma.suspiciousComment.delete({ where: { id: params.id } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return internalErrorResponse("admin-suspicious-comments-delete", error);
    }
}
