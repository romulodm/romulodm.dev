// lib/payments/webhook-events.ts

import { Prisma, prisma } from "@romulo/database";

import { logApiError } from "@/lib/api-errors";

type WebhookProvider = "PIX" | "STRIPE";

interface RecordedEvent {
    /** Id of the row in WebhookEvent, used to close the cycle later. */
    id: string;
    /**
     * true when this eventId had already been recorded before. The handler should
     * respond 200 and not repeat the processing.
     */
    duplicate: boolean;
}

/**
 * Records the raw event. If the (provider, eventId) pair already exists, returns
 * `duplicate: true` instead of throwing.
 *
 * The insert itself is the lock: relying on a `findFirst` before the `create` would open
 * a race window between two simultaneous deliveries of the same event.
 */
export async function recordWebhookEvent(params: {
    provider: WebhookProvider;
    eventId: string;
    eventType: string;
    payload: unknown;
    donationId?: string | null;
}): Promise<RecordedEvent> {
    try {
        const created = await prisma.webhookEvent.create({
            data: {
                provider: params.provider,
                eventId: params.eventId,
                eventType: params.eventType,
                payload: (params.payload ?? {}) as Prisma.InputJsonValue,
                donationId: params.donationId ?? null,
                status: "RECEIVED",
            },
            select: { id: true },
        });
        return { id: created.id, duplicate: false };
    } catch (error) {
        // P2002 = unique violation. Means redelivery, not failure.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const existing = await prisma.webhookEvent.findUnique({
                where: {
                    provider_eventId: { provider: params.provider, eventId: params.eventId },
                },
                select: { id: true },
            });
            return { id: existing?.id ?? "", duplicate: true };
        }
        throw error;
    }
}

type FinalStatus = "PROCESSED" | "IGNORED" | "FAILED";

/**
 * Closes the event cycle. Never throws: if the log fails, the payment itself has already
 * been handled, and bringing down the handler would cause the provider to redeliver unnecessarily.
 */
export async function finalizeWebhookEvent(
    id: string,
    status: FinalStatus,
    extra?: { donationId?: string | null; error?: string },
): Promise<void> {
    if (!id) return;
    try {
        await prisma.webhookEvent.update({
            where: { id },
            data: {
                status,
                processedAt: new Date(),
                ...(extra?.donationId !== undefined ? { donationId: extra.donationId } : {}),
                ...(extra?.error ? { error: extra.error.slice(0, 1000) } : {}),
            },
        });
    } catch (error) {
        logApiError("webhook-events-finalize", error, { webhookEventId: id, status });
    }
}

/**
 * AbacatePay doesn't send an event id in the payload, so we derive a stable
 * dedupe key. `billing.paid` for the same charge is always the same logical
 * fact, which is exactly what we want to deduplicate.
 */
export function buildAbacateEventId(eventType: string, chargeId: string | undefined): string {
    return `${eventType}:${chargeId ?? "unknown"}`;
}
