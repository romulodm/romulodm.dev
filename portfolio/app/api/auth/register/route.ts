import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@romulo/database";
import {
    conflictResponse,
    internalErrorResponse,
    rateLimitResponse,
    validationErrorResponse,
} from "@/lib/api-errors";
import {
    emailSchema,
    optionalPlainText,
    parseJsonBody,
    passwordSchema,
    RequestValidationError,
    sanitizePlainText,
} from "@/lib/api-validation";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    username: z
        .string()
        .optional()
        .transform((value) => optionalPlainText(value, 32)),
});

export async function POST(req: NextRequest) {
    try {
        const { email, password, username } = await parseJsonBody(req, registerSchema);
        const ip = getRequestIp(req);
        const limited = await rateLimit(`auth:register:${ip}:${email}`, 5, 60 * 10);
        if (limited) {
            return rateLimitResponse("Muitas tentativas de cadastro. Tente novamente mais tarde.");
        }

        const existing = await prisma.user.findUnique({
            where: { email },
            select: { id: true, provider: true },
        });

        if (existing) {
            return conflictResponse("Não foi possível concluir o cadastro com os dados informados.");
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const fallbackUsername = sanitizePlainText(email.split("@")[0] ?? "user", 24) || "user";

        const created = await prisma.user.create({
            data: {
                email,
                provider: "EMAIL_PASSWORD",
                password: passwordHash,
                username: username ?? fallbackUsername,
                emailVerified: false,
            },
            select: { id: true },
        });

        return NextResponse.json({ ok: true, userId: created.id }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError || error instanceof RequestValidationError) {
            return validationErrorResponse(error);
        }

        return internalErrorResponse("auth-register", error);
    }
}
