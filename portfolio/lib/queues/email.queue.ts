import {
  buildCampaignJobId,
  buildTransactionalJobId,
  campaignEmailJobOptions,
  createRedisConnection,
  createQueue,
  QUEUE_TRANSACTIONAL,
  QUEUE_CAMPAIGN,
  transactionalEmailJobOptions,
  type TransactionalEmailJob,
  type CampaignEmailJob,
} from "@romulo/queues";

const redis = createRedisConnection();

export const transactionalQueue = createQueue<TransactionalEmailJob>(
  QUEUE_TRANSACTIONAL,
  redis,
);

export const campaignQueue = createQueue<CampaignEmailJob>(
  QUEUE_CAMPAIGN,
  redis,
);

// helpers — esses ficam só aqui porque só o Next.js enfileira
export async function enqueueConfirmation(email: string, confirmationUrl: string) {
  const job: TransactionalEmailJob = { type: "CONFIRMATION", email, confirmationUrl };
  await transactionalQueue.add(
    "confirmation",
    job,
    {
      ...transactionalEmailJobOptions,
      jobId: buildTransactionalJobId(job),
    },
  );
}

export async function enqueueWelcome(email: string, unsubscribeUrl: string) {
  const job: TransactionalEmailJob = { type: "WELCOME", email, unsubscribeUrl };
  await transactionalQueue.add(
    "welcome",
    job,
    {
      ...transactionalEmailJobOptions,
      jobId: buildTransactionalJobId(job),
    },
  );
}

export async function enqueueUnsubscribeConfirm(email: string, unsubscribeUrl: string) {
  const job: TransactionalEmailJob = { type: "UNSUBSCRIBE_CONFIRM", email, unsubscribeUrl };
  await transactionalQueue.add(
    "unsubscribe-confirm",
    job,
    {
      ...transactionalEmailJobOptions,
      jobId: buildTransactionalJobId(job),
    },
  );
}

export async function enqueueCampaignEmail(job: CampaignEmailJob, delayMs = 0) {
  await campaignQueue.add(
    `campaign-${job.campaignId}-${job.recipientId}`,
    job,
    {
      ...campaignEmailJobOptions,
      delay: delayMs,
      jobId: buildCampaignJobId(job),
    },
  );
}
