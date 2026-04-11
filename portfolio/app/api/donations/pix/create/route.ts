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
  emailSchema,
  optionalPlainText,
  parseJsonBody,
} from "@/lib/api-validation";
import { createPixCharge } from "@/lib/payments/abacate";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

const COFFEE_CENTS = 500;
const DONATION_RATE_LIMIT_MAX = 10;
const DONATION_RATE_LIMIT_WINDOW_SECONDS = 600;

const pixDonationSchema = z.object({
  coffees: z.coerce.number().int().min(1).max(1000),
  name: z.unknown().optional().transform((value) => optionalPlainText(value, 100)),
  message: z
    .unknown()
    .optional()
    .transform((value) => optionalPlainText(value, 500)),
  isPrivate: z.coerce.boolean().optional().default(false),
  isMonthly: z.coerce.boolean().optional().default(false),
  email: emailSchema.optional(),
  cellphone: z
    .unknown()
    .optional()
    .transform((value) => optionalPlainText(value, 32)),
  taxId: z
    .unknown()
    .optional()
    .transform((value) => optionalPlainText(value, 32)),
});

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(
      `donations:pix:create:${getRequestIp(req)}`,
      DONATION_RATE_LIMIT_MAX,
      DONATION_RATE_LIMIT_WINDOW_SECONDS,
    );
    if (limited) {
      return rateLimitResponse();
    }

    const { coffees, name, message, isPrivate, isMonthly, email, cellphone, taxId } =
      await parseJsonBody(req, pixDonationSchema);
    const amount = coffees * COFFEE_CENTS;

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
      },
    });

    try {
      const charge = await createPixCharge({
        amount,
        correlationId: donation.id,
        description: `${coffees}x cafe para o blog`,
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

      return internalErrorResponse("donations-pix-create", error);
    }
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error);
    }

    return internalErrorResponse("donations-pix-create", error);
  }
}
