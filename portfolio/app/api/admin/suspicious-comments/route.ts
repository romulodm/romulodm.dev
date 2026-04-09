import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@romulo/database";
import { requireAdmin } from "@/lib/auth";
import {
    forbiddenResponse,
    internalErrorResponse,
    unauthorizedResponse,
} from "@/lib/api-errors";

export async function GET(req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) {
        return auth.status === 401 ? unauthorizedResponse() : forbiddenResponse();
    }

    try {
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
                    post: {
                        select: {
                            id: true,
                            slug: true,
                            translations: {
                                where: { locale: "pt" },
                                select: { title: true },
                                take: 1,
                            },
                        },
                    },
                },
            }),
            prisma.suspiciousComment.count(),
        ]);

        return NextResponse.json({
            items: items.map((item) => ({
                ...item,
                post: {
                    id: item.post.id,
                    slug: item.post.slug,
                    title: item.post.translations[0]?.title ?? "",
                },
            })),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        return internalErrorResponse("admin-suspicious-comments-list", error);
    }
}
