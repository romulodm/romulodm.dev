import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@romulo/database";

import { requireAdmin } from "@/lib/auth-helpers";
import {
  forbiddenResponse,
  internalErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { parseJsonBodyWithMessages, RequestValidationError } from "@/lib/api-validation";

/**
 * Subscribers flagged as testers receive "send test" deliveries of draft
 * campaigns (see campaigns/[id]/test). Only confirmed, still-subscribed
 * addresses can be testers: a test must exercise the same unsubscribe link
 * and locale a real recipient would get.
 */

const testerSelect = {
  id: true,
  email: true,
  preferredLocale: true,
} as const;

export async function GET(req: NextRequest) {
  const t = await getApiTranslator(req);
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401
      ? unauthorizedResponse(t("common.unauthorized"))
      : forbiddenResponse(t("common.forbidden"));
  }

  const testers = await prisma.newsletterSubscriber.findMany({
    where: { isTestRecipient: true, isConfirmed: true, unsubscribedAt: null },
    orderBy: { email: "asc" },
    select: testerSelect,
  });

  return NextResponse.json({ testers });
}

export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401
      ? unauthorizedResponse(t("common.unauthorized"))
      : forbiddenResponse(t("common.forbidden"));
  }

  try {
    const body = await parseJsonBodyWithMessages(
      req,
      z.object({
        email: z
          .string()
          .trim()
          .toLowerCase()
          .email(t("common.emailInvalid")),
      }),
      {
        invalidBodyMessage: t("common.invalidBody"),
        fallbackMessage: t("common.invalidRequest"),
      },
    );

    const subscriber = await prisma.newsletterSubscriber.findFirst({
      where: {
        email: { equals: body.email, mode: "insensitive" },
        isConfirmed: true,
        unsubscribedAt: null,
      },
      select: { id: true },
    });
    if (!subscriber) {
      throw new RequestValidationError(t("admin.newsletterTesters.notSubscribed"));
    }

    const tester = await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { isTestRecipient: true },
      select: testerSelect,
    });

    return NextResponse.json({ tester }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error, t("common.invalidRequest"));
    }
    return internalErrorResponse(
      "admin-newsletter-test-recipients-add",
      error,
      t("common.internalError"),
    );
  }
}
