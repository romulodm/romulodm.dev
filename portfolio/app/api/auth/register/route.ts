import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@romulo/database";

import {
  conflictResponse,
  internalErrorResponse,
  logApiError,
  rateLimitResponse,
  validationErrorResponse,
} from "@/lib/api-errors";
import { getApiTranslator, resolveApiLocale } from "@/lib/api-intl";
import {
  parseJsonBodyWithMessages,
  RequestValidationError,
} from "@/lib/api-validation";
import { DEFAULT_AVATAR_STYLE, generateAvatarSeed } from "@/lib/avatar";
import { sendEmailVerification } from "@/lib/email-verification";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";
import { checkUsername, normalizeUsernameInput } from "@/lib/username-rules";

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
    // Required: the old fallback used the e-mail local part as the username,
    // which published part of the address next to every comment.
    username: z
      .string({ error: t("username.required") })
      .transform(normalizeUsernameInput)
      .superRefine((value, ctx) => {
        const problem = checkUsername(value);
        if (problem) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t(`username.${problem}`) });
        }
      }),
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

    const created = await prisma.user.create({
      data: {
        email,
        provider: "EMAIL_PASSWORD",
        password: passwordHash,
        username,
        usernameChosenAt: new Date(),
        emailVerified: false,
        // Conta por e-mail nao tem foto de provider, entao o avatar gerado e a
        // unica imagem que ela tem — e ja nasce com uma, em vez do default.png
        // cinza que todo mundo dividia antes.
        avatarSeed: generateAvatarSeed(),
        avatarStyle: DEFAULT_AVATAR_STYLE,
        avatarSource: "SEEDICON",
      },
      select: { id: true },
    });

    // The account exists either way; a failed enqueue only means the first
    // link never leaves. The comment box offers "send a new link", so the
    // user is not stuck, and failing the whole sign-up here would leave them
    // with an account they think was not created.
    await sendEmailVerification({ id: created.id, email, username }, resolveApiLocale(req)).catch(
      (err) => logApiError("register.verification_email", err),
    );

    // ── Link newsletter subscription if one exists for this email ─────────────
    // Fire-and-forget: linking is non-critical and must not fail the registration
    prisma.newsletterSubscriber
      .updateMany({
        where: {
          email,
          isConfirmed: true,
          unsubscribedAt: null,
          userId: null, // only link if not already linked
        },
        data: { userId: created.id },
      })
      .catch((err) =>
        logApiError("register.newsletter_link", err),
      );

    return NextResponse.json({ ok: true, userId: created.id }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      const target = (error as { meta?: { target?: unknown } }).meta?.target;
      if (Array.isArray(target) ? target.includes("username") : String(target ?? "").includes("username")) {
        return conflictResponse(t("username.taken"));
      }
      return conflictResponse(t("auth.register.conflictRetry"));
    }
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error, t("common.invalidRequest"));
    }
    return internalErrorResponse("auth-register", error, t("common.internalError"));
  }
}