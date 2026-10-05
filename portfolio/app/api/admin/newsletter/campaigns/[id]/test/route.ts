import { NextRequest, NextResponse } from "next/server";

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
import { dispatchCampaignTest } from "@/lib/newsletter/newsletter.service";

/**
 * POST /api/admin/newsletter/campaigns/[id]/test
 *
 * Sends the saved draft to the subscribers flagged as testers only. The
 * campaign stays a DRAFT and keeps no trace of the test, so the same draft
 * (posts, order, translations) is what the real send uses afterwards.
 */
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
      select: { id: true, status: true },
    });
    if (!campaign) {
      return notFoundResponse(t("admin.newsletterCampaigns.notFound"));
    }
    if (campaign.status !== "DRAFT") {
      throw new RequestValidationError(t("admin.newsletterCampaigns.draftOnlyTest"));
    }

    const result = await dispatchCampaignTest(campaign.id);
    if (result.dispatched === 0) {
      throw new RequestValidationError(t("admin.newsletterCampaigns.noTestRecipients"));
    }

    return NextResponse.json({
      message: t("admin.newsletterCampaigns.testQueued"),
      dispatched: result.dispatched,
      recipients: result.recipients,
    });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return validationErrorResponse(error, t("common.invalidRequest"));
    }

    return internalErrorResponse(
      "admin-newsletter-campaigns-test",
      error,
      t("admin.newsletterCampaigns.dispatchFailed"),
      { campaignId: params.id },
    );
  }
}
