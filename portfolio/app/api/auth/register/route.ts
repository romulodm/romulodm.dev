import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@romulo/database";

import {
  conflictResponse,
  internalErrorResponse,
  rateLimitResponse,
  validationErrorResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import {
  optionalPlainText,
  parseJsonBodyWithMessages,
  RequestValidationError,
  sanitizePlainText,
} from "@/lib/api-validation";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

function createRegisterSchema(t: Awaited<ReturnType<typeof getApiTranslator>>) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, t("common.emailRequired"))
      .email(t("common.emailInvalid")),
    password: z
      .string()
      .min(1, t("auth.register.passwordRequired"))
      .min(8, t("auth.register.passwordMin"))
      .max(128, t("auth.register.passwordMax")),
    username: z
      .string()
      .optional()
      .transform((value) => optionalPlainText(value, 32)),
  });
}

export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);

  try {
    const { email, password, username } = await parseJsonBodyWithMessages(
      req,
      createRegisterSchema(t),
      {
        invalidBodyMessage: t("common.invalidBody"),
        fallbackMessage: t("common.invalidRequest"),
      },
    );
    const ip = getRequestIp(req);
    const limited = await rateLimit(`auth:register:${ip}:${email}`, 5, 60 * 10);
    if (limited) {
      return rateLimitResponse(t("auth.register.rateLimited"));
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, provider: true },
    });

    if (existing) {
      return conflictResponse(t("auth.register.conflict"));
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
    if ((error as { code?: string })?.code === "P2002") {
      return conflictResponse(t("auth.register.conflictRetry"));
    }
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error, t("common.invalidRequest"));
    }
    return internalErrorResponse("auth-register", error, t("common.internalError"));
  }
}
