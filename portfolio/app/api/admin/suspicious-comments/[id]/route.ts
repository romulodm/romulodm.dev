import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@romulo/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function requireAdmin(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { admin: true },
    });
    return user?.admin ? session : null;
}

// POST /api/admin/suspicious-comments/[id] → aprova (vira comentário real)
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await requireAdmin(req);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const suspicious = await prisma.suspiciousComment.findUnique({
        where: { id: params.id },
        include: { post: { select: { id: true } } },
    });
    if (!suspicious) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
}

// DELETE /api/admin/suspicious-comments/[id] → rejeita e exclui
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await requireAdmin(req);
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.suspiciousComment.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
}