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
  parseJsonBodyWithMessages,
} from "@/lib/api-validation";
import { getApiTranslator } from "@/lib/api-intl";
import { getStripe } from "@/lib/payments/stripe";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

const COFFEE_CENTS = 500;
const MAX_COFFEES = 1000;
const DONATION_RATE_LIMIT_MAX = 10;
const DONATION_RATE_LIMIT_WINDOW_SECONDS = 600;

function createStripeDonationSchema(
  t: Awaited<ReturnType<typeof getApiTranslator>>,
) {
  return z.object({
    coffees: z.coerce
      .number()
      .int(t("donations.invalidCoffeeCount"))
      .min(1, t("donations.invalidCoffeeCount"))
      .max(MAX_COFFEES, t("donations.invalidCoffeeCount")),
    // Optional free-typed total in cents. When present it is the source of truth
    // and the coffee count is derived from it (rounded down).
    amount: z.coerce
      .number()
      .int(t("donations.invalidCoffeeCount"))
      .min(COFFEE_CENTS, t("donations.invalidCoffeeCount"))
      .max(MAX_COFFEES * COFFEE_CENTS, t("donations.invalidCoffeeCount"))
      .optional(),
    name: z
      .unknown()
      .optional()
      .transform((value) => optionalPlainText(value, 100)),
    message: z
      .unknown()
      .optional()
      .transform((value) => optionalPlainText(value, 500)),
    isPrivate: z.coerce.boolean().optional().default(false),
    isMonthly: z.coerce.boolean().optional().default(false),
  });
}

export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);

  try {
    const limited = await rateLimit(
      `donations:stripe:create:${getRequestIp(req)}`,
      DONATION_RATE_LIMIT_MAX,
      DONATION_RATE_LIMIT_WINDOW_SECONDS,
    );
    if (limited) {
      return rateLimitResponse(t("common.rateLimited"));
    }

    const { coffees: requestedCoffees, amount: requestedAmount, name, message, isPrivate, isMonthly } =
      await parseJsonBodyWithMessages(req, createStripeDonationSchema(t), {
        invalidBodyMessage: t("common.invalidBody"),
        fallbackMessage: t("common.invalidRequest"),
      });
    const amount = requestedAmount ?? requestedCoffees * COFFEE_CENTS;
    const coffees = requestedAmount
      ? Math.floor(requestedAmount / COFFEE_CENTS)
      : requestedCoffees;

    const intent = await getStripe().paymentIntents.create({
      amount,
      currency: "brl",
      automatic_payment_methods: { enabled: true },
      metadata: {
        // Marcador lido pela auditoria contabil do worker
        // (worker/workers/donations.worker.ts). `paymentIntents.list` devolve
        // todo o trafego da conta, entao sem isto qualquer cobranca que nao
        // seja doacao seria acusada de "liquidada sem contrapartida local".
        kind: "donation",
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
      return validationErrorResponse(error, t("common.invalidRequest"));
    }

    return internalErrorResponse(
      "donations-stripe-create-intent",
      error,
      t("donations.stripe.internal"),
    );
  }
}
