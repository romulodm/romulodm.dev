/**
 * email.worker.ts
 *
 * Defines the processing logic for two BullMQ queues:
 *   - QUEUE_TRANSACTIONAL: one-off emails triggered by user actions
 *     (confirmation, welcome, unsubscribe, password reset).
 *   - QUEUE_CAMPAIGN: bulk campaign emails sent to many recipients,
 *     with rate limiting and per-recipient status tracking in Postgres.
 *
 * Workers are NOT instantiated at module level. Instead, `startEmailWorkers(redis)`
 * must be called explicitly from the app entry point (index.ts) after all modules
 * have finished loading. This avoids circular-dependency crashes where
 * `queueRuntimeConfig` would be `undefined` at import time.
 *
 * Each queue uses its own isolated EmailService instance:
 *   - processTransactionalEmailJob → transactionalEmailService (no rate limit)
 *   - processCampaignEmailJob      → campaignEmailService (rate-limited pool)
 *
 * This separation ensures that a campaign burst never delays a transactional
 * email: nodemailer's pool rate limiter is global per transporter instance, so
 * sharing a single emailService would serialise all sends behind the campaign
 * rate limit.
 */

import { type JobsOptions, type Job, Worker } from "bullmq";
import type { Redis } from "ioredis";
import { prisma } from "@romulo/database";

import {
  buildCampaignJobId,
  buildEmailMessageId,
  buildTransactionalJobId,
  defaultJobOptions,
  queueRuntimeConfig,
  QUEUE_CAMPAIGN,
  QUEUE_TRANSACTIONAL,
  type CampaignEmailJob,
  type TransactionalEmailJob,
} from "@romulo/queues";

// Import isolated service instances — each has its own transporter pool and
// circuit breaker so neither queue can interfere with the other.
import { transactionalEmailService, campaignEmailService } from "../lib/email/email.service";
import {
  campaignTemplate,
  confirmationTemplate,
  passwordResetTemplate,
  unsubscribeConfirmTemplate,
  welcomeTemplate,
  type BrandConfig,
} from "@romulo/templates";

// ── Brand config ──────────────────────────────────────────────────────────────

const BRAND: BrandConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "romulodm",
  baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://romulodm.com.br",
  accentColor: "#f57842",
};

// ── Type aliases for job handler contexts ────────────────────────────────────

/** Only the fields needed to process a transactional email job. */
export type TransactionalJobContext = Pick<Job<TransactionalEmailJob>, "data">;

/** Fields needed to process a campaign email job, including retry metadata. */
export type CampaignJobContext = Pick<Job<CampaignEmailJob>, "data" | "attemptsMade" | "opts">;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns true if the current attempt is the last one allowed for this job.
 * Used to decide whether to mark a campaign recipient as permanently FAILED
 * instead of leaving it in PENDING for a future retry.
 */
function isFinalAttempt(job: { attemptsMade: number; opts: JobsOptions }): boolean {
  const configuredAttempts = job.opts.attempts ?? defaultJobOptions?.attempts ?? 1;
  return job.attemptsMade + 1 >= configuredAttempts;
}

// ── Campaign completion check ─────────────────────────────────────────────────

/**
 * After each campaign email is processed (sent or failed), checks whether
 * all recipients have been handled. If so, marks the campaign as SENT.
 */
export async function markCampaignCompleteIfDone(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      status: true,
      totalRecipients: true,
      sentCount: true,
      failedCount: true,
    },
  });

  if (!campaign || campaign.status !== "SENDING") return;

  const done = campaign.sentCount + campaign.failedCount;
  if (done >= campaign.totalRecipients) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "SENT", sentAt: new Date() },
    });
    console.log(`[CampaignWorker] Campaign ${campaignId} completed -> SENT`);
  }
}

// ── Job processors ────────────────────────────────────────────────────────────

/**
 * Handles a single transactional email job.
 *
 * Uses `transactionalEmailService` which has no SMTP rate limiting, so these
 * sends are never queued behind campaign traffic.
 */
