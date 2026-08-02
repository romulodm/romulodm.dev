/**
 * settlement.ts
 *
 * Single implementation of a Donation's state transition. Lives here, in the
 * database package, because three consumers need the SAME rule:
 *
 *   - portfolio/app/api/donations/{pix,stripe}/webhook  (provider push)
 *   - portfolio/app/api/donations/pix/check             (client polling)
 *   - worker/workers/donations.worker.ts                (reconciliation)
 *
 * If each implemented its own version, one of them would eventually be left
 * without the state guard — which is exactly the bug this layer prevents.
 *
 * Invariants:
 *   1. COMPLETED is terminal. Nothing ever takes a donation out of COMPLETED.
 *      Webhooks arrive out of order; a late `payment_failed` cannot undo a
 *      `succeeded` that has already settled.
 *   2. Promoting requires a verified amount. If the provider reports a value
 *      different from the recorded one, it doesn't promote and reports it —
 *      it could be fraud or an integration bug.
 *   3. Every operation is idempotent. Redelivery of the same event has no effect.
 */

import { prisma } from "./index";

// ── Results

export type SettlementOutcome =
    /** Promoted now, from PENDING to COMPLETED. The only case with a real effect. */
    | { kind: "completed"; donationId: string; amount: number }
    /** Was already COMPLETED. Webhook redelivery lands here — not an error. */
    | { kind: "already_completed"; donationId: string }
    /**
     * A payment arrived and there's no matching row. The most serious case:
     * money came in and there's no record. Requires a human alert.
     */
    | { kind: "not_found"; reference: string }
    /** Paid amount diverges from the recorded one. Does not promote. Requires a human alert. */
    | { kind: "amount_mismatch"; donationId: string; expected: number; received: number }
    /**
     * The donation is in a terminal state other than COMPLETED (FAILED/EXPIRED)
     * and a payment confirmation arrived. A contradiction — doesn't resolve on its own.
     */
    | { kind: "terminal_state"; donationId: string; status: string };

/** Outcomes that require human intervention (used to decide whether to alert). */
export function needsAttention(outcome: SettlementOutcome): boolean {
    return (
        outcome.kind === "not_found" ||
        outcome.kind === "amount_mismatch" ||
        outcome.kind === "terminal_state"
    );
}

// ── Lookup

/**
 * How to identify the donation. Each provider delivers a different identifier,
 * and it isn't always the same one between the create and the webhook.
 */
export type DonationRef =
    | { by: "id"; id: string }
    | { by: "stripePaymentIntent"; paymentIntentId: string }
    | { by: "abacateCharge"; chargeId: string };

function refToWhere(ref: DonationRef) {
    switch (ref.by) {
        case "id":
            return { id: ref.id };
        case "stripePaymentIntent":
            return { stripePaymentIntentId: ref.paymentIntentId };
        case "abacateCharge":
            return { abacatePayChargeId: ref.chargeId };
    }
}

function refToString(ref: DonationRef): string {
    switch (ref.by) {
        case "id":
            return `donation:${ref.id}`;
        case "stripePaymentIntent":
            return `stripe_pi:${ref.paymentIntentId}`;
        case "abacateCharge":
            return `abacate_charge:${ref.chargeId}`;
    }
}

// ── Promotion

export interface MarkCompletedInput {
    ref: DonationRef;
    /**
     * Amount in cents reported by the provider. When present, it's checked
     * against `donation.amount` — a mismatch blocks the promotion.
     * Omit only when the provider doesn't report an amount in the payload.
     */
    paidAmount?: number;
    /** Fills `abacatePayChargeId` if it's still empty. */
    abacatePayChargeId?: string;
    /** Fills `stripePaymentIntentId` if it's still empty. */
    stripePaymentIntentId?: string;
}

/**
 * Takes a donation from PENDING to COMPLETED, respecting the invariants.
 * Safe to call in parallel: the promotion uses `updateMany` with the status in
 * the filter, so two concurrent executions result in a single transition.
 */
