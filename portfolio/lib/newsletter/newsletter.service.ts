// src/lib/newsletter/newsletter.service.ts

import crypto from "crypto";
import { prisma } from "@romulo/database";
import {
  enqueueConfirmation,
  enqueueWelcome,
  enqueueUnsubscribeConfirm,
  enqueueCampaignEmail,
} from "@/lib/queues/email.queue";
import { displayNameFromEmail, resolveLocale } from "@romulo/templates";

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

async function resolveRecipientContext(
  email: string,
  subscriber?: { preferredLocale: string; userId: string | null } | null,
): Promise<{ displayName: string; locale: string }> {
  const userId = subscriber?.userId;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });
    if (user) {
      return {
        displayName: user.username,
        locale: resolveLocale(subscriber?.preferredLocale),
      };
    }
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, username: true },
  });

  if (user) {
    if (subscriber && !subscriber.userId) {
      await prisma.newsletterSubscriber
        .update({
          where: { email },
          data: { userId: user.id },
        })
        .catch(() => void 0);
    }
    return {
      displayName: user.username,
      locale: resolveLocale(subscriber?.preferredLocale),
    };
  }

  return {
    displayName: displayNameFromEmail(email),
    locale: resolveLocale(subscriber?.preferredLocale),
  };
}

// ── Subscribe ────────────────────────────────────────────────────────────────

export async function subscribe(email: string, requestLocale?: string) {
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
    select: {
      id: true,
      isConfirmed: true,
      unsubscribedAt: true,
      unsubscribeToken: true,
      preferredLocale: true,
      userId: true,
    },
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

  // Subscribing again from a different language switches the preference too:
  // the welcome email and future campaigns follow the latest request.
  const preferredLocale = requestLocale ? resolveLocale(requestLocale) : undefined;

  if (existing) {
    await prisma.newsletterSubscriber.update({
      where: { email },
      data: {
        confirmationToken,
        confirmationExpires,
        unsubscribeToken,
        isConfirmed: false,
        unsubscribedAt: null,
        ...(preferredLocale && { preferredLocale }),
      },
    });
  } else {
    await prisma.newsletterSubscriber.create({
      data: {
        email,
        confirmationToken,
        confirmationExpires,
        unsubscribeToken,
        ...(preferredLocale && { preferredLocale }),
      },
    });
  }

  const { displayName, locale } = await resolveRecipientContext(email, existing);
  const emailLocale = preferredLocale ?? locale;

  await enqueueConfirmation(email, confirmUrl(confirmationToken), displayName, emailLocale);
  return { status: "confirmation_sent" as const };
}

// ── Confirm ──────────────────────────────────────────────────────────────────

export async function confirmSubscription(token: string) {
  const subscriber = await prisma.newsletterSubscriber.findFirst({
    where: {
      confirmationToken: token,
      confirmationExpires: { gt: new Date() },
    },
    select: {
      id: true,
      email: true,
      unsubscribeToken: true,
      preferredLocale: true,
      userId: true,
    },
  });

  if (!subscriber) return { status: "invalid_token" as const };

  let resolvedUserId: string | null = subscriber.userId;
  if (!resolvedUserId) {
    const user = await prisma.user.findUnique({
      where: { email: subscriber.email },
      select: { id: true },
    });
    if (user) resolvedUserId = user.id;
  }

  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      isConfirmed: true,
      subscribedAt: new Date(),
      confirmationToken: null,
      confirmationExpires: null,
      ...(resolvedUserId ? { userId: resolvedUserId } : {}),
    },
  });

  const { displayName, locale } = await resolveRecipientContext(
    subscriber.email,
    { ...subscriber, userId: resolvedUserId },
  );

  await enqueueWelcome(
    subscriber.email,
    unsubscribeUrl(subscriber.unsubscribeToken),
    displayName,
    locale,
  );
  return { status: "confirmed" as const };
}

// ── Request Unsubscribe ──────────────────────────────────────────────────────

export async function requestUnsubscribe(email: string) {
  const subscriber = await prisma.newsletterSubscriber.findFirst({
    where: { email, isConfirmed: true, unsubscribedAt: null },
    select: {
      id: true,
      email: true,
      unsubscribeToken: true,
      preferredLocale: true,
      userId: true,
    },
  });

  if (!subscriber) return { status: "email_sent" as const };

  const { displayName, locale } = await resolveRecipientContext(
    email,
    subscriber,
  );

  await enqueueUnsubscribeConfirm(
    email,
    unsubscribeUrl(subscriber.unsubscribeToken),
    displayName,
    locale,
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
    data: {
      unsubscribedAt: new Date(),
      userId: null,
    },
  });

  return { status: "unsubscribed" as const };
}

// ── Dispatch Campaign ─────────────────────────────────────────────────────────

export async function dispatchCampaign(campaignId: string, scheduledAt?: Date) {
  // Inclui campaignPosts para campanhas do tipo DIGEST
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      campaignPosts: {
        orderBy: { order: "asc" },
        select: { postId: true },
      },
    },
  });

  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status === "SENT") throw new Error("Campaign already sent.");
  if (campaign.status === "SENDING") throw new Error("Campaign is already being sent.");

  const postIds = campaign.campaignPosts.map((cp) => cp.postId);
  console.log(`[Dispatch] campaign ${campaignId} type=${campaign.type} postIds=`, postIds);

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { isConfirmed: true, unsubscribedAt: null },
    select: {
      id: true,
      email: true,
      unsubscribeToken: true,
      preferredLocale: true,
      userId: true,
    },
  });

  if (subscribers.length === 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "SENT", sentAt: new Date(), totalRecipients: 0 },
    });
    return { dispatched: 0 };
  }

  const now = new Date();
  const delayMs = scheduledAt ? Math.max(0, scheduledAt.getTime() - now.getTime()) : 0;

  await prisma.campaignRecipient.createMany({
    data: subscribers.map((s) => ({ campaignId, subscriberId: s.id })),
    skipDuplicates: true,
  });

  const recipients = await prisma.campaignRecipient.findMany({
    where: { campaignId, status: "PENDING" },
    select: {
      id: true,
      trackingId: true,
      subscriber: {
        select: {
          email: true,
          unsubscribeToken: true,
          preferredLocale: true,
          userId: true,
        },
      },
    },
  });

  // Batch-resolve usernames for linked accounts
  const userIds = recipients.flatMap((r) =>
    r.subscriber.userId ? [r.subscriber.userId] : [],
  );

  const usersMap = new Map<string, string>();
  if (userIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true },
    });
    for (const u of users) usersMap.set(u.id, u.username);
  }

  for (const r of recipients) {
    const sub = r.subscriber;
    const linkedUsername = sub.userId ? usersMap.get(sub.userId) : undefined;
    const displayName = linkedUsername ?? displayNameFromEmail(sub.email);
    const locale = resolveLocale(sub.preferredLocale);

    await enqueueCampaignEmail(
      {
        campaignId,
        campaignType: campaign.type,
        postId: campaign.postId,
        postIds,                              // ← passado para DIGEST; vazio para outros tipos
        recipientId: r.id,
        trackingId: r.trackingId,
        email: sub.email,
        subject: campaign.subject,
        content: campaign.content,
        unsubscribeUrl: unsubscribeUrl(sub.unsubscribeToken),
        trackingPixelUrl: trackingPixelUrl(r.trackingId),
        displayName,
        locale,
      },
      delayMs,
    );
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: scheduledAt ? "SCHEDULED" : "SENDING",
      scheduledAt: scheduledAt ?? null,
      totalRecipients: recipients.length,
    },
  });

  return { dispatched: recipients.length };
}