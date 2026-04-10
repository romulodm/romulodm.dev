import { randomUUID } from "node:crypto";

import { prisma } from "@romulo/database";

export const TEST_PREFIX = "phase3test";

export function uniqueToken(label: string) {
  return `${TEST_PREFIX}_${label}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export async function cleanupIntegrationFixtures() {
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
