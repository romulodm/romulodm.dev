// src/lib/newsletter/newsletter.service.ts

import crypto from "crypto";
import { prisma } from "@romulo/database";
import {
  enqueueConfirmation,
  enqueueWelcome,
  enqueueUnsubscribeConfirm,
  enqueueCampaignEmail,
} from "@/lib/queues/email.queue";

const CONFIRMATION_TTL_HOURS = 24;

// ── Helpers ──────────────────────────────────────────────────────────────────

function confirmUrl(token: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}/newsletter/confirm/${token}`;
}
function unsubscribeUrl(token: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}/newsletter/unsubscribe/${token}`;
}
function trackingPixelUrl(trackingId: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/track/${trackingId}`;
}

// ── Subscribe ────────────────────────────────────────────────────────────────

export async function subscribe(email: string) {
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });

  if (existing?.isConfirmed && !existing.unsubscribedAt) {
    return { status: "already_subscribed" as const };
  }

  const confirmationToken = crypto.randomBytes(32).toString("hex");
  const unsubscribeToken =
    existing?.unsubscribeToken ?? crypto.randomBytes(32).toString("hex");
  const confirmationExpires = new Date(
    Date.now() + CONFIRMATION_TTL_HOURS * 3_600_000,
  );

  if (existing) {
    await prisma.newsletterSubscriber.update({
      where: { email },
      data: {
        confirmationToken,
        confirmationExpires,
        unsubscribeToken,
        isConfirmed: false,
        unsubscribedAt: null,
      },
    });
  } else {
    await prisma.newsletterSubscriber.create({
      data: { email, confirmationToken, confirmationExpires, unsubscribeToken },
    });
  }

  await enqueueConfirmation(email, confirmUrl(confirmationToken));
  return { status: "confirmation_sent" as const };
}

// ── Confirm ──────────────────────────────────────────────────────────────────

export async function confirmSubscription(token: string) {
  const subscriber = await prisma.newsletterSubscriber.findFirst({
    where: {
      confirmationToken: token,
      confirmationExpires: { gt: new Date() },
    },
  });

  if (!subscriber) return { status: "invalid_token" as const };

  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      isConfirmed: true,
      subscribedAt: new Date(),
      confirmationToken: null,
      confirmationExpires: null,
    },
  });

  await enqueueWelcome(
    subscriber.email,
    unsubscribeUrl(subscriber.unsubscribeToken),
  );
  return { status: "confirmed" as const };
}

// ── Request Unsubscribe ──────────────────────────────────────────────────────

export async function requestUnsubscribe(email: string) {
  const subscriber = await prisma.newsletterSubscriber.findFirst({
    where: { email, isConfirmed: true, unsubscribedAt: null },
  });

  if (!subscriber) return { status: "email_sent" as const };

  await enqueueUnsubscribeConfirm(
    email,
    unsubscribeUrl(subscriber.unsubscribeToken),
  );
  return { status: "email_sent" as const };
}

// ── Confirm Unsubscribe ──────────────────────────────────────────────────────

export async function confirmUnsubscribe(token: string) {
  const subscriber = await prisma.newsletterSubscriber.findFirst({
    where: { unsubscribeToken: token },
  });

  if (!subscriber) return { status: "invalid_token" as const };
  if (subscriber.unsubscribedAt) return { status: "already_unsubscribed" as const };

  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: { unsubscribedAt: new Date() },
  });

  return { status: "unsubscribed" as const };
}

// ── Dispatch Campaign ─────────────────────────────────────────────────────────
//
// Called by the send route. Does NOT require the campaign to be DRAFT —
// the route already validated that. Guard here only against double-dispatch.

export async function dispatchCampaign(
  campaignId: string,
  scheduledAt?: Date,
) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new Error("Campaign not found");

  // ── BUG FIX: original code threw on SENDING/SENT which is correct,
  //    but also need to allow SCHEDULED to be re-dispatched immediately
  //    if scheduledAt is now removed. Only block truly final states.
  if (campaign.status === "SENT") {
    throw new Error("Campaign already sent — cannot dispatch again.");
  }
  // Allow DRAFT, SCHEDULED, FAILED to be dispatched.
  // (SENDING means it's already going — also block that)
  if (campaign.status === "SENDING") {
    throw new Error("Campaign is already being sent.");
  }

  // Fetch all active confirmed subscribers
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { isConfirmed: true, unsubscribedAt: null },
    select: { id: true, email: true, unsubscribeToken: true },
  });

  console.log(
    `[dispatchCampaign] Campaign "${campaign.subject}" — ${subscribers.length} active subscribers`,
  );

  if (subscribers.length === 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "SENT", sentAt: new Date(), totalRecipients: 0 },
    });
    return { dispatched: 0 };
  }

  const now = new Date();
  const delayMs = scheduledAt
    ? Math.max(0, scheduledAt.getTime() - now.getTime())
    : 0;

  await prisma.campaignRecipient.createMany({
    data: subscribers.map((subscriber) => ({
      campaignId,
      subscriberId: subscriber.id,
    })),
    skipDuplicates: true,
  });

  // Re-fetch to get trackingIds
  const recipients = await prisma.campaignRecipient.findMany({
    where: { campaignId, status: "PENDING" },
    select: {
      id: true,
      trackingId: true,
      subscriber: {
        select: { email: true, unsubscribeToken: true },
      },
    },
  });

  console.log(
    `[dispatchCampaign] Enqueuing ${recipients.length} campaign email jobs…`,
  );

  // Enqueue one BullMQ job per recipient
  for (const r of recipients) {
    await enqueueCampaignEmail(
      {
        campaignId,
        recipientId: r.id,
        trackingId: r.trackingId,
        email: r.subscriber.email,
        subject: campaign.subject,
        content: campaign.content,
        unsubscribeUrl: unsubscribeUrl(r.subscriber.unsubscribeToken),
        trackingPixelUrl: trackingPixelUrl(r.trackingId),
      },
      delayMs,
    );
  }

  // Update campaign status
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: scheduledAt ? "SCHEDULED" : "SENDING",
      scheduledAt: scheduledAt ?? null,
      totalRecipients: recipients.length,
    },
  });

  console.log(
    `[dispatchCampaign] Done — status set to "${scheduledAt ? "SCHEDULED" : "SENDING"}"`,
  );

  return { dispatched: recipients.length };
}

// ── Campaign completion (called by the worker after all jobs finish) ──────────
//
// The campaign worker increments sentCount / failedCount per job.
// This function checks if all recipients are done and flips status to SENT.
// Call it at the end of each campaign worker job:
//   await markCampaignCompleteIfDone(data.campaignId)

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

// ── Auto-send on new post ────────────────────────────────────────────────────

export async function autoSendPostCampaign(post: {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
}) {
  const postUrl = `${process.env.NEXT_PUBLIC_APP_URL}/blog/${post.slug}`;

  const content = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700;">
      ${post.title}
    </h2>
    ${post.excerpt
      ? `<p style="margin:0 0 20px;color:#6b7280;font-size:16px;line-height:1.6;">${post.excerpt}</p>`
      : ""
    }
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding:16px 0;">
          <a href="${postUrl}"
             style="display:inline-block;padding:12px 28px;background:#22c55e;
                    color:#ffffff;text-decoration:none;border-radius:6px;
                    font-size:15px;font-weight:600;">
            Ler artigo completo →
          </a>
        </td>
      </tr>
    </table>
  `;

  const campaign = await prisma.campaign.create({
    data: {
      subject: `Novo post: ${post.title}`,
      content,
      postId: post.id,
      status: "DRAFT",
    },
  });

  return dispatchCampaign(campaign.id);
}
