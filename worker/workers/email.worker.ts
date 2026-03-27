// worker/workers/newsletter.worker.ts

import { Worker } from "bullmq";
import { prisma } from "@romulo/database";

import {
  createRedisConnection,
  QUEUE_TRANSACTIONAL,
  QUEUE_CAMPAIGN,
  type TransactionalEmailJob,
  type CampaignEmailJob,
} from "@romulo/queues";

import { emailService } from "../lib/email/email.service";
import {
  confirmationTemplate,
  welcomeTemplate,
  unsubscribeConfirmTemplate,
  campaignTemplate,
} from "../lib/email/templates";


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
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });
    console.log(`[dispatchCampaign] Campaign ${campaignId} completed — status → SENT`);
  }
}

function getAppName() {
  return process.env.NEXT_PUBLIC_APP_NAME ?? "Your Blog";
}

const redis = createRedisConnection();

// ── Transactional Worker ─────────────────────────────────────────────────────

export const transactionalWorker = new Worker<TransactionalEmailJob>(
  QUEUE_TRANSACTIONAL,
  async (job) => {
    const { data } = job;

    switch (data.type) {
      case "CONFIRMATION":
        await emailService.send({
          to: data.email,
          subject: `Confirme sua inscrição — ${getAppName()}`,
          html: confirmationTemplate(data.confirmationUrl),
        });
        break;

      case "WELCOME":
        await emailService.send({
          to: data.email,
          subject: `Bem-vindo(a) à newsletter de ${getAppName()}! 🎉`,
          html: welcomeTemplate(data.unsubscribeUrl),
        });
        break;

      case "UNSUBSCRIBE_CONFIRM":
        await emailService.send({
          to: data.email,
          subject: `Confirme o cancelamento — ${getAppName()}`,
          html: unsubscribeConfirmTemplate(data.unsubscribeUrl),
        });
        break;

      default:
        throw new Error(
          `Unknown transactional job type: ${(data as { type: string }).type}`,
        );
    }
  },
  { connection: redis, concurrency: 10 },
);

// ── Campaign Worker ──────────────────────────────────────────────────────────

export const campaignWorker = new Worker<CampaignEmailJob>(
  QUEUE_CAMPAIGN,
  async (job) => {
    const { data } = job;

    // Skip if already sent (idempotency guard)
    const recipient = await prisma.campaignRecipient.findUnique({
      where: { id: data.recipientId },
    });
    if (!recipient || recipient.status === "SENT") return;

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
      });

      await prisma.campaignRecipient.update({
        where: { id: data.recipientId },
        data: { status: "SENT", sentAt: new Date() },
      });

      await prisma.campaign.update({
        where: { id: data.campaignId },
        data: { sentCount: { increment: 1 } },
      });

      console.log(
        `[CampaignWorker] ✅ Sent to ${data.email} (campaign ${data.campaignId})`,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error";

      await prisma.campaignRecipient.update({
        where: { id: data.recipientId },
        data: {
          status: "FAILED",
          errorMessage: message.slice(0, 500),
        },
      });

      await prisma.campaign.update({
        where: { id: data.campaignId },
        data: { failedCount: { increment: 1 } },
      });

      console.error(
        `[CampaignWorker] ❌ Failed for ${data.email}: ${message}`,
      );

      throw err; // BullMQ will retry per backoff config
    } finally {
      // After every job (success or failure), check if the campaign is fully done
      await markCampaignCompleteIfDone(data.campaignId).catch((e) =>
        console.error("[CampaignWorker] markCampaignCompleteIfDone error:", e),
      );
    }
  },
  {
    connection: redis,
    concurrency: 20,
    limiter: { max: 50, duration: 1000 },
  },
);