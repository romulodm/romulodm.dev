import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import {
  markDonationCompleted,
  markDonationExpired,
  needsAttention,
  describeOutcome,
} from "@romulo/database";

import {
  badRequestResponse,
  internalErrorResponse,
  logApiError,
  unauthorizedResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { revalidateDonationViews } from "@/lib/payments/revalidate-donations";
import {
  buildAbacateEventId,
  finalizeWebhookEvent,
  recordWebhookEvent,
} from "@/lib/payments/webhook-events";

function secretMatches(received: string | null, expected: string | undefined): boolean {
  if (!received || !expected) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);
  const webhookSecret = req.headers.get("x-webhook-secret");

  if (!secretMatches(webhookSecret, process.env.ABACATE_PAY_WEBHOOK_SECRET)) {
    return unauthorizedResponse(t("common.unauthorized"));
  }

  let eventRowId = "";

  try {
    const body = await req.json();

    const eventType: string = body?.event ?? "unknown";
    const pixQrCode = body?.data?.pixQrCode;
    const chargeId: string | undefined = pixQrCode?.id;
    const donationId: string | undefined = pixQrCode?.metadata?.donationId;

    const paidAmount: number | undefined =
      typeof pixQrCode?.amount === "number" ? pixQrCode.amount : undefined;

    const recorded = await recordWebhookEvent({
      provider: "PIX",
      eventId: buildAbacateEventId(eventType, chargeId),
      eventType,
      payload: body,
      donationId: donationId ?? null,
    });
    eventRowId = recorded.id;

    if (recorded.duplicate) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    if (eventType === "billing.paid") {
      if (!donationId) {
        await finalizeWebhookEvent(eventRowId, "FAILED", {
          error: "billing.paid sem metadata.donationId",
        });
        return badRequestResponse(t("donations.pix.missingDonationId"));
      }

      const outcome = await markDonationCompleted({
        ref: { by: "id", id: donationId },
        paidAmount,
        abacatePayChargeId: chargeId,
      });

      if (needsAttention(outcome)) {
        logApiError("donations-pix-webhook", new Error(describeOutcome(outcome)), {
          donationId,
          chargeId,
          eventType,
        });
        await finalizeWebhookEvent(eventRowId, "FAILED", {
          donationId,
          error: describeOutcome(outcome),
        });

        return NextResponse.json({ ok: true, warning: outcome.kind });
      }

      if (outcome.kind === "completed") revalidateDonationViews();

      await finalizeWebhookEvent(eventRowId, "PROCESSED", { donationId });
      return NextResponse.json({ ok: true });
    }

    if (eventType === "billing.expired") {
      if (donationId) await markDonationExpired({ by: "id", id: donationId });
      await finalizeWebhookEvent(eventRowId, "PROCESSED", { donationId: donationId ?? null });
      return NextResponse.json({ ok: true });
    }

    await finalizeWebhookEvent(eventRowId, "IGNORED", { donationId: donationId ?? null });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await finalizeWebhookEvent(eventRowId, "FAILED", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse(
      "donations-pix-webhook",
      error,
      t("common.internalError"),
    );
  }
}