export async function markDonationCompleted(
    input: MarkCompletedInput,
): Promise<SettlementOutcome> {
    const where = refToWhere(input.ref);

    const donation = await prisma.donation.findFirst({
        where,
        select: { id: true, status: true, amount: true, currency: true },
    });

    if (!donation) {
        return { kind: "not_found", reference: refToString(input.ref) };
    }

    if (donation.status === "COMPLETED") {
        return { kind: "already_completed", donationId: donation.id };
    }

    if (donation.status !== "PENDING") {
        // FAILED or EXPIRED receiving a payment confirmation. We don't decide
        // this on our own: promoting could release a value that was refunded,
        // and ignoring it could hide a legitimate payment from a reused QR code.
        return { kind: "terminal_state", donationId: donation.id, status: donation.status };
    }

    // Crypto has a different scale (wei) and a different verification flow — the
    // amount check here only applies to currencies denominated in cents.
    if (
        input.paidAmount !== undefined &&
        donation.currency !== "ETH" &&
        input.paidAmount !== donation.amount
    ) {
        return {
            kind: "amount_mismatch",
            donationId: donation.id,
            expected: donation.amount,
            received: input.paidAmount,
        };
    }

    const { count } = await prisma.donation.updateMany({
        // The status in the filter is the concurrency guard: if another process
        // promoted it between the findFirst and here, this update hits zero rows.
        where: { id: donation.id, status: "PENDING" },
        data: {
            status: "COMPLETED",
            ...(input.abacatePayChargeId ? { abacatePayChargeId: input.abacatePayChargeId } : {}),
            ...(input.stripePaymentIntentId
                ? { stripePaymentIntentId: input.stripePaymentIntentId }
                : {}),
        },
    });

    if (count === 0) {
        // Lost the race — the other process already completed it. Idempotent.
        return { kind: "already_completed", donationId: donation.id };
    }

    return { kind: "completed", donationId: donation.id, amount: donation.amount };
}

// ── Negative terminal states

/**
 * Marks as FAILED, but only from PENDING. Never downgrades COMPLETED —
 * this is the guard that was missing in the Stripe webhook, where an
 * out-of-order `payment_intent.payment_failed` used to revert a settled donation.
 */
export async function markDonationFailed(ref: DonationRef): Promise<"failed" | "ignored"> {
    const { count } = await prisma.donation.updateMany({
        where: { ...refToWhere(ref), status: "PENDING" },
        data: { status: "FAILED" },
    });
    return count > 0 ? "failed" : "ignored";
}

/**
 * Marks expired QR codes/intents as EXPIRED.
 *
 * Without this, every abandoned checkout stays PENDING forever and the
 * "PENDING for over 24h" alert — which exists to detect a broken webhook —
 * fills up with noise and stops serving its purpose.
 */
export async function markDonationExpired(ref: DonationRef): Promise<"expired" | "ignored"> {
    const { count } = await prisma.donation.updateMany({
        where: { ...refToWhere(ref), status: "PENDING" },
        data: { status: "EXPIRED" },
    });
    return count > 0 ? "expired" : "ignored";
}

// ── Description for log/alert

export function describeOutcome(outcome: SettlementOutcome): string {
    switch (outcome.kind) {
        case "completed":
            return `doacao ${outcome.donationId} confirmada (${outcome.amount} centavos)`;
        case "already_completed":
            return `doacao ${outcome.donationId} ja estava confirmada`;
        case "not_found":
            return `pagamento recebido sem doacao correspondente (${outcome.reference})`;
        case "amount_mismatch":
            return `valor divergente na doacao ${outcome.donationId}: esperado ${outcome.expected}, recebido ${outcome.received}`;
        case "terminal_state":
            return `doacao ${outcome.donationId} esta em ${outcome.status} e recebeu confirmacao de pagamento`;
    }
}
