// lib/username.ts
import { randomInt } from "crypto";

import { prisma } from "@romulo/database";

import { checkUsername, normalizeUsernameInput } from "./username-rules";

const PLACEHOLDER_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/**
 * "user_" plus six random characters. Deliberately unrelated to the e-mail
 * address and to the provider's display name: the account exists before its
 * owner has chosen how to appear, and nothing in the placeholder should say
 * who they are. The alphabet drops 0/o and 1/l so it can be read aloud.
 */
function placeholderCandidate(): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += PLACEHOLDER_ALPHABET[randomInt(PLACEHOLDER_ALPHABET.length)];
  return `user_${suffix}`;
}

async function isFree(username: string): Promise<boolean> {
  const exists = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  return !exists;
}

/**
 * Username assigned to a new OAuth account until its owner picks one in the
 * "choose a username" dialog (User.usernameChosenAt stays null until then, and
 * posting is blocked meanwhile).
 *
 * `preferred` is the GitHub login, when there is one. A GitHub login is a
 * handle the person already chose to show in public, so it is a reasonable
 * suggestion to prefill; it is used only if it fits the local rules and is
 * free. Google offers no handle, and its display name is a real name, so
 * Google accounts always start from a placeholder.
 */
export async function generatePlaceholderUsername(preferred?: string | null): Promise<string> {
  if (preferred) {
    const candidate = normalizeUsernameInput(preferred).slice(0, 24);
    if (!checkUsername(candidate) && (await isFree(candidate))) return candidate;
  }

  for (let i = 0; i < 10; i++) {
    const candidate = placeholderCandidate();
    if (await isFree(candidate)) return candidate;
  }

  // 32^6 ≈ 1e9 combinations: ten consecutive collisions means something else
  // is wrong. The timestamp tail keeps sign-in working instead of failing.
  return `user_${Date.now().toString(36).slice(-8)}`;
}
