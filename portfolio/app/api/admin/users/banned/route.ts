import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@romulo/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { admin: true },
    });
    if (!admin?.admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const users = await prisma.user.findMany({
        where: { banned: true },
        orderBy: { bannedAt: "desc" },
        select: { id: true, username: true, email: true, bannedAt: true },
    });

    return NextResponse.json({ users });
}