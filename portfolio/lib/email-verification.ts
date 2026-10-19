// lib/email-verification.ts
//
// Proof that an EMAIL_PASSWORD account owns its address. Until it is given,
// the account can sign in, read and like, but not comment or post on the wall
// (see lib/posting-gate.ts). OAuth accounts never go through this: Google and
// GitHub only hand over addresses they have verified themselves.

import { createHash, randomBytes } from "crypto";

import { prisma } from "@romulo/database";
import { resolveLocale } from "@romulo/templates";

import { enqueueEmailVerification } from "@/lib/queues/email.queue";

export const EMAIL_VERIFICATION_TTL_HOURS = 24;

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function verifyUrl(token: string, locale: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/verify-email/${token}`;
}

/**
 * Issues a fresh link and queues the e-mail. Earlier links for the same user
 * stop working, so "send again" never leaves several valid links in an inbox.
 */
export async function sendEmailVerification(
  user: { id: string; email: string; username: string },
  locale: string,
): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000);
  const emailLocale = resolveLocale(locale);

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
    prisma.emailVerificationToken.create({
      data: { userId: user.id, tokenHash: hashVerificationToken(token), expiresAt },
    }),
  ]);

  await enqueueEmailVerification(
    user.email,
    verifyUrl(token, emailLocale),
    user.username,
    emailLocale,
    EMAIL_VERIFICATION_TTL_HOURS,
  );
}

/**
 * Marks the owner of `token` as verified and burns every link they have.
 * "invalid" covers unknown, malformed, expired and already-used tokens alike:
 * the page shows the same next step for all of them.
 */
export async function consumeEmailVerificationToken(
  token: string,
): Promise<"verified" | "invalid"> {
  if (!TOKEN_PATTERN.test(token)) return "invalid";

  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashVerificationToken(token) },
    select: { userId: true, expiresAt: true },
  });
  if (!row || row.expiresAt.getTime() < Date.now()) return "invalid";

  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { emailVerified: true } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: row.userId } }),
  ]);

  return "verified";
}
