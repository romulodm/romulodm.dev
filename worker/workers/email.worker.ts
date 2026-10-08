import { type JobsOptions, type Job, Worker } from "bullmq";
import type { Redis } from "ioredis";
import { prisma } from "@romulo/database";

import {
  buildCampaignJobId,
  buildEmailMessageId,
  buildTransactionalJobId,
  createQueue,
  defaultJobOptions,
  notificationJobOptions,
  queueRuntimeConfig,
  registerRepeatable,
  QUEUE_CAMPAIGN,
  QUEUE_NOTIFICATIONS,
  QUEUE_TRANSACTIONAL,
  RETRY_TRANSACTIONAL_EMAIL_JOB_NAME,
  type CampaignEmailJob,
  type NotificationJob,
  type TransactionalEmailJob,
} from "@romulo/queues";

import { emailService } from "../lib/email/email.service";
import { absoluteMediaUrl } from "../lib/media";
import { logWorkerError, logWorkerEvent } from "../lib/worker-observability";
import {
  campaignTemplate,
  confirmationTemplate,
  digestTemplate,
  passwordResetTemplate,
  unsubscribeConfirmTemplate,
  welcomeTemplate,
  type BrandConfig,
  type RecipientContext,
} from "@romulo/templates";

// ── Brand config ──────────────────────────────────────────────────────────────

const BRAND: BrandConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "romulodm",
  baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://romulodm.dev",
  accentColor: "#f57842",
};

// ── Types ─────────────────────────────────────────────────────────────────────

export type TransactionalJobContext = Pick<Job<TransactionalEmailJob>, "data" | "attemptsMade" | "opts">;
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
 * RFC 2369 + RFC 8058 headers for mailing-list sends. They make Gmail, Yahoo
 * and Apple Mail show a native "Unsubscribe" next to the sender, and Gmail and
 * Yahoo expect them from bulk senders; mail without them lands in spam more
 * often.
 *
 * The one-click variant needs an endpoint that unsubscribes on a bare POST,
 * with no page, login or confirmation in between. That is
 * POST /api/newsletter/unsubscribe/[token]. The URL carried in the job is the
 * human-facing page (/newsletter/unsubscribe/<token>, which asks for
 * confirmation), so the API path is derived from it. If it ever stops matching
 * that shape, only the plain List-Unsubscribe header is sent: a one-click
 * header pointing at a page that does not unsubscribe on POST would be worse
 * than none.
 */