export async function processTransactionalEmailJob(job: TransactionalJobContext): Promise<void> {
  const { data } = job;
  const messageId = buildEmailMessageId("transactional", buildTransactionalJobId(data));

  switch (data.type) {
    case "CONFIRMATION":
      await transactionalEmailService.send({
        to: data.email,
        subject: `Confirme sua inscrição - ${BRAND.name}`,
        html: confirmationTemplate({ confirmationUrl: data.confirmationUrl, brand: BRAND }),
        messageId,
      });
      return;

    case "WELCOME":
      await transactionalEmailService.send({
        to: data.email,
        subject: `Bem-vindo(a) à newsletter de ${BRAND.name}!`,
        html: welcomeTemplate({ unsubscribeUrl: data.unsubscribeUrl, brand: BRAND }),
        messageId,
      });
      return;

    case "UNSUBSCRIBE_CONFIRM":
      await transactionalEmailService.send({
        to: data.email,
        subject: `Confirme o cancelamento - ${BRAND.name}`,
        html: unsubscribeConfirmTemplate({ unsubscribeUrl: data.unsubscribeUrl, brand: BRAND }),
        messageId,
      });
      return;

    case "PASSWORD_RESET":
      await transactionalEmailService.send({
        to: data.email,
        subject: `Seu código de recuperação - ${BRAND.name}`,
        html: passwordResetTemplate({
          code: data.code,
          expiresInMinutes: data.expiresInMinutes,
          brand: BRAND,
        }),
        messageId,
      });
      return;

    default:
      throw new Error(`Unknown transactional job type: ${(data as { type: string }).type}`);
  }
}

/**
 * Handles a single campaign email job.
 *
 * Uses `campaignEmailService` which applies SMTP rate limiting at the pool
 * level. Keeping campaign sends on their own instance means the rate limiter
 * never blocks transactional sends.
 *
 * Flow:
 * 1. Fetch the recipient row — skip if already processed (idempotency guard).
 * 2. Send the email.
 * 3. On success: mark recipient SENT and increment campaign.sentCount.
 * 4. On failure: if this is the final retry, mark recipient FAILED and
 *    increment campaign.failedCount.
 * 5. Always: check whether the campaign is now fully complete.
 */
export async function processCampaignEmailJob(job: CampaignJobContext): Promise<void> {
  const { data } = job;

  const recipient = await prisma.campaignRecipient.findUnique({
    where: { id: data.recipientId },
  });
  if (!recipient || recipient.status !== "PENDING") return;

  const deliveryId = buildCampaignJobId(data);

  try {
    await campaignEmailService.send({
      to: data.email,
      subject: data.subject,
      html: campaignTemplate({
        subject: data.subject,
        content: data.content,
        unsubscribeUrl: data.unsubscribeUrl,
        trackingPixelUrl: data.trackingPixelUrl,
        brand: BRAND,
      }),
      messageId: buildEmailMessageId("campaign", deliveryId),
    });

    const updated = await prisma.campaignRecipient.updateMany({
      where: { id: data.recipientId, status: "PENDING" },
      data: { status: "SENT", sentAt: new Date(), errorMessage: null },
    });

    if (updated.count > 0) {
      await prisma.campaign.update({
        where: { id: data.campaignId },
        data: { sentCount: { increment: 1 } },
      });
    }

    console.log(`[CampaignWorker] Sent to ${data.email} (campaign ${data.campaignId})`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (isFinalAttempt(job)) {
      const failed = await prisma.campaignRecipient.updateMany({
        where: { id: data.recipientId, status: "PENDING" },
        data: { status: "FAILED", errorMessage: message.slice(0, 500) },
      });

      if (failed.count > 0) {
        await prisma.campaign.update({
          where: { id: data.campaignId },
          data: { failedCount: { increment: 1 } },
        });
      }
    }

    console.error(`[CampaignWorker] Failed for ${data.email}: ${message}`);
    throw error;
  } finally {
    await markCampaignCompleteIfDone(data.campaignId).catch((err) =>
      console.error("[CampaignWorker] markCampaignCompleteIfDone error:", err),
    );
  }
}

// ── Worker factory ────────────────────────────────────────────────────────────

export function startEmailWorkers(redis: Redis) {
  const transactionalWorker = new Worker<TransactionalEmailJob>(
    QUEUE_TRANSACTIONAL,
    processTransactionalEmailJob,
    {
      connection: redis,
      concurrency: queueRuntimeConfig.transactionalWorkerConcurrency,
    },
  );

  const campaignWorker = new Worker<CampaignEmailJob>(
    QUEUE_CAMPAIGN,
    processCampaignEmailJob,
    {
      connection: redis,
      concurrency: queueRuntimeConfig.campaignWorkerConcurrency,
      limiter: {
        max: queueRuntimeConfig.campaignRateLimitMax,
        duration: queueRuntimeConfig.campaignRateLimitDurationMs,
      },
    },
  );

  return { transactionalWorker, campaignWorker };
}