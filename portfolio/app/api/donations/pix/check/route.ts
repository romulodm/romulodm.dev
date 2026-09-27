// app/api/donations/pix/check/route.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
    prisma,
    markDonationCompleted,
    markDonationExpired,
    needsAttention,
    describeOutcome,
} from "@romulo/database";

import {
    badRequestResponse,
    internalErrorResponse,
    logApiError,
    notFoundResponse,
    rateLimitResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { checkPixStatus } from "@/lib/payments/abacate";
import { revalidateDonationViews } from "@/lib/payments/revalidate-donations";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const CHECK_RATE_LIMIT_MAX = 120;
const CHECK_RATE_LIMIT_WINDOW_SECONDS = 600;

type PixStatus = "PENDING" | "PAID" | "EXPIRED";

export async function GET(req: NextRequest) {
    const t = await getApiTranslator(req);

    try {
        const limited = await rateLimit(
            `donations:pix:check:${getRequestIp(req)}`,
            CHECK_RATE_LIMIT_MAX,
            CHECK_RATE_LIMIT_WINDOW_SECONDS,
        );
        if (limited) return rateLimitResponse(t("common.rateLimited"));

        const pixId = req.nextUrl.searchParams.get("pixId");
        const donationId = req.nextUrl.searchParams.get("donationId");

        if (!pixId || !donationId) {
            return badRequestResponse(t("common.invalidRequest"));
        }

        // Confere que o par (donationId, pixId) casa com o que foi gravado no
        // create. Sem isso, alguem poderia combinar o proprio pixId pago com o
        // donationId de outra pessoa e promover a doacao errada.
        const donation = await prisma.donation.findFirst({
            where: { id: donationId, provider: "PIX" },
            select: { id: true, status: true, abacatePayChargeId: true },
        });

        if (!donation) return notFoundResponse(t("common.notFound"));

        if (donation.abacatePayChargeId && donation.abacatePayChargeId !== pixId) {
            return badRequestResponse(t("common.invalidRequest"));
        }

        // Atalho: se ja esta liquidada, nao precisa consultar o provedor. Corta a
        // maioria das chamadas, porque o webhook normalmente chega primeiro.
        if (donation.status === "COMPLETED") {
            return NextResponse.json({ status: "PAID" satisfies PixStatus });
        }

        if (donation.status === "EXPIRED" || donation.status === "FAILED") {
            return NextResponse.json({ status: "EXPIRED" satisfies PixStatus });
        }

        const remote = await checkPixStatus(pixId);

        if (remote.status === "PAID") {
            const outcome = await markDonationCompleted({
                ref: { by: "id", id: donationId },
                abacatePayChargeId: pixId,
            });

            // Divergencia aqui e sinal de problema de integracao, nao de UX.
            // O doador ve o sucesso; o log guarda o que precisa ser investigado.
            if (needsAttention(outcome)) {
                logApiError("donations-pix-check", new Error(describeOutcome(outcome)));
            }

            if (outcome.kind === "completed") revalidateDonationViews();

            const settled = outcome.kind === "completed" || outcome.kind === "already_completed";
            return NextResponse.json({
                status: (settled ? "PAID" : "PENDING") satisfies PixStatus,
            });
        }

        if (remote.status === "EXPIRED") {
            await markDonationExpired({ by: "id", id: donationId });
            return NextResponse.json({ status: "EXPIRED" satisfies PixStatus });
        }

        return NextResponse.json({ status: "PENDING" satisfies PixStatus });
    } catch (error) {
        return internalErrorResponse(
            "donations-pix-check",
            error,
            t("donations.pix.checkFailed"),
        );
    }
}
