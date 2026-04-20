import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@romulo/database";

import {
  badRequestResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";

export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);
  const webhookSecret = req.nextUrl.searchParams.get("webhookSecret");

  if (webhookSecret !== process.env.ABACATE_PAY_WEBHOOK_SECRET) {
    return unauthorizedResponse(t("common.unauthorized"));
  }

  try {
    const body = await req.json();

    if (body.event === "billing.paid") {
      const donationId = body.data?.pixQrCode?.metadata?.donationId;
      const chargeId = body.data?.pixQrCode?.id;

      if (!donationId) {
        return badRequestResponse(t("donations.pix.missingDonationId"));
      }

      await prisma.donation.updateMany({
        where: { id: donationId },
        data: {
          status: "COMPLETED",
          abacatePayChargeId: chargeId ?? undefined,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return internalErrorResponse(
      "donations-pix-webhook",
      error,
      t("common.internalError"),
    );
  }
}
