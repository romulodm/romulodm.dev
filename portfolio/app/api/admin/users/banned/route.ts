import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@romulo/database";
import { requireAdmin } from "@/lib/auth-helpers";
import { forbiddenResponse, internalErrorResponse, unauthorizedResponse } from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";

export async function GET(req: NextRequest) {
  const t = await getApiTranslator(req);
  const auth = await requireAdmin();
  if (!auth.ok)
    return auth.status === 401
      ? unauthorizedResponse(t("common.unauthorized"))
      : forbiddenResponse(t("common.forbidden"));

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));
    const search = searchParams.get("search")?.trim() ?? "";

    const where = {
      banned: true,
      ...(search
        ? {
          OR: [
            { username: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ]
        }
        : {}),
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { bannedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, username: true, email: true,
          bannedAt: true, banReason: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pageSize });
  } catch (error) {
    return internalErrorResponse("admin-banned-users-list", error, t("common.internalError"));
  }
}