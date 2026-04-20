import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@romulo/database";

import { forbiddenResponse, internalErrorResponse } from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { simulatePixPayment } from "@/lib/payments/abacate";

export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);

  if (process.env.NODE_ENV === "production") {
    return forbiddenResponse(t("donations.pix.notAvailableInProduction"));
  }

  try {
    const { pixId, donationId } = await req.json();

    await simulatePixPayment(pixId);

    await prisma.donation.updateMany({
      where: { id: donationId, status: "PENDING" },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return internalErrorResponse(
      "donations-pix-simulate",
      error,
      t("common.internalError"),
    );
  }
}
