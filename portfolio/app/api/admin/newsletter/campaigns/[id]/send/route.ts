import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@romulo/database";

import { requireAdmin } from "@/lib/auth-helpers";
import {
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { RequestValidationError } from "@/lib/api-validation";
import { dispatchCampaign } from "@/lib/newsletter/newsletter.service";

const sendCampaignSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
});

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(req);
  const params = await props.params;
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401
      ? unauthorizedResponse(t("common.unauthorized"))
      : forbiddenResponse(t("common.forbidden"));
  }

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign) {
      return notFoundResponse(t("admin.newsletterCampaigns.notFound"));
    }

    if (campaign.status !== "DRAFT") {
      throw new RequestValidationError(t("admin.newsletterCampaigns.draftOnlySend"));
    }

    let scheduledAt: Date | undefined;
    const rawBody = await req.text();
    let body: { scheduledAt?: string } = {};
    if (rawBody.trim().length > 0) {
      let parsedBody: unknown;
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        throw new RequestValidationError(t("common.invalidBody"));
      }
      body = sendCampaignSchema.parse(parsedBody);
    }
    if (body.scheduledAt) {
      const parsed = new Date(body.scheduledAt);
      if (Number.isNaN(parsed.getTime())) {
        throw new RequestValidationError(t("admin.newsletterCampaigns.invalidScheduledAt"));
      }
      if (parsed <= new Date()) {
        throw new RequestValidationError(t("admin.newsletterCampaigns.futureScheduledAt"));
      }
      scheduledAt = parsed;
    }

    const result = await dispatchCampaign(campaign.id, scheduledAt);

    return NextResponse.json({
      message: scheduledAt
        ? t("admin.newsletterCampaigns.scheduled")
        : t("admin.newsletterCampaigns.queued"),
      dispatched: result.dispatched,
      scheduledAt: scheduledAt?.toISOString() ?? null,
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error, t("common.invalidRequest"));
    }

    return internalErrorResponse(
      "admin-newsletter-campaigns-send",
      error,
      t("admin.newsletterCampaigns.dispatchFailed"),
      { campaignId: params.id },
    );
  }
}
