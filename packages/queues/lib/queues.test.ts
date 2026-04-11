import { describe, expect, it, vi } from "vitest";

const { queueMock } = vi.hoisted(() => ({
  queueMock: vi.fn(),
}));

vi.mock("bullmq", () => ({
  Queue: queueMock,
}));

import {
  buildCampaignJobId,
  buildEmailMessageId,
  buildNotificationJobId,
  buildTransactionalJobId,
  campaignEmailJobOptions,
  createQueue,
  defaultJobOptions,
  FLUSH_VIEWS_JOB_NAME,
  notificationJobOptions,
  queueRuntimeConfig,
  QUEUE_CAMPAIGN,
  QUEUE_NOTIFICATIONS,
  QUEUE_TRANSACTIONAL,
  transactionalEmailJobOptions,
  VIEWS_BUFFER_KEY,
} from "./queues.ts";

describe("queue contracts", () => {
  it("exposes the expected queue names and view-flush constants", () => {
    expect(QUEUE_TRANSACTIONAL).toBe("newsletter-transactional");
    expect(QUEUE_CAMPAIGN).toBe("newsletter-campaign");
    expect(QUEUE_NOTIFICATIONS).toBe("notifications");
    expect(VIEWS_BUFFER_KEY).toBe("views:buffer");
    expect(FLUSH_VIEWS_JOB_NAME).toBe("flush-views-cron");
  });

  it("keeps the default BullMQ job options stable", () => {
    expect(defaultJobOptions).toEqual({
      attempts: 5,
      backoff: { type: "exponential", delay: 2_000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 200 },
    });
  });

  it("exports explicit job policy overrides for critical queues", () => {
    expect(transactionalEmailJobOptions).toMatchObject({
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
      priority: 1,
    });
    expect(campaignEmailJobOptions).toMatchObject({
      attempts: 3,
      backoff: { type: "exponential", delay: 30_000 },
    });
    expect(notificationJobOptions).toMatchObject({
      attempts: 3,
      backoff: { type: "exponential", delay: 2_000 },
    });
  });

  it("exposes conservative runtime defaults for worker throughput tuning", () => {
    expect(queueRuntimeConfig).toEqual({
      transactionalWorkerConcurrency: 8,
      campaignWorkerConcurrency: 12,
      campaignRateLimitMax: 20,
      campaignRateLimitDurationMs: 1_000,
      notificationWorkerConcurrency: 1,
      viewsFlushBatchSize: 100,
      viewsFlushIntervalMs: 120_000,
    });
  });

  it("builds stable job and message identities for critical flows", () => {
    expect(
      buildTransactionalJobId({
        type: "CONFIRMATION",
        email: "romulo@example.com",
        confirmationUrl: "https://example.com/confirm/abc",
      }),
    ).toMatch(/^txn:confirmation:/);
    expect(
      buildCampaignJobId({
        campaignId: "campaign-1",
        recipientId: "recipient-1",
        trackingId: "tracking-1",
        email: "romulo@example.com",
        subject: "Subject",
        content: "<p>Body</p>",
        unsubscribeUrl: "https://example.com/unsub",
        trackingPixelUrl: "https://example.com/pixel",
      }),
    ).toBe("campaign:campaign-1:recipient-1");
    expect(
      buildNotificationJobId({
        type: "comment",
        id: "comment-1",
        author: "Romulo",
        postTitle: "Hello",
        postSlug: "hello",
      }),
    ).toBe("notification:comment:comment-1");
    expect(buildEmailMessageId("campaign", "campaign-1:recipient-1")).toMatch(
      /^<campaign\.[a-f0-9]{24}@worker\.romulodm\.local>$/,
    );
  });

  it("creates queues with shared defaults and per-call overrides", () => {
    const connection = { host: "redis" };

    createQueue("notifications", connection as never, {
      defaultJobOptions: {
        attempts: 2,
      },
      prefix: "romulo",
    });

    expect(queueMock).toHaveBeenCalledTimes(1);
    expect(queueMock).toHaveBeenCalledWith("notifications", {
      connection,
      defaultJobOptions: {
        attempts: 2,
      },
      prefix: "romulo",
    });
  });
});
