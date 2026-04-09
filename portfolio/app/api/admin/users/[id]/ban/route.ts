import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@romulo/database";
import { requireAdmin } from "@/lib/auth";
import {
    forbiddenResponse,
    internalErrorResponse,
    unauthorizedResponse,
    validationErrorResponse,
} from "@/lib/api-errors";
import {
    RequestValidationError,
    parseJsonBody,
} from "@/lib/api-validation";

const banSchema = z.object({
    banned: z.boolean(),
});

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = await requireAdmin();
    if (!auth.ok) {
        return auth.status === 401 ? unauthorizedResponse() : forbiddenResponse();
    }

    try {
        const { banned } = await parseJsonBody(req, banSchema);

        const updated = await prisma.user.update({
            where: { id: params.id },
            data: {
                banned,
                bannedAt: banned ? new Date() : null,
            },
            select: { id: true, username: true, banned: true, bannedAt: true },
        });

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError || error instanceof RequestValidationError) {
            return validationErrorResponse(error);
        }

        return internalErrorResponse("admin-ban-user", error);
    }
}
