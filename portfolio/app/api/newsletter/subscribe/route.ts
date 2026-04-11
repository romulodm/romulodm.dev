import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  internalErrorResponse,
  rateLimitResponse,
  validationErrorResponse,
} from "@/lib/api-errors";
import {
  RequestValidationError,
  emailSchema,
  parseJsonBody,
} from "@/lib/api-validation";
import { subscribe } from "@/lib/newsletter/newsletter.service";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

const newsletterSubscribeSchema = z.object({
  email: emailSchema,
});

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(
      `newsletter:subscribe:${getRequestIp(req)}`,
      5,
      600,
    );
    if (limited) {
      return rateLimitResponse("Muitas tentativas. Tente novamente em alguns minutos.");
    }

    const { email } = await parseJsonBody(req, newsletterSubscribeSchema);
    await subscribe(email);

    return NextResponse.json({
      message: "Verifique seu e-mail para confirmar a inscricao.",
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error);
    }

    return internalErrorResponse(
      "newsletter-subscribe",
      error,
      "Erro interno. Tente novamente.",
    );
  }
}
