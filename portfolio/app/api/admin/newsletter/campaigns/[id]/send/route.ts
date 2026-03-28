// src/app/api/admin/newsletter/campaigns/[id]/send/route.ts

import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import { prisma } from "@romulo/database";
import { dispatchCampaign } from "@/lib/newsletter/newsletter.service";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } },
) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const campaign = await prisma.campaign.findUnique({
        where: { id: params.id },
    });

    if (!campaign) {
        return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
    }

    if (campaign.status !== "DRAFT") {
        return NextResponse.json(
            { error: `Campanha já está com status "${campaign.status}". Apenas rascunhos podem ser enviados.` },
            { status: 400 },
        );
    }

    // Parse optional scheduledAt
    let scheduledAt: Date | undefined;
    try {
        const body = await req.json().catch(() => ({}));
        if (body.scheduledAt) {
            const parsed = new Date(body.scheduledAt);
            if (isNaN(parsed.getTime())) {
                return NextResponse.json({ error: "scheduledAt inválido." }, { status: 400 });
            }
            if (parsed <= new Date()) {
                return NextResponse.json(
                    { error: "scheduledAt deve ser uma data futura." },
                    { status: 400 },
                );
            }
            scheduledAt = parsed;
        }
    } catch {
        // body vazio é válido
    }

    console.log(`[send] Starting dispatch for campaign ${params.id} (${campaign.subject})`);

    try {
        const result = await dispatchCampaign(campaign.id, scheduledAt);

        console.log(`[send] Dispatched ${result.dispatched} jobs for campaign ${params.id}`);

        return NextResponse.json({
            message: scheduledAt
                ? "Campanha agendada com sucesso."
                : "Campanha enfileirada para envio.",
            dispatched: result.dispatched,
            scheduledAt: scheduledAt?.toISOString() ?? null,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[send] dispatchCampaign failed for ${params.id}:`, err);
        return NextResponse.json(
            { error: `Falha ao despachar campanha: ${message}` },
            { status: 500 },
        );
    }
}