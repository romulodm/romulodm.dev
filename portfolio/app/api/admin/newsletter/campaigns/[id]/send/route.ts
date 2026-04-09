import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@romulo/database";

import { requireAdmin } from "@/lib/auth";
import {
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/api-errors";
import { RequestValidationError } from "@/lib/api-validation";
import { dispatchCampaign } from "@/lib/newsletter/newsletter.service";

const sendCampaignSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401 ? unauthorizedResponse() : forbiddenResponse();
  }

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign) {
      return notFoundResponse("Campanha nao encontrada.");
    }

    if (campaign.status !== "DRAFT") {
      throw new RequestValidationError("Apenas rascunhos podem ser enviados.");
    }

    let scheduledAt: Date | undefined;
    const rawBody = await req.text();
    let body: { scheduledAt?: string } = {};
    if (rawBody.trim().length > 0) {
      let parsedBody: unknown;
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        throw new RequestValidationError("Corpo da requisicao invalido.");
      }
      body = sendCampaignSchema.parse(parsedBody);
    }
    if (body.scheduledAt) {
      const parsed = new Date(body.scheduledAt);
      if (Number.isNaN(parsed.getTime())) {
        throw new RequestValidationError("scheduledAt invalido.");
      }
      if (parsed <= new Date()) {
        throw new RequestValidationError("scheduledAt deve ser uma data futura.");
      }
      scheduledAt = parsed;
    }

    console.log(`[send] Starting dispatch for campaign ${params.id} (${campaign.subject})`);
    const result = await dispatchCampaign(campaign.id, scheduledAt);
    console.log(`[send] Dispatched ${result.dispatched} jobs for campaign ${params.id}`);

    return NextResponse.json({
      message: scheduledAt
        ? "Campanha agendada com sucesso."
        : "Campanha enfileirada para envio.",
      dispatched: result.dispatched,
      scheduledAt: scheduledAt?.toISOString() ?? null,
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error);
    }

    return internalErrorResponse(
      "admin-newsletter-campaigns-send",
      error,
      "Falha ao despachar campanha.",
      { campaignId: params.id },
    );
  }
}