export function listUnsubscribeHeaders(unsubscribeUrl: string): Record<string, string> {
  try {
    const url = new URL(unsubscribeUrl);
    const match = url.pathname.match(/^\/(?:[a-z]{2}\/)?newsletter\/unsubscribe\/([^/]+)\/?$/);
    if (match) {
      return {
        "List-Unsubscribe": `<${url.origin}/api/newsletter/unsubscribe/${match[1]}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      };
    }
  } catch {
    // Not an absolute URL; fall through.
  }
  return { "List-Unsubscribe": `<${unsubscribeUrl}>` };
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

async function renderDigestEmail(
  data: CampaignEmailJob & { postIds: string[] }
): Promise<string> {
  const locale = data.locale ?? "pt"

  console.log(`[Worker] renderDigestEmail postIds=`, data.postIds);


  const posts = await prisma.post.findMany({
    where: { id: { in: data.postIds } },
    select: {
      id: true,
      slug: true,
      coverImageUrl: true,
      postTags: { select: { tag: true } },
      translations: {
        where: { locale: { in: [locale, "pt"] } },
        select: { locale: true, title: true, summary: true },
      },
    },
  })

  // Mantém a ordem original definida no admin
  const ordered = data.postIds
    .map((id) => posts.find((p) => p.id === id))
    .filter(Boolean) as typeof posts

  console.log(`[Worker] posts found=`, posts.length, `ordered=`, ordered.length);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""

  const digestPosts = ordered.map((post) => {
    const translation =
      post.translations.find((t) => t.locale === locale) ??
      post.translations.find((t) => t.locale === "pt")

    return {
      title: translation?.title ?? "",
      summary: translation?.summary ?? undefined,
      tags: post.postTags.map((t) => t.tag),
      imageUrl: post.coverImageUrl ? absoluteMediaUrl(post.coverImageUrl, BRAND.baseUrl) : undefined,
      url: `${baseUrl}/${locale}/blog/${post.slug}`,
    }
  })

  return digestTemplate({
    subject: data.subject,
    previewText: data.previewText,
    posts: digestPosts,
    unsubscribeUrl: data.unsubscribeUrl,
    trackingPixelUrl: data.trackingPixelUrl,
    brand: BRAND,
    recipient: recipient(data),
  })
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
    previewText: data.previewText,
    post: {
      imageUrl: post.coverImageUrl ? absoluteMediaUrl(post.coverImageUrl, BRAND.baseUrl) : undefined,
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
  // Repassado pro provider: um erro ambíguo (timeout/rede) na Resend só
  // dispara o fallback pro SES quando não sobra mais retry — ver
  // FallbackProvider.
  const lastAttempt = isFinalAttempt(job);

  switch (data.type) {
    case "CONFIRMATION":
      await emailService.send({
        to: data.email,
        subject: `Confirm your subscription — ${BRAND.name}`,
        html: confirmationTemplate({ confirmationUrl: data.confirmationUrl, brand: BRAND, recipient: r }),
        messageId,
        isFinalAttempt: lastAttempt,
      });
      return;

    case "WELCOME":
      await emailService.send({
        to: data.email,
        subject: `Welcome to ${BRAND.name}! 🎉`,
        html: welcomeTemplate({ unsubscribeUrl: data.unsubscribeUrl, brand: BRAND, recipient: r }),
        headers: listUnsubscribeHeaders(data.unsubscribeUrl),
        messageId,
        isFinalAttempt: lastAttempt,
      });
      return;

    case "UNSUBSCRIBE_CONFIRM":
      await emailService.send({
        to: data.email,
        subject: `Confirm unsubscribe — ${BRAND.name}`,
        html: unsubscribeConfirmTemplate({ unsubscribeUrl: data.unsubscribeUrl, brand: BRAND, recipient: r }),
        messageId,
        isFinalAttempt: lastAttempt,
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
        isFinalAttempt: lastAttempt,
      });
      return;

    default:
      throw new Error(`Unknown transactional job type: ${(data as { type: string }).type}`);
  }
}

// ── Campaign processor ────────────────────────────────────────────────────────

async function renderCampaignHtml(data: CampaignEmailJob): Promise<string> {
  if (data.campaignType === "DIGEST" && data.postIds?.length) {
    return renderDigestEmail(data as CampaignEmailJob & { postIds: string[] });
  }
  if (data.campaignType === "POST_BASED" && data.postId) {
    return renderPostBasedEmail(data as CampaignEmailJob & { postId: string });
  }
  return resolvePlaceholders(data.content, {
    displayName: data.displayName,
    unsubscribeUrl: data.unsubscribeUrl,
    trackingPixelUrl: data.trackingPixelUrl,
  });
}

/**
 * "Send test" delivery of a draft campaign to a subscriber flagged as tester.
 *
 * Renders exactly what the real send would render for that subscriber's
 * locale, but touches no CampaignRecipient row and no campaign counter: the
 * draft stays a draft, and the tester still gets the real send later because
 * no recipient row exists for them yet.
 */
async function processCampaignTestJob(job: CampaignJobContext): Promise<void> {
  const { data } = job;
  try {
    const html = await renderCampaignHtml(data);
    await emailService.send({
      to: data.email,
      subject: data.subject,
      html,
      headers: listUnsubscribeHeaders(data.unsubscribeUrl),
      messageId: buildEmailMessageId("campaign-test", buildCampaignJobId(data)),
      isFinalAttempt: isFinalAttempt(job),
    });
    console.log(`[CampaignWorker] Test sent to ${data.email} (campaign ${data.campaignId}, locale: ${data.locale})`);
  } catch (error: unknown) {
    logWorkerError("campaign.test_send_failed", error, {
      campaignId: data.campaignId,
      testRunId: data.testRunId,
      finalAttempt: isFinalAttempt(job),
    });
    throw error;
  }
}

export async function processCampaignEmailJob(job: CampaignJobContext): Promise<void> {
  const { data } = job;

  if (data.testRunId) {
    await processCampaignTestJob(job);
    return;
  }

  const existing = await prisma.campaignRecipient.findUnique({ where: { id: data.recipientId } });
  if (!existing || existing.status !== "PENDING") return;

  const deliveryId = buildCampaignJobId(data);

  try {
    const html = await renderCampaignHtml(data);

    await emailService.send({
      to: data.email,
      subject: data.subject,
      html,
      headers: listUnsubscribeHeaders(data.unsubscribeUrl),
      messageId: buildEmailMessageId("campaign", deliveryId),
      isFinalAttempt: isFinalAttempt(job),
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

    // O erro e relancado para o BullMQ decidir o retry; o log aqui garante o
    // contexto da campanha (o handler global so ve o job).
    logWorkerError("campaign.send_failed", error, {
      campaignId: data.campaignId,
      recipientId: data.recipientId,
      finalAttempt: isFinalAttempt(job),
    });
    throw error;
  } finally {
    await markCampaignCompleteIfDone(data.campaignId).catch((err) =>
      logWorkerError("campaign.mark_complete_failed", err, { campaignId: data.campaignId }),
    );
  }
}

// ── Sweep: rede de segurança contra provedor fora do ar por mais tempo do
// que o retry do BullMQ aguenta ──────────────────────────────────────────────
//
// `transactionalEmailJobOptions` dá só 3 tentativas com backoff de 5s/10s —
// span total de ~15s. Isso cobre uma falha transitória rápida, mas não um
// provedor fora do ar por minutos (ou o circuit breaker do EmailService
// aberto por 60s — mais que o span inteiro do retry). Depois da 3ª tentativa
// o job vai pro "failed" do BullMQ e nada mais mexe nele.
//
// Esse sweep roda a cada `transactionalEmailSweepIntervalMs` (10 min por
// padrão) via job repetível no QUEUE_NOTIFICATIONS (mesmo padrão do
// `retry-onchain`, ver onchain.worker.ts) e dá mais uma chance pros jobs
// falhos recentes — espalhando as tentativas ao longo de horas em vez de
// segundos, sem precisar de tabela nova no banco: o próprio job falho do
// BullMQ já carrega tudo que precisa pra tentar de novo.

/** Depois disso, desiste — o alerta do Telegram na tentativa final já disparou. */
const SWEEP_MAX_AGE_MS = 6 * 60 * 60 * 1000;

/** Tentativas originais (3) + no máximo mais 5 rodadas do sweep. */
const SWEEP_MAX_TOTAL_ATTEMPTS = 8;

export async function sweepFailedTransactionalEmails(redis: Redis): Promise<void> {
  const queue = createQueue<TransactionalEmailJob>(QUEUE_TRANSACTIONAL, redis);

  try {
    const failed = await queue.getFailed(0, 200);
    const now = Date.now();
    let retried = 0;

    for (const job of failed) {
      const failedAt = job.finishedOn ?? job.timestamp;
      if (now - failedAt > SWEEP_MAX_AGE_MS) continue;
      if (job.attemptsMade >= SWEEP_MAX_TOTAL_ATTEMPTS) continue;

      try {
        await job.retry();
        retried++;
      } catch (error) {
        logWorkerError("email.sweep_retry_failed", error, { jobId: job.id });
      }
    }

    if (retried > 0 || failed.length > 0) {
      logWorkerEvent("info", "email.sweep_ran", {
        retried,
        totalFailed: failed.length,
      });
    }
  } finally {
    await queue.close();
  }
}

/**
 * Registra o job repetível do sweep. Idempotente — seguro chamar em todo
 * boot do worker (mesmo padrão de `scheduleOnchainRetry`).
 */
export async function scheduleTransactionalEmailSweep(redis: Redis): Promise<void> {
  const queue = createQueue<NotificationJob>(QUEUE_NOTIFICATIONS, redis, {
    defaultJobOptions: {
      ...notificationJobOptions,
      attempts: 3,
      removeOnComplete: { count: 10 },
      removeOnFail: { age: 24 * 3600 },
    },
  });

  try {
    const result = await registerRepeatable(queue, {
      name: RETRY_TRANSACTIONAL_EMAIL_JOB_NAME,
      data: { type: "retry-transactional-email" },
      repeat: { every: queueRuntimeConfig.transactionalEmailSweepIntervalMs },
      jobOptions: { ...notificationJobOptions, attempts: 3 },
    });

    console.log(
      `[EmailSweep] Job ${result.action} — intervalo: ${queueRuntimeConfig.transactionalEmailSweepIntervalMs} ms.`,
    );
  } finally {
    await queue.close();
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