/**
 * Invariantes de transicao de estado de Donation, contra o Postgres real.
 *
 * Estas regras existem porque tres caminhos diferentes promovem doacao —
 * webhook, polling do cliente e reconciliacao do worker. Mock nao serve aqui:
 * a guarda de concorrencia depende do `updateMany ... WHERE status = 'PENDING'`
 * ser atomico no banco, e isso so se prova com banco de verdade.
 */
import { afterEach, describe, expect, it } from "vitest";

import {
    prisma,
    markDonationCompleted,
    markDonationFailed,
    markDonationExpired,
    needsAttention,
} from "@romulo/database";
import {
    cleanupIntegrationFixtures,
    createTestDonation,
    uniqueToken,
} from "../../../../testing/integration/fixtures";

async function statusOf(id: string) {
    const row = await prisma.donation.findUnique({ where: { id }, select: { status: true } });
    return row?.status;
}

describe("settlement integration", () => {
    afterEach(async () => {
        await cleanupIntegrationFixtures();
    });

    // ── Promocao ──────────────────────────────────────────────────────────────

    it("promove PENDING para COMPLETED", async () => {
        const donation = await createTestDonation({ amount: 500 });

        const outcome = await markDonationCompleted({
            ref: { by: "id", id: donation.id },
            paidAmount: 500,
        });

        expect(outcome.kind).toBe("completed");
        expect(await statusOf(donation.id)).toBe("COMPLETED");
    });

    it("segunda chamada e no-op idempotente", async () => {
        const donation = await createTestDonation();

        const first = await markDonationCompleted({ ref: { by: "id", id: donation.id } });
        const second = await markDonationCompleted({ ref: { by: "id", id: donation.id } });

        expect(first.kind).toBe("completed");
        expect(second.kind).toBe("already_completed");
        expect(needsAttention(second)).toBe(false);
        expect(await statusOf(donation.id)).toBe("COMPLETED");
    });

    it("preenche abacatePayChargeId quando ainda estava vazio", async () => {
        const donation = await createTestDonation({ abacatePayChargeId: null });
        const chargeId = uniqueToken("charge");

        await markDonationCompleted({
            ref: { by: "id", id: donation.id },
            abacatePayChargeId: chargeId,
        });

        const row = await prisma.donation.findUnique({
            where: { id: donation.id },
            select: { abacatePayChargeId: true },
        });
        expect(row?.abacatePayChargeId).toBe(chargeId);
    });

    // ── Conferencia de valor ──────────────────────────────────────────────────

    it("valor divergente nao promove e sinaliza para revisao", async () => {
        const donation = await createTestDonation({ amount: 500 });

        const outcome = await markDonationCompleted({
            ref: { by: "id", id: donation.id },
            paidAmount: 100,
        });

        expect(outcome.kind).toBe("amount_mismatch");
        expect(needsAttention(outcome)).toBe(true);
        // O ponto do teste: a doacao continua intocada.
        expect(await statusOf(donation.id)).toBe("PENDING");
    });

    it("nao confere valor em cripto, que usa outra escala", async () => {
        const donation = await createTestDonation({
            provider: "ETH",
            currency: "ETH",
            amount: 1000,
        });

        const outcome = await markDonationCompleted({
            ref: { by: "id", id: donation.id },
            paidAmount: 999,
        });

        expect(outcome.kind).toBe("completed");
    });

    // ── Estados terminais ─────────────────────────────────────────────────────

    it("referencia inexistente devolve not_found em vez de falhar em silencio", async () => {
        const outcome = await markDonationCompleted({
            ref: { by: "id", id: "id-que-nao-existe" },
        });

        expect(outcome.kind).toBe("not_found");
        expect(needsAttention(outcome)).toBe(true);
    });

    it("doacao EXPIRED que recebe pagamento nao e promovida sozinha", async () => {
        const donation = await createTestDonation({ status: "EXPIRED" });

        const outcome = await markDonationCompleted({ ref: { by: "id", id: donation.id } });

        expect(outcome.kind).toBe("terminal_state");
        expect(needsAttention(outcome)).toBe(true);
        expect(await statusOf(donation.id)).toBe("EXPIRED");
    });

    /*
     * A invariante central. Era o bug do webhook do Stripe: um
     * `payment_intent.payment_failed` atrasado — webhook nao garante ordem —
     * rebaixava uma doacao ja liquidada.
     */
    it("NUNCA rebaixa COMPLETED para FAILED", async () => {
        const donation = await createTestDonation({ status: "COMPLETED" });

        const result = await markDonationFailed({ by: "id", id: donation.id });

        expect(result).toBe("ignored");
        expect(await statusOf(donation.id)).toBe("COMPLETED");
    });

    it("marca FAILED a partir de PENDING", async () => {
        const donation = await createTestDonation({ status: "PENDING" });

        expect(await markDonationFailed({ by: "id", id: donation.id })).toBe("failed");
        expect(await statusOf(donation.id)).toBe("FAILED");
    });

    it("EXPIRED so vale a partir de PENDING", async () => {
        const pending = await createTestDonation({ status: "PENDING" });
        const completed = await createTestDonation({ status: "COMPLETED" });

        expect(await markDonationExpired({ by: "id", id: pending.id })).toBe("expired");
        expect(await markDonationExpired({ by: "id", id: completed.id })).toBe("ignored");

        expect(await statusOf(pending.id)).toBe("EXPIRED");
        expect(await statusOf(completed.id)).toBe("COMPLETED");
    });

    // ── Localizacao por identificador do provedor ─────────────────────────────

    it("localiza por payment intent do Stripe", async () => {
        const intentId = uniqueToken("pi");
        const donation = await createTestDonation({
            provider: "STRIPE",
            stripePaymentIntentId: intentId,
        });

        const outcome = await markDonationCompleted({
            ref: { by: "stripePaymentIntent", paymentIntentId: intentId },
        });

        expect(outcome.kind).toBe("completed");
        expect(await statusOf(donation.id)).toBe("COMPLETED");
    });

    it("localiza por cobranca do AbacatePay", async () => {
        const chargeId = uniqueToken("charge");
        const donation = await createTestDonation({ abacatePayChargeId: chargeId });

        const outcome = await markDonationCompleted({
            ref: { by: "abacateCharge", chargeId },
        });

        expect(outcome.kind).toBe("completed");
        expect(await statusOf(donation.id)).toBe("COMPLETED");
    });

    // ── Concorrencia ──────────────────────────────────────────────────────────

    /*
     * Webhook, polling e reconciliacao podem tratar o mesmo pagamento ao mesmo
     * tempo. Sem o status no WHERE do update, os tres promoveriam — inofensivo
     * hoje, mas fatal quando houver efeito colateral (e-mail, notificacao).
     */
    it("promocoes simultaneas resultam em exatamente uma transicao", async () => {
        const donation = await createTestDonation();

        const results = await Promise.all([
            markDonationCompleted({ ref: { by: "id", id: donation.id } }),
            markDonationCompleted({ ref: { by: "id", id: donation.id } }),
            markDonationCompleted({ ref: { by: "id", id: donation.id } }),
        ]);

        const completed = results.filter((r) => r.kind === "completed");
        const already = results.filter((r) => r.kind === "already_completed");

        expect(completed).toHaveLength(1);
        expect(already).toHaveLength(2);
        expect(await statusOf(donation.id)).toBe("COMPLETED");
    });
});
