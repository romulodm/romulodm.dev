import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@romulo/database";

import {
  internalErrorResponse,
  rateLimitResponse,
  validationErrorResponse,
} from "@/lib/api-errors";
import {
  RequestValidationError,
  optionalPlainText,
  parseJsonBody,
} from "@/lib/api-validation";
import { getStripe } from "@/lib/payments/stripe";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

const COFFEE_CENTS = 500;
const DONATION_RATE_LIMIT_MAX = 10;
const DONATION_RATE_LIMIT_WINDOW_SECONDS = 600;

const stripeDonationSchema = z.object({
  coffees: z.coerce.number().int().min(1).max(1000),
  name: z.unknown().optional().transform((value) => optionalPlainText(value, 100)),
  message: z
    .unknown()
    .optional()
    .transform((value) => optionalPlainText(value, 500)),
  isPrivate: z.coerce.boolean().optional().default(false),
  isMonthly: z.coerce.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(
      `donations:stripe:create:${getRequestIp(req)}`,
      DONATION_RATE_LIMIT_MAX,
      DONATION_RATE_LIMIT_WINDOW_SECONDS,
    );
    if (limited) {
      return rateLimitResponse();
    }

    const { coffees, name, message, isPrivate, isMonthly } = await parseJsonBody(
      req,
      stripeDonationSchema,
    );
    const amount = coffees * COFFEE_CENTS;

    const intent = await getStripe().paymentIntents.create({
      amount,
      currency: "brl",
      automatic_payment_methods: { enabled: true },
      metadata: {
        coffees: String(coffees),
        name: isPrivate ? "" : name ?? "",
        message: message ?? "",
      },
    });

    await prisma.donation.create({
      data: {
        coffees,
        amount,
        currency: "BRL",
        provider: "STRIPE",
        name: isPrivate ? null : name,
        message,
        isPrivate,
        isMonthly,
        stripePaymentIntentId: intent.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error);
    }

    return internalErrorResponse("donations-stripe-create-intent", error);
  }
}
