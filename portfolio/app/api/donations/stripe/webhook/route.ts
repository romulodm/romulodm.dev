import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@romulo/database";

import { badRequestResponse, internalErrorResponse } from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { getStripe } from "@/lib/payments/stripe";

export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return badRequestResponse(t("donations.stripe.missingSignature"));
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return badRequestResponse(t("donations.stripe.invalidSignature"));
  }

  try {
    const paymentIntent = event.data.object as { id: string };

    if (event.type === "payment_intent.succeeded") {
      await prisma.donation.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { status: "COMPLETED" },
      });
    }

    if (event.type === "payment_intent.payment_failed") {
      await prisma.donation.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return internalErrorResponse(
      "donations-stripe-webhook",
      error,
      t("common.internalError"),
    );
  }
}
