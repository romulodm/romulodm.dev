import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@romulo/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { admin: true },
    });
    if (!admin?.admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { banned }: { banned: boolean } = await req.json();

    const updated = await prisma.user.update({
        where: { id: params.id },
        data: {
            banned,
            bannedAt: banned ? new Date() : null,
        },
        select: { id: true, username: true, banned: true, bannedAt: true },
    });

    return NextResponse.json(updated);
}