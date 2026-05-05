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
  type BrandConfig,
  type RecipientContext,
} from "@romulo/templates";

// ── Brand config ──────────────────────────────────────────────────────────────

const BRAND: BrandConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "romulodm",
  baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://romulodm.com.br",
  accentColor: "#f57842",
  privacyUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://romulodm.com.br"}/privacy`,
};

// ── Types ─────────────────────────────────────────────────────────────────────

export type TransactionalJobContext = Pick<Job<TransactionalEmailJob>, "data">;
export type CampaignJobContext = Pick<Job<CampaignEmailJob>, "data" | "attemptsMade" | "opts">;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isFinalAttempt(job: { attemptsMade: number; opts: JobsOptions }): boolean {
  const configured = job.opts.attempts ?? defaultJobOptions?.attempts ?? 1;
  return job.attemptsMade + 1 >= configured;
}

function recipient(data: { displayName: string; locale: string }): RecipientContext {
  return { displayName: data.displayName, locale: data.locale as RecipientContext["locale"] };
}

/**
 * Substitui os placeholders no HTML armazenado (usado apenas para CUSTOM).
 */
function resolvePlaceholders(
  html: string,
  values: { displayName: string; unsubscribeUrl: string; trackingPixelUrl: string },
): string {
  return html
    .replace(/\{\{displayName\}\}/g, values.displayName)
    .replace(/\{\{unsubscribeUrl\}\}/g, values.unsubscribeUrl)
    .replace(/\{\{trackingPixelUrl\}\}/g, values.trackingPixelUrl);
}

/**
 * Para POST_BASED, busca a tradução no idioma do destinatário (com fallback
 * para "pt") e renderiza o template completo na hora do envio.
 *
 * Isso garante que cada destinatário receba o e-mail no seu idioma preferido,
 * tanto nos textos do template quanto no conteúdo do post.
 */
async function renderPostBasedEmail(
  data: CampaignEmailJob & { postId: string },
): Promise<string> {
  const recipientLocale = data.locale ?? "pt";

  const post = await prisma.post.findUnique({
    where: { id: data.postId },
    select: {
      slug: true,
      coverImageUrl: true,
      postTags: { select: { tag: true } },
      translations: {
        where: { locale: { in: [recipientLocale, "pt"] } },
        select: { locale: true, title: true, summary: true },
      },
    },
  });

  if (!post) {
    // Fallback: usa o HTML armazenado com substituição de placeholders
    console.warn(
      `[CampaignWorker] Post ${data.postId} not found — falling back to stored content`,
    );
    return resolvePlaceholders(data.content, {
      displayName: data.displayName,
      unsubscribeUrl: data.unsubscribeUrl,
      trackingPixelUrl: data.trackingPixelUrl,
    });
  }

  // Prefere a tradução no idioma do destinatário, cai em "pt" se não existir
  const translation =
    post.translations.find((t) => t.locale === recipientLocale) ??
    post.translations.find((t) => t.locale === "pt");

  if (!translation) {
    console.warn(
      `[CampaignWorker] No translation found for post ${data.postId} (locale: ${recipientLocale}) — falling back to stored content`,
    );
    return resolvePlaceholders(data.content, {
      displayName: data.displayName,
      unsubscribeUrl: data.unsubscribeUrl,
      trackingPixelUrl: data.trackingPixelUrl,
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://romulodm.com.br";

  return campaignTemplate({
    subject: data.subject,
    post: {
      imageUrl: post.coverImageUrl ?? undefined,
      title: translation.title,
      summary: translation.summary ?? undefined,
      tags: post.postTags.map((pt) => pt.tag),
      url: `${baseUrl}/${recipientLocale}/blog/${post.slug}`,
    },
    unsubscribeUrl: data.unsubscribeUrl,
    trackingPixelUrl: data.trackingPixelUrl,
    brand: BRAND,
    recipient: recipient(data),
  });
}

// ── Campaign completion ───────────────────────────────────────────────────────

export async function markCampaignCompleteIfDone(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true, totalRecipients: true, sentCount: true, failedCount: true },
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

// ── Transactional processor ───────────────────────────────────────────────────

export async function processTransactionalEmailJob(job: TransactionalJobContext): Promise<void> {
  const { data } = job;
  const messageId = buildEmailMessageId("transactional", buildTransactionalJobId(data));
  const r = recipient(data);

  switch (data.type) {
    case "CONFIRMATION":
      await emailService.send({
        to: data.email,
        subject: `Confirm your subscription — ${BRAND.name}`,
        html: confirmationTemplate({ confirmationUrl: data.confirmationUrl, brand: BRAND, recipient: r }),
        messageId,
      });
      return;

    case "WELCOME":
      await emailService.send({
        to: data.email,
        subject: `Welcome to ${BRAND.name}! 🎉`,
        html: welcomeTemplate({ unsubscribeUrl: data.unsubscribeUrl, brand: BRAND, recipient: r }),
        messageId,
      });
      return;

    case "UNSUBSCRIBE_CONFIRM":
      await emailService.send({
        to: data.email,
        subject: `Confirm unsubscribe — ${BRAND.name}`,
        html: unsubscribeConfirmTemplate({ unsubscribeUrl: data.unsubscribeUrl, brand: BRAND, recipient: r }),
        messageId,
      });
      return;

    case "PASSWORD_RESET":
      await emailService.send({
        to: data.email,
        subject: `Your recovery code — ${BRAND.name}`,
        html: passwordResetTemplate({
          code: data.code,
          expiresInMinutes: data.expiresInMinutes,
          brand: BRAND,
          recipient: r,
        }),
        messageId,
      });
      return;

    default:
      throw new Error(`Unknown transactional job type: ${(data as { type: string }).type}`);
  }
}

// ── Campaign processor ────────────────────────────────────────────────────────

export async function processCampaignEmailJob(job: CampaignJobContext): Promise<void> {
  const { data } = job;

  const existing = await prisma.campaignRecipient.findUnique({ where: { id: data.recipientId } });
  if (!existing || existing.status !== "PENDING") return;

  const deliveryId = buildCampaignJobId(data);

  try {
    let html: string;

    if (data.campaignType === "POST_BASED" && data.postId) {
      // Renderiza o template na hora com a locale do destinatário,
      // buscando a tradução correta do post no banco.
      html = await renderPostBasedEmail(data as CampaignEmailJob & { postId: string });
    } else {
      // CUSTOM: o HTML já está completo, apenas substitui os placeholders.
      html = resolvePlaceholders(data.content, {
        displayName: data.displayName,
        unsubscribeUrl: data.unsubscribeUrl,
        trackingPixelUrl: data.trackingPixelUrl,
      });
    }

    await emailService.send({
      to: data.email,
      subject: data.subject,
      html,
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

    console.log(`[CampaignWorker] Sent to ${data.email} (campaign ${data.campaignId}, locale: ${data.locale})`);
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