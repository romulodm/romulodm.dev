import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  internalErrorResponse,
  rateLimitResponse,
  validationErrorResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import {
  parseJsonBodyWithMessages,
  RequestValidationError,
} from "@/lib/api-validation";
import { requestUnsubscribe } from "@/lib/newsletter/newsletter.service";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

function createRequestUnsubscribeSchema(
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
      `newsletter:request-unsubscribe:${getRequestIp(req)}`,
      5,
      600,
    );
    if (limited) {
      return rateLimitResponse(t("newsletter.requestUnsubscribe.rateLimited"));
    }

    const { email } = await parseJsonBodyWithMessages(
      req,
      createRequestUnsubscribeSchema(t),
      {
        invalidBodyMessage: t("common.invalidBody"),
        fallbackMessage: t("common.invalidRequest"),
      },
    );

    await requestUnsubscribe(email);

    return NextResponse.json({
      message: t("newsletter.requestUnsubscribe.success"),
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error, t("common.invalidRequest"));
    }

    return internalErrorResponse(
      "newsletter-request-unsubscribe",
      error,
      t("newsletter.requestUnsubscribe.internal"),
    );
  }
}
