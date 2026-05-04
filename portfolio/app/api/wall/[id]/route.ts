import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@romulo/database";

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Next.js 15: params é Promise — precisa awaitar
    const { id } = await params;

    const msg = await prisma.wallMessage.findUnique({
        where: { id },
        select: { authorId: true },
    });

    if (!msg) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { admin: true },
    });

    const isOwner = msg.authorId === session.user.id;
    const isAdmin = dbUser?.admin === true;

    if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.wallMessage.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
}