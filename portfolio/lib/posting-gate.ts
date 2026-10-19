// lib/posting-gate.ts
//
// Who may publish something other visitors will read (comments, wall
// messages). Signing in is not enough:
//
//  - banned accounts never publish;
//  - an account whose username was assigned by the system has not chosen how
//    to appear yet (see lib/username.ts), and the assigned name may be a
//    leftover derived from the e-mail address;
//  - an EMAIL_PASSWORD account must prove it owns its address first
//    (lib/email-verification.ts). Without this, anyone could sign up with a
//    stranger's address and post under it.
//
// Read from the database on every call, never from the session token: the
// token can be minutes behind a ban or a confirmation.

import { prisma } from "@romulo/database";

import { forbiddenResponse } from "@/lib/api-errors";

export type PostingBlock = "banned" | "usernameRequired" | "emailNotVerified";

export async function getPostingBlock(userId: string): Promise<PostingBlock | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { banned: true, provider: true, emailVerified: true, usernameChosenAt: true },
  });

  // A session for a deleted user: treat like a ban, there is nobody to fix it.
  if (!user || user.banned) return "banned";
  if (user.usernameChosenAt === null) return "usernameRequired";
  if (user.provider === "EMAIL_PASSWORD" && !user.emailVerified) return "emailNotVerified";
  return null;
}

/**
 * The 403 for a block. `bannedMessage` stays per route because each one
 * already words the ban its own way.
 */
export function postingBlockedResponse(
  block: PostingBlock,
  t: (key: string) => string,
  bannedMessage: string,
) {
  switch (block) {
    case "banned":
      return forbiddenResponse(bannedMessage);
    case "usernameRequired":
      return forbiddenResponse(t("account.usernameRequired"), "username_required");
    case "emailNotVerified":
      return forbiddenResponse(t("account.emailNotVerified"), "email_not_verified");
  }
}
