// src/app/api/newsletter/track/[trackingId]/route.ts
//
// Returns a 1×1 transparent GIF and records the open event.
// Bots and email pre-loaders will trigger this — that's acceptable for now;
// more accurate tracking would require client-side JS, which email clients block.
//

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@romulo/database";

// 1×1 transparent GIF (43 bytes)
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(
  req: NextRequest,
  { params }: { params: { trackingId: string } },
) {
  const { trackingId } = params;

  // Fire and forget — don't block the pixel response
  setImmediate(async () => {
    try {
      const recipient = await prisma.campaignRecipient.findUnique({
        where: { trackingId },
        select: { id: true, campaignId: true, openedAt: true },
      });
      if (!recipient) return;

      const isFirstOpen = !recipient.openedAt;

      await prisma.campaignRecipient.update({
        where: { trackingId },
        data: {
          openedAt: recipient.openedAt ?? new Date(),
          openCount: { increment: 1 },
        },
      });

      if (isFirstOpen) {
        await prisma.campaign.update({
          where: { id: recipient.campaignId },
          data: { openCount: { increment: 1 } },
        });
      }
    } catch (err) {
      // Silently ignore — tracking should never break delivery
      console.error("[track pixel]", err);
    }
  });

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
