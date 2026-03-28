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

    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = 30;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        prisma.suspiciousComment.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
                author: { select: { id: true, username: true, email: true } },
                post: { select: { id: true, title: true, slug: true } },
            },
        }),
        prisma.suspiciousComment.count(),
    ]);

    return NextResponse.json({
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
}