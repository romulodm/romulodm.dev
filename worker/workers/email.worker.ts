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

import { emailService } from "../lib/email/email.service";
import {
  campaignTemplate,
  confirmationTemplate,
  passwordResetTemplate,
  unsubscribeConfirmTemplate,
  welcomeTemplate,
} from "../lib/email/templates";

// ── Type aliases for job handler contexts ────────────────────────────────────

/** Only the fields needed to process a transactional email job. */
export type TransactionalJobContext = Pick<Job<TransactionalEmailJob>, "data">;

/** Fields needed to process a campaign email job, including retry metadata. */
export type CampaignJobContext = Pick<Job<CampaignEmailJob>, "data" | "attemptsMade" | "opts">;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAppName(): string {
  return process.env.NEXT_PUBLIC_APP_NAME ?? "Your Blog";
}

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
 *
 * Uses `sentCount + failedCount >= totalRecipients` as the completion signal,
 * so it handles both partial failures and full success.
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
 * Each job type maps to a specific email template and subject line.
 * A stable `messageId` is derived from the job payload so that retries
 * don't produce duplicate Message-ID headers.
 */
export async function processTransactionalEmailJob(job: TransactionalJobContext): Promise<void> {
  const { data } = job;
  const messageId = buildEmailMessageId("transactional", buildTransactionalJobId(data));

  switch (data.type) {
    case "CONFIRMATION":
      await emailService.send({
        to: data.email,
        subject: `Confirme sua inscrição - ${getAppName()}`,
        html: confirmationTemplate(data.confirmationUrl),
        messageId,
      });
      return;

    case "WELCOME":
      await emailService.send({
        to: data.email,
        subject: `Bem-vindo(a) à newsletter de ${getAppName()}!`,
        html: welcomeTemplate(data.unsubscribeUrl),
        messageId,
      });
      return;

    case "UNSUBSCRIBE_CONFIRM":
      await emailService.send({
        to: data.email,
        subject: `Confirme o cancelamento - ${getAppName()}`,
        html: unsubscribeConfirmTemplate(data.unsubscribeUrl),
        messageId,
      });
      return;

    case "PASSWORD_RESET":
      await emailService.send({
        to: data.email,
        subject: `Seu código de recuperação - ${getAppName()}`,
        html: passwordResetTemplate({
          code: data.code,
          expiresInMinutes: data.expiresInMinutes,
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
 * Flow:
 * 1. Fetch the recipient row — skip if already processed (idempotency guard).
 * 2. Send the email.
 * 3. On success: mark recipient SENT and increment campaign.sentCount.
 * 4. On failure: if this is the final retry, mark recipient FAILED and
 *    increment campaign.failedCount.
 * 5. Always: check whether the campaign is now fully complete.
 *
 * The `updateMany` with `status: "PENDING"` filter acts as an optimistic lock,
 * preventing double-counting if two workers somehow race on the same recipient.
 */
export async function processCampaignEmailJob(job: CampaignJobContext): Promise<void> {
  const { data } = job;

  // Idempotency: skip if this recipient was already handled by a previous attempt
  const recipient = await prisma.campaignRecipient.findUnique({
    where: { id: data.recipientId },
  });
  if (!recipient || recipient.status !== "PENDING") return;

  const deliveryId = buildCampaignJobId(data);

  try {
    await emailService.send({
      to: data.email,
      subject: data.subject,
      html: campaignTemplate({
        subject: data.subject,
        content: data.content,
        unsubscribeUrl: data.unsubscribeUrl,
        trackingPixelUrl: data.trackingPixelUrl,
      }),
      messageId: buildEmailMessageId("campaign", deliveryId),
    });

    // Only count as sent if the row was still PENDING (race-condition guard)
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

    // Only persist the failure on the last retry to avoid premature FAILED status
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
    throw error; // Re-throw so BullMQ can schedule the next retry
  } finally {
    // Always check completion, even after a failure, so the campaign doesn't
    // get stuck in SENDING if the last job failed.
    await markCampaignCompleteIfDone(data.campaignId).catch((err) =>
      console.error("[CampaignWorker] markCampaignCompleteIfDone error:", err),
    );
  }
}

// ── Worker factory ────────────────────────────────────────────────────────────

/**
 * Creates and returns the transactional and campaign BullMQ workers.
 *
 * Accepts a shared `redis` connection from the caller (index.ts) so that
 * the app controls connection lifecycle and avoids creating multiple
 * redundant connections.
 *
 * Call this function once, inside `main()`, after all module imports have
 * resolved — never at the top level of a module.
 */
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
        // Caps outbound email rate to avoid hitting ESP rate limits
        max: queueRuntimeConfig.campaignRateLimitMax,
        duration: queueRuntimeConfig.campaignRateLimitDurationMs,
      },
    },
  );

  return { transactionalWorker, campaignWorker };
}