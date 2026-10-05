import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

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
import { createPixCharge } from "@/lib/payments/abacate";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";
import { authOptions } from "@/lib/auth";

const COFFEE_CENTS = 500;
const MAX_COFFEES = 1000;
const DONATION_RATE_LIMIT_MAX = 10;
const DONATION_RATE_LIMIT_WINDOW_SECONDS = 600;

function createPixDonationSchema(t: Awaited<ReturnType<typeof getApiTranslator>>) {
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
    name: z.unknown().optional().transform((v) => optionalPlainText(v, 100)),
    message: z.unknown().optional().transform((v) => optionalPlainText(v, 500)),
    isPrivate: z.coerce.boolean().optional().default(false),
    isMonthly: z.coerce.boolean().optional().default(false),
    email: z.string().trim().email().optional(),
    cellphone: z.unknown().optional().transform((v) => optionalPlainText(v, 32)),
    taxId: z.unknown().optional().transform((v) => optionalPlainText(v, 32)),
    // Optional: link donation to the authenticated user's account
    userId: z.string().optional(),
  });
}

export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);

  try {
    const limited = await rateLimit(
      `donations:pix:create:${getRequestIp(req)}`,
      DONATION_RATE_LIMIT_MAX,
      DONATION_RATE_LIMIT_WINDOW_SECONDS,
    );
    if (limited) return rateLimitResponse(t("common.rateLimited"));

    const { coffees: requestedCoffees, amount: requestedAmount, name, message, isPrivate, isMonthly, email, cellphone, taxId, userId } =
      await parseJsonBodyWithMessages(req, createPixDonationSchema(t), {
        invalidBodyMessage: t("common.invalidBody"),
        fallbackMessage: t("common.invalidRequest"),
      });

    // Security: only link to the session user — never trust the client's userId blindly
    let verifiedUserId: string | null = null;
    if (userId) {
      const session = await getServerSession(authOptions);
      const sessionUserId = (session?.user as any)?.id as string | undefined;
      if (sessionUserId && sessionUserId === userId) {
        verifiedUserId = userId;
      }
    }

    const amount = requestedAmount ?? requestedCoffees * COFFEE_CENTS;
    const coffees = requestedAmount
      ? Math.floor(requestedAmount / COFFEE_CENTS)
      : requestedCoffees;

    const donation = await prisma.donation.create({
      data: {
        coffees,
        amount,
        currency: "BRL",
        provider: "PIX",
        name: isPrivate ? null : name,
        message,
        isPrivate,
        isMonthly,
        status: "PENDING",
        ...(verifiedUserId ? { userId: verifiedUserId } : {}),
      },
    });

    try {
      const charge = await createPixCharge({
        amount,
        correlationId: donation.id,
        description: t("donations.pix.chargeDescription", { count: coffees }),
        name: name ?? undefined,
        email,
        cellphone: cellphone ?? undefined,
        taxId: taxId ?? undefined,
      });

      await prisma.donation.update({
        where: { id: donation.id },
        data: { abacatePayChargeId: charge.id },
      });

      return NextResponse.json({
        pixId: charge.id,
        brCode: charge.brCode,
        brCodeBase64: charge.brCodeBase64,
        donationId: donation.id,
      });
    } catch (error) {
      await prisma.donation.update({
        where: { id: donation.id },
        data: { status: "FAILED" },
      });
      return internalErrorResponse("donations-pix-create", error, t("donations.pix.internal"));
    }
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error, t("common.invalidRequest"));
    }
    return internalErrorResponse("donations-pix-create", error, t("donations.pix.internal"));
  }
}