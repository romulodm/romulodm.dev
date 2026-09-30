import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  internalErrorResponse,
  rateLimitResponse,
  validationErrorResponse,
} from "@/lib/api-errors";
import { getApiTranslator, resolveApiLocale } from "@/lib/api-intl";
import {
  parseJsonBodyWithMessages,
  RequestValidationError,
} from "@/lib/api-validation";
import { subscribe } from "@/lib/newsletter/newsletter.service";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

function createNewsletterSubscribeSchema(
  t: Awaited<ReturnType<typeof getApiTranslator>>,
) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, t("common.emailRequired"))
      .email(t("common.emailInvalid")),
  });
}

export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);

  try {
    const limited = await rateLimit(
      `newsletter:subscribe:${getRequestIp(req)}`,
      5,
      600,
    );
    if (limited) {
      return rateLimitResponse(t("newsletter.subscribe.rateLimited"));
    }

    const { email } = await parseJsonBodyWithMessages(
      req,
      createNewsletterSubscribeSchema(t),
      {
        invalidBodyMessage: t("common.invalidBody"),
        fallbackMessage: t("common.invalidRequest"),
      },
    );
    // The locale the visitor is browsing in decides the language of the
    // confirmation email and is stored as their preferred locale.
    await subscribe(email, resolveApiLocale(req));

    return NextResponse.json({
      message: t("newsletter.subscribe.success"),
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error, t("common.invalidRequest"));
    }

    return internalErrorResponse(
      "newsletter-subscribe",
      error,
      t("newsletter.subscribe.internal"),
    );
  }
}
