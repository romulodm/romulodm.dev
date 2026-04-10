import { type JobsOptions, type Job, Worker } from "bullmq";
import { prisma } from "@romulo/database";

import {
  buildCampaignJobId,
  buildEmailMessageId,
  buildTransactionalJobId,
  createRedisConnection,
  defaultJobOptions,
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

export type TransactionalJobContext = Pick<Job<TransactionalEmailJob>, "data">;
export type CampaignJobContext = Pick<Job<CampaignEmailJob>, "data" | "attemptsMade" | "opts">;

export async function markCampaignCompleteIfDone(campaignId: string) {
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

function getAppName() {
  return process.env.NEXT_PUBLIC_APP_NAME ?? "Your Blog";
}

function isFinalAttempt(job: { attemptsMade: number; opts: JobsOptions }) {
  const configuredAttempts = job.opts.attempts ?? defaultJobOptions?.attempts ?? 1;
  return job.attemptsMade + 1 >= configuredAttempts;
}

export async function processTransactionalEmailJob(job: TransactionalJobContext) {
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

export async function processCampaignEmailJob(job: CampaignJobContext) {
  const { data } = job;

  const recipient = await prisma.campaignRecipient.findUnique({
    where: { id: data.recipientId },
  });
  if (!recipient || recipient.status !== "PENDING") {
    return;
  }

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

    const updatedRecipient = await prisma.campaignRecipient.updateMany({
      where: { id: data.recipientId, status: "PENDING" },
      data: {
        status: "SENT",
        sentAt: new Date(),
        errorMessage: null,
      },
    });

    if (updatedRecipient.count > 0) {
      await prisma.campaign.update({
        where: { id: data.campaignId },
        data: { sentCount: { increment: 1 } },
      });
    }

    console.log(`[CampaignWorker] Sent to ${data.email} (campaign ${data.campaignId})`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (isFinalAttempt(job)) {
      const failedRecipient = await prisma.campaignRecipient.updateMany({
        where: { id: data.recipientId, status: "PENDING" },
        data: { status: "FAILED", errorMessage: message.slice(0, 500) },
      });

      if (failedRecipient.count > 0) {
        await prisma.campaign.update({
          where: { id: data.campaignId },
          data: { failedCount: { increment: 1 } },
        });
      }
    }

    console.error(`[CampaignWorker] Failed for ${data.email}: ${message}`);
    throw error;
  } finally {
    await markCampaignCompleteIfDone(data.campaignId).catch((error) =>
      console.error("[CampaignWorker] markCampaignCompleteIfDone error:", error),
    );
  }
}

const redis = createRedisConnection();

export const transactionalWorker = new Worker<TransactionalEmailJob>(
  QUEUE_TRANSACTIONAL,
  processTransactionalEmailJob,
  { connection: redis, concurrency: 10 },
);

export const campaignWorker = new Worker<CampaignEmailJob>(
  QUEUE_CAMPAIGN,
  processCampaignEmailJob,
  {
    connection: redis,
    concurrency: 20,
    limiter: { max: 50, duration: 1000 },
  },
);
