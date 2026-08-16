"use server";

import { registerPostView } from "@/lib/views-internal";

/**
 * Public entry point of the post view counter.
 *
 * SECURITY NOTE — READ THIS BEFORE ADDING AN EXPORT TO THIS FILE.
 *
 * Every export of a `"use server"` module is compiled into a public HTTP
 * endpoint. Next.js verifies the request Origin, but nothing prevents a
 * hostile client from calling that endpoint directly with whatever arguments
 * it likes. Assume every parameter of every function below is
 * attacker-controlled, and only export functions that stay safe under that
 * assumption.
 *
 * This module used to export `recordPostViewByIdentifier(postId, identifier)`.
 * Because the caller chose the dedupe identifier, anyone could send a fresh
 * random string on every request and thereby (a) count the same view an
 * unlimited number of times and (b) create an unbounded number of Redis keys,
 * bypassing the validation the HTTP route performed. The actual logic now
 * lives in `lib/views-internal.ts`, which is deliberately *not* a
 * `"use server"` module and is therefore only reachable from server code.
 *
 * `postId` is the only accepted argument and is validated inside
 * `registerPostView`. The visitor identity is resolved server-side (session
 * user id, or a server-issued signed cookie) and can never be supplied by the
 * caller.
 */
export async function recordPostView(postId: string): Promise<void> {
  try {
    await registerPostView(postId);
  } catch (error) {
    // A view counter must never break page rendering, and the client has no
    // legitimate use for the failure reason, so failures are logged and
    // swallowed. Keep the log free of the visitor id and the client IP: see
    // the note about key names in `views-internal.ts`.
    console.error("[recordPostView]", error);
  }
}