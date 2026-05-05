import {
  buildCampaignJobId,
  buildTransactionalJobId,
  campaignEmailJobOptions,
  createQueue,
  QUEUE_TRANSACTIONAL,
  QUEUE_CAMPAIGN,
  transactionalEmailJobOptions,
  type TransactionalEmailJob,
  type CampaignEmailJob,
} from "@romulo/queues";
import type { Queue } from "bullmq";
import { getRedis } from "../redis";

let _transactionalQueue: Queue<TransactionalEmailJob> | null = null;
let _campaignQueue: Queue<CampaignEmailJob> | null = null;

function getTransactionalQueue(): Queue<TransactionalEmailJob> {
  return (_transactionalQueue ??= createQueue<TransactionalEmailJob>(
    QUEUE_TRANSACTIONAL,
    getRedis(),
  ));
}

function getCampaignQueue(): Queue<CampaignEmailJob> {
  return (_campaignQueue ??= createQueue<CampaignEmailJob>(
    QUEUE_CAMPAIGN,
    getRedis(),
  ));
}

export async function enqueueConfirmation(
  email: string,
  confirmationUrl: string,
  displayName: string,
  locale: string,
) {
  const job: TransactionalEmailJob = {
    type: "CONFIRMATION",
    email,
    confirmationUrl,
    displayName,
    locale,
  };
  await getTransactionalQueue().add("confirmation", job, {
    ...transactionalEmailJobOptions,
    jobId: buildTransactionalJobId(job),
  });
}

export async function enqueueWelcome(
  email: string,
  unsubscribeUrl: string,
  displayName: string,
  locale: string,
) {
  const job: TransactionalEmailJob = {
    type: "WELCOME",
    email,
    unsubscribeUrl,
    displayName,
    locale,
  };
  await getTransactionalQueue().add("welcome", job, {
    ...transactionalEmailJobOptions,
    jobId: buildTransactionalJobId(job),
  });
}

export async function enqueueUnsubscribeConfirm(
  email: string,
  unsubscribeUrl: string,
  displayName: string,
  locale: string,
) {
  const job: TransactionalEmailJob = {
    type: "UNSUBSCRIBE_CONFIRM",
    email,
    unsubscribeUrl,
    displayName,
    locale,
  };
  await getTransactionalQueue().add("unsubscribe-confirm", job, {
    ...transactionalEmailJobOptions,
    jobId: buildTransactionalJobId(job),
  });
}

export async function enqueuePasswordReset(
  email: string,
  token: string,
  displayName: string,
  locale: string,
  expiresInMinutes = 60,
) {
  const job: TransactionalEmailJob = {
    type: "PASSWORD_RESET",
    email,
    code: token,
    expiresInMinutes,
    displayName,
    locale,
  };
  await getTransactionalQueue().add("password-reset", job, {
    ...transactionalEmailJobOptions,
    jobId: buildTransactionalJobId(job),
  });
}

export async function enqueueCampaignEmail(job: CampaignEmailJob, delayMs = 0) {
  await getCampaignQueue().add(
    `campaign-${job.campaignId}-${job.recipientId}`,
    job,
    {
      ...campaignEmailJobOptions,
      delay: delayMs,
      jobId: buildCampaignJobId(job),
    },
  );
}