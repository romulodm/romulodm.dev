// lib/username-rules.ts
//
// Username rules shared by the browser (form validation) and the API routes
// that store a username. Kept free of server imports so client components can
// use it without pulling Prisma into the bundle.

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;

/**
 * Lowercase letters, digits, `_` and `-`. The username is also the public
 * profile path (/<locale>/profile/<username>), which drives two choices:
 * lowercase only, so "Ana" and "ana" cannot be two different people, and no
 * dot, because the proxy matcher skips any path containing one (it treats it
 * as a static file) and the profile would lose its locale handling.
 */
export const USERNAME_PATTERN = /^[a-z0-9_-]{3,24}$/;

/**
 * Names that would read as the site itself speaking, or collide with words
 * the UI uses on its own. Not exhaustive on purpose: it blocks impersonation
 * of the site, not every unpleasant word.
 */
const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "administrador",
  "anonymous",
  "anonimo",
  "api",
  "deleted",
  "help",
  "me",
  "moderator",
  "moderador",
  "null",
  "official",
  "oficial",
  "root",
  "romulo",
  "romulodm",
  "staff",
  "suporte",
  "support",
  "system",
  "sistema",
  "undefined",
]);

export type UsernameProblem = "format" | "reserved";

/** What the user typed, as the server will store it: no "@", no case. */
export function normalizeUsernameInput(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

/** Returns null when `value` (already normalized) is acceptable. */
export function checkUsername(value: string): UsernameProblem | null {
  if (!USERNAME_PATTERN.test(value)) return "format";
  if (RESERVED_USERNAMES.has(value)) return "reserved";
  return null;
}
