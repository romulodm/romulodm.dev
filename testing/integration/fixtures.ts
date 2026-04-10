import { randomUUID } from "node:crypto";

import { prisma } from "@romulo/database";

export const TEST_PREFIX = "phase3test";

export function uniqueToken(label: string) {
  return `${TEST_PREFIX}_${label}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export async function cleanupIntegrationFixtures() {
  await prisma.campaignRecipient.deleteMany({
    where: {
      OR: [
        { subscriber: { email: { contains: TEST_PREFIX } } },
        { campaign: { subject: { contains: TEST_PREFIX } } },
      ],
    },
  });

  await prisma.campaign.deleteMany({
    where: {
      OR: [
        { subject: { contains: TEST_PREFIX } },
        { recipients: { some: { subscriber: { email: { contains: TEST_PREFIX } } } } },
      ],
    },
  });

  await prisma.newsletterSubscriber.deleteMany({
    where: { email: { contains: TEST_PREFIX } },
  });

  await prisma.commentVote.deleteMany({
    where: {
      OR: [
        { user: { email: { contains: TEST_PREFIX } } },
        { comment: { author: { email: { contains: TEST_PREFIX } } } },
      ],
    },
  });

  await prisma.comment.deleteMany({
    where: {
      OR: [
        { author: { email: { contains: TEST_PREFIX } } },
        { post: { slug: { contains: TEST_PREFIX } } },
      ],
    },
  });

  await prisma.suspiciousComment.deleteMany({
    where: {
      OR: [
        { author: { email: { contains: TEST_PREFIX } } },
        { post: { slug: { contains: TEST_PREFIX } } },
      ],
    },
  });

  await prisma.postLike.deleteMany({
    where: {
      OR: [
        { user: { email: { contains: TEST_PREFIX } } },
        { post: { slug: { contains: TEST_PREFIX } } },
      ],
    },
  });

  await prisma.postTranslation.deleteMany({
    where: {
      post: { slug: { contains: TEST_PREFIX } },
    },
  });

  await prisma.post.deleteMany({
    where: { slug: { contains: TEST_PREFIX } },
  });

  await prisma.passwordResetToken.deleteMany({
    where: { user: { email: { contains: TEST_PREFIX } } },
  });

  await prisma.user.deleteMany({
    where: { email: { contains: TEST_PREFIX } },
  });
}

export async function createTestUser(overrides?: {
  email?: string;
  username?: string;
  password?: string | null;
  admin?: boolean;
  provider?: "EMAIL_PASSWORD" | "GOOGLE";
}) {
  const token = uniqueToken("user");
  return prisma.user.create({
    data: {
      email: overrides?.email ?? `${token}@example.com`,
      username: overrides?.username ?? token.slice(0, 24),
      password: overrides?.password ?? null,
      admin: overrides?.admin ?? false,
      provider: overrides?.provider ?? "EMAIL_PASSWORD",
      emailVerified: true,
    },
  });
}

export async function createPublishedPost(authorId: string, overrides?: {
  slug?: string;
  commentsCount?: number;
  title?: string;
}) {
  const token = uniqueToken("post");
  return prisma.post.create({
    data: {
      slug: overrides?.slug ?? token,
      authorId,
      status: "PUBLISHED",
      publishedAt: new Date(),
      commentsCount: overrides?.commentsCount ?? 0,
      translations: {
        create: {
          locale: "pt",
          title: overrides?.title ?? `Title ${token}`,
          contentMarkdown: "content",
        },
      },
    },
    include: {
      translations: true,
    },
  });
}

export async function createComment(authorId: string, postId: string, bodyMd = "comment body") {
  return prisma.comment.create({
    data: {
      authorId,
      postId,
      bodyMd,
    },
  });
}

export async function createNewsletterSubscriber(overrides?: {
  email?: string;
  isConfirmed?: boolean;
  unsubscribedAt?: Date | null;
}) {
  const token = uniqueToken("subscriber");
  return prisma.newsletterSubscriber.create({
    data: {
      email: overrides?.email ?? `${token}@example.com`,
      isConfirmed: overrides?.isConfirmed ?? true,
      unsubscribeToken: uniqueToken("unsubscribe"),
      subscribedAt: new Date(),
      unsubscribedAt: overrides?.unsubscribedAt ?? null,
    },
  });
}

export async function createCampaignWithRecipient(overrides?: {
  campaignStatus?: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "FAILED";
  recipientStatus?: string;
  email?: string;
}) {
  const subscriber = await createNewsletterSubscriber({
    email: overrides?.email,
  });
  const token = uniqueToken("campaign");

  const campaign = await prisma.campaign.create({
    data: {
      subject: `${token} subject`,
      content: `<p>${token} content</p>`,
      status: overrides?.campaignStatus ?? "SENDING",
      totalRecipients: 1,
    },
  });

  const recipient = await prisma.campaignRecipient.create({
    data: {
      campaignId: campaign.id,
      subscriberId: subscriber.id,
      status: overrides?.recipientStatus ?? "PENDING",
    },
  });

  return { campaign, recipient, subscriber };
}
