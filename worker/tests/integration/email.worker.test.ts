import { afterEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@romulo/database";
import {
  cleanupIntegrationFixtures,
  createCampaignWithRecipient,
} from "../../../testing/integration/fixtures";
import { emailService } from "../../lib/email/email.service";
import { type CampaignJobContext, processCampaignEmailJob } from "../../workers/email.worker";

function buildCampaignJob(job: Awaited<ReturnType<typeof createCampaignWithRecipient>>): CampaignJobContext {
  return {
    data: {
      campaignId: job.campaign.id,
      recipientId: job.recipient.id,
      trackingId: job.recipient.trackingId,
      email: job.subscriber.email,
      subject: job.campaign.subject,
      content: job.campaign.content,
      unsubscribeUrl: `https://example.com/unsubscribe/${job.subscriber.unsubscribeToken}`,
      trackingPixelUrl: `https://example.com/track/${job.recipient.trackingId}`,
    },
    attemptsMade: 0,
    opts: { attempts: 3 },
  };
}

describe("campaign worker retry safety", () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await cleanupIntegrationFixtures();
  });

  it("does not mark the recipient as failed before the final attempt", async () => {
    const campaignFixture = await createCampaignWithRecipient();
    const sendSpy = vi.spyOn(emailService, "send").mockRejectedValue(new Error("SMTP unavailable"));
    const job = buildCampaignJob(campaignFixture);

    await expect(processCampaignEmailJob(job)).rejects.toThrow("SMTP unavailable");

    const refreshedRecipient = await prisma.campaignRecipient.findUnique({
      where: { id: campaignFixture.recipient.id },
      select: { status: true, errorMessage: true },
    });
    const refreshedCampaign = await prisma.campaign.findUnique({
      where: { id: campaignFixture.campaign.id },
      select: { failedCount: true },
    });

    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(refreshedRecipient).toMatchObject({
      status: "PENDING",
      errorMessage: null,
    });
    expect(refreshedCampaign?.failedCount).toBe(0);
  });

  it("marks the recipient as failed on the final attempt only once", async () => {
    const campaignFixture = await createCampaignWithRecipient();
    vi.spyOn(emailService, "send").mockRejectedValue(new Error("SMTP unavailable"));
    const job = {
      ...buildCampaignJob(campaignFixture),
      attemptsMade: 2,
    } satisfies CampaignJobContext;

    await expect(processCampaignEmailJob(job)).rejects.toThrow("SMTP unavailable");

    const refreshedRecipient = await prisma.campaignRecipient.findUnique({
      where: { id: campaignFixture.recipient.id },
      select: { status: true, errorMessage: true },
    });
    const refreshedCampaign = await prisma.campaign.findUnique({
      where: { id: campaignFixture.campaign.id },
      select: { failedCount: true },
    });

    expect(refreshedRecipient?.status).toBe("FAILED");
    expect(refreshedRecipient?.errorMessage).toContain("SMTP unavailable");
    expect(refreshedCampaign?.failedCount).toBe(1);
  });
});
