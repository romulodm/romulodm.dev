import {
  createRedisConnection,
  createQueue,
  QUEUE_TRANSACTIONAL,
  QUEUE_CAMPAIGN,
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
  await transactionalQueue.add(
    "confirmation",
    { type: "CONFIRMATION", email, confirmationUrl },
    { priority: 1 },
  );
}

export async function enqueueWelcome(email: string, unsubscribeUrl: string) {
  await transactionalQueue.add(
    "welcome",
    { type: "WELCOME", email, unsubscribeUrl },
    { priority: 1 },
  );
}

export async function enqueueUnsubscribeConfirm(email: string, unsubscribeUrl: string) {
  await transactionalQueue.add(
    "unsubscribe-confirm",
    { type: "UNSUBSCRIBE_CONFIRM", email, unsubscribeUrl },
    { priority: 1 },
  );
}

export async function enqueueCampaignEmail(job: CampaignEmailJob, delayMs = 0) {
  await campaignQueue.add(
    `campaign-${job.campaignId}-${job.recipientId}`,
    job,
    {
      delay: delayMs,
      jobId: `campaign:${job.campaignId}:${job.recipientId}`,
    },
  );
}