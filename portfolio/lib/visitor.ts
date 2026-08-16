import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";

/**
 * Stable anonymous identity for unauthenticated visitors.
 *
 * WHAT THIS IS FOR
 * The view counter needs to recognise "the same reader" for a short cooldown
 * window so a page refresh does not inflate the count. Logged-in readers are
 * identified by their session user id; everyone else is identified by the
 * opaque random id issued here.
 *
 * WHY THE SERVER MUST ISSUE IT
 * The identifier has to be chosen by the server. Any value the client picks
 * (a field in the request body, a header, a JS-writable cookie) lets a caller
 * mint infinite distinct identities, which both defeats deduplication and
 * turns the Redis keyspace into unbounded attacker-controlled writes.
 *
 * WHAT THE HMAC DOES AND DOES NOT BUY
 * The id is signed so the server can tell a cookie it issued apart from a
 * value someone made up. It does *not* stop a visitor from clearing the cookie
 * and asking for a new one — nothing can. The actual ceiling on abuse is the
 * per-IP rate limit in `lib/rate-limit.ts`; the signature only keeps the
 * keyspace from being written to freely.
 *
 * WHY ONE COOKIE INSTEAD OF ONE PER POST
 * A cookie per resource bloats every single request to the domain, assets
 * included, and buys nothing: the post id is already part of the Redis
 * cooldown key.
 *
 * PRIVACY
 * The id is a random UUID with no link to any profile. It is never stored
 * next to a post id anywhere durable — the only place the two meet is a Redis
 * cooldown key that expires in 30 minutes. Nothing here builds a reading
 * history. Keep it that way.
 */

const COOKIE_NAME = "vid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getSecret(): string {
  const secret = process.env.VISITOR_ID_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error(
      "VISITOR_ID_SECRET (or NEXTAUTH_SECRET) is not set — required to sign the visitor cookie.",
    );
  }

  return secret;
}

function sign(id: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(id)
    .digest("base64url");
}

function verify(id: string, signature: string): boolean {
  const expected = sign(id);

  // timingSafeEqual throws when the buffers have different lengths, so the
  // length is compared first. This leaks only the length, which is a constant
  // 43 chars for base64url-encoded SHA-256 anyway.
  if (expected.length !== signature.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature),
  );
}

/**
 * Reads the visitor id from the cookie and validates its signature, issuing a
 * fresh one when the cookie is missing, malformed, or tampered with.
 *
 * The cookie value is `<uuid>.<hmac>`. Neither a UUID nor base64url contains a
 * dot, so the last dot is an unambiguous separator.
 *
 * Only works inside a Route Handler or a Server Action — Server Components
 * cannot write cookies, and this function always may need to write one.
 */
export async function getOrCreateVisitorId(): Promise<string> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;

  if (raw) {
    const separator = raw.lastIndexOf(".");

    if (separator > 0) {
      const id = raw.slice(0, separator);
      const signature = raw.slice(separator + 1);

      if (verify(id, signature)) return id;
    }
  }

  const id = crypto.randomUUID();

  jar.set(COOKIE_NAME, `${id}.${sign(id)}`, {
    // No client-side code ever needs to read this, and making it unreadable
    // from JS keeps it out of the reach of any injected script.
    httpOnly: true,
    // "strict" would break counting for readers arriving from an external
    // link: the cookie is not sent on the first cross-site navigation, so
    // every such reader would look like a brand new visitor.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return id;
}