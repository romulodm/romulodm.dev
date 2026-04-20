import { randomBytes } from "crypto";

import { prisma } from "@romulo/database";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiTranslator } from "@/lib/api-intl";
import { rateLimitResponse } from "@/lib/api-errors";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/queues/password.queue";

function createForgotPasswordSchema(t: Awaited<ReturnType<typeof getApiTranslator>>) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, t("common.emailRequired"))
      .email(t("common.emailInvalid")),
  });
}

function safeDelay() {
  return new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 100));
}

export async function POST(req: Request) {
  const t = await getApiTranslator(req);

  try {
    const rawBody = await req.json().catch(() => null);
    const parsed = createForgotPasswordSchema(t).safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ message: t("common.invalidRequest") }, { status: 422 });
    }

    const { email } = parsed.data;
    const ip = getRequestIp(req);
    const limited = await rateLimit(`auth:forgot:${ip}`, 5, 60 * 10);
    if (limited) {
      return rateLimitResponse(t("auth.forgot.rateLimited"));
    }

    const genericResponse = NextResponse.json({
      message: t("auth.forgot.success"),
    });

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      await safeDelay();
      return genericResponse;
    }

    if (user.provider !== "EMAIL_PASSWORD") {
      await safeDelay();
      return genericResponse;
    }

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    await sendPasswordResetEmail(email, token);

    return genericResponse;
  } catch (error) {
    console.error("[forgot-password]", error);
    return NextResponse.json({ message: t("auth.forgot.internal") }, { status: 500 });
  }
}
