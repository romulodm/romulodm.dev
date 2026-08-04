/**
 * Reconciliacao de doacoes contra o Postgres real, com o provedor falsificado.
 *
 * O que se prova aqui e o cenario que nenhum teste de webhook alcanca: o
 * pagamento aconteceu no provedor e a notificacao nunca chegou. O provedor e
 * stubado (nao ha como pagar de verdade num teste), mas o banco e real, porque
 * o que importa e a transicao de estado e a idempotencia.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@romulo/database";
import {
    cleanupIntegrationFixtures,
    createTestDonation,
    uniqueToken,
} from "../../../testing/integration/fixtures";

/*
 * Observabilidade e alertas ficam de fora.
 *
 * Nao e so para reduzir ruido: `lib/sentry` roda `Sentry.init` no import quando
 * ha SENTRY_DSN no ambiente — e o setup de integracao carrega o .env real. Isso
 * ligaria a auto-instrumentacao de bullmq, ioredis, prisma e http no meio do
 * teste, deixando handles abertos e o processo pendurado.
 *
 * Mockar tambem permite verificar que o alerta de webhook perdido dispara.
 */
const sendWorkerAlert = vi.fn();

vi.mock("../../lib/worker-observability", () => ({
    logWorkerEvent: vi.fn(),
    logWorkerError: vi.fn(),
}));

vi.mock("../../lib/alerts", () => ({
    sendWorkerAlert: (...args: unknown[]) => sendWorkerAlert(...args),
    sendWorkerAlertAsync: vi.fn(),
}));

// A chave precisa existir, senao checkAbacateCharge nem chama o provedor.
process.env.ABACATE_PAY_API_KEY ??= "test-abacate-key";
// Sem STRIPE_SECRET_KEY o ramo do Stripe e pulado — e o que queremos aqui.
delete process.env.STRIPE_SECRET_KEY;

const { reconcilePendingDonations } = await import("../../workers/donations.worker");

/** Resposta do /pixQrCode/check no formato que o worker espera. */
function abacateReplies(statusByChargeId: Record<string, string>) {
    vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) => {
            const id = new URL(String(url)).searchParams.get("id") ?? "";
            const status = statusByChargeId[id];
            if (!status) {
                return { ok: false, json: async () => ({ error: "not found" }) } as unknown as Response;
            }
            return {
                ok: true,
                json: async () => ({ data: { status }, error: null }),
            } as unknown as Response;
        }),
    );
}

async function statusOf(id: string) {
    const row = await prisma.donation.findUnique({ where: { id }, select: { status: true } });
    return row?.status;
}

describe("donations reconcile integration", () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
        sendWorkerAlert.mockClear();
    });

    afterEach(async () => {
        vi.unstubAllGlobals();
        await cleanupIntegrationFixtures();
    });

    it("recupera pagamento que o webhook perdeu", async () => {
        const chargeId = uniqueToken("charge");
        const donation = await createTestDonation({ abacatePayChargeId: chargeId });

        abacateReplies({ [chargeId]: "PAID" });

        const summary = await reconcilePendingDonations();

        expect(summary.recovered).toBeGreaterThanOrEqual(1);
        expect(await statusOf(donation.id)).toBe("COMPLETED");

        /*
         * Recuperar aqui significa que o webhook nao entregou. Corrigir em
         * silencio deixaria um webhook quebrado passar despercebido por semanas,
         * entao o alerta faz parte do comportamento esperado.
         */
        expect(sendWorkerAlert).toHaveBeenCalledWith(
            expect.objectContaining({ event: "donations.webhook_missed" }),
        );
    });

    it("marca EXPIRED o QR vencido, para nao poluir o alerta de PENDING", async () => {
        const chargeId = uniqueToken("charge");
        const donation = await createTestDonation({ abacatePayChargeId: chargeId });

        abacateReplies({ [chargeId]: "EXPIRED" });

        const summary = await reconcilePendingDonations();

        expect(summary.expired).toBeGreaterThanOrEqual(1);
        expect(await statusOf(donation.id)).toBe("EXPIRED");
    });

    it("deixa em paz o que ainda esta pendente no provedor", async () => {
        const chargeId = uniqueToken("charge");
        const donation = await createTestDonation({ abacatePayChargeId: chargeId });

        abacateReplies({ [chargeId]: "PENDING" });

        await reconcilePendingDonations();

        expect(await statusOf(donation.id)).toBe("PENDING");
    });

    it("rodar duas vezes nao recupera a mesma doacao de novo", async () => {
        const chargeId = uniqueToken("charge");
        const donation = await createTestDonation({ abacatePayChargeId: chargeId });

        abacateReplies({ [chargeId]: "PAID" });

        const first = await reconcilePendingDonations();
        const second = await reconcilePendingDonations();

        expect(first.recovered).toBeGreaterThanOrEqual(1);
        // Na segunda passada a doacao ja nao esta mais PENDING, entao nem e varrida.
        expect(second.recovered).toBe(0);
        expect(await statusOf(donation.id)).toBe("COMPLETED");
    });

    it("ignora doacao antiga, fora da janela de reconciliacao", async () => {
        const chargeId = uniqueToken("charge");
        const old = new Date();
        old.setDate(old.getDate() - 60);

        const donation = await createTestDonation({
            abacatePayChargeId: chargeId,
            createdAt: old,
        });

        abacateReplies({ [chargeId]: "PAID" });

        await reconcilePendingDonations();

        expect(await statusOf(donation.id)).toBe("PENDING");
    });

    it("nao quebra com doacao sem id de cobranca do provedor", async () => {
        // Acontece quando o create falha entre o insert e o retorno da API.
        const donation = await createTestDonation({ abacatePayChargeId: null });

        abacateReplies({});

        const summary = await reconcilePendingDonations();

        expect(summary.errors).toBe(0);
        expect(await statusOf(donation.id)).toBe("PENDING");
    });

    it("provedor indisponivel nao altera estado nem conta como erro fatal", async () => {
        const chargeId = uniqueToken("charge");
        const donation = await createTestDonation({ abacatePayChargeId: chargeId });

        // Chave ausente no mapa => resposta !ok => checkAbacateCharge devolve null.
        abacateReplies({});

        await reconcilePendingDonations();

        expect(await statusOf(donation.id)).toBe("PENDING");
    });
});
