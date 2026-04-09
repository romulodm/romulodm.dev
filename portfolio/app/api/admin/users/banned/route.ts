import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@romulo/database";
import { requireAdmin } from "@/lib/auth";
import {
    forbiddenResponse,
    internalErrorResponse,
    unauthorizedResponse,
} from "@/lib/api-errors";

export async function GET(_req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) {
        return auth.status === 401 ? unauthorizedResponse() : forbiddenResponse();
    }

    try {
        const users = await prisma.user.findMany({
            where: { banned: true },
            orderBy: { bannedAt: "desc" },
            select: { id: true, username: true, email: true, bannedAt: true },
        });

        return NextResponse.json({ users });
    } catch (error) {
        return internalErrorResponse("admin-banned-users-list", error);
    }
}
