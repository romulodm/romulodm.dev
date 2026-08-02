import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

import {
  markDonationCompleted,
  markDonationFailed,
  markDonationExpired,
  needsAttention,
  describeOutcome,
} from "@romulo/database";

import { badRequestResponse, internalErrorResponse, logApiError } from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { getStripe } from "@/lib/payments/stripe";
import { finalizeWebhookEvent, recordWebhookEvent } from "@/lib/payments/webhook-events";

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

  let eventRowId = "";

  try {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const recorded = await recordWebhookEvent({
      provider: "STRIPE",
      eventId: event.id,
      eventType: event.type,
      payload: event as unknown,
    });
    eventRowId = recorded.id;

    if (recorded.duplicate) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const ref = { by: "stripePaymentIntent" as const, paymentIntentId: paymentIntent.id };

    if (event.type === "payment_intent.succeeded") {
      const outcome = await markDonationCompleted({
        ref,
        paidAmount:
          typeof paymentIntent.amount_received === "number"
            ? paymentIntent.amount_received
            : undefined,
      });

      if (needsAttention(outcome)) {
        logApiError("donations-stripe-webhook", new Error(describeOutcome(outcome)), {
          paymentIntentId: paymentIntent.id,
          eventType: event.type,
        });
        await finalizeWebhookEvent(eventRowId, "FAILED", { error: describeOutcome(outcome) });
        return NextResponse.json({ ok: true, warning: outcome.kind });
      }

      await finalizeWebhookEvent(eventRowId, "PROCESSED", {
        donationId: "donationId" in outcome ? outcome.donationId : null,
      });
      return NextResponse.json({ ok: true });
    }

    if (event.type === "payment_intent.payment_failed") {
      const result = await markDonationFailed(ref);
      await finalizeWebhookEvent(eventRowId, result === "failed" ? "PROCESSED" : "IGNORED");
      return NextResponse.json({ ok: true });
    }

    if (event.type === "payment_intent.canceled") {
      await markDonationExpired(ref);
      await finalizeWebhookEvent(eventRowId, "PROCESSED");
      return NextResponse.json({ ok: true });
    }

    await finalizeWebhookEvent(eventRowId, "IGNORED");
    return NextResponse.json({ ok: true });
  } catch (error) {
    await finalizeWebhookEvent(eventRowId, "FAILED", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse(
      "donations-stripe-webhook",
      error,
      t("common.internalError"),
    );
  }
}
