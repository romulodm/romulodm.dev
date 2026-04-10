import { describe, expect, it, vi } from "vitest";

const { queueMock } = vi.hoisted(() => ({
  queueMock: vi.fn(),
}));

vi.mock("bullmq", () => ({
  Queue: queueMock,
}));

import {
  createQueue,
  defaultJobOptions,
  FLUSH_VIEWS_JOB_NAME,
  QUEUE_CAMPAIGN,
  QUEUE_NOTIFICATIONS,
  QUEUE_TRANSACTIONAL,
  VIEWS_BUFFER_KEY,
} from "./queues";

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
