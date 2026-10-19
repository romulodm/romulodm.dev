import { NextRequest, NextResponse } from "next/server";

import {
  badRequestResponse,
  internalErrorResponse,
  rateLimitResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { consumeEmailVerificationToken } from "@/lib/email-verification";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

/**
 * Consumes a confirmation link. POST, not GET, and called by the page at
 * /<locale>/verify-email/<token> after it renders: mail scanners and link
 * previews fetch every URL in a message, and a GET that changed state would
 * be triggered by them instead of by the person.
 *
 * No session required. The link often opens on another device (the phone
 * where the e-mail arrived), and the token alone already proves the inbox.
 */
export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);

  try {
    // 64 hex chars are not guessable, so this only keeps a script from using
    // the endpoint as a free database probe.
    const limited = await rateLimit(`auth:verify-email:${getRequestIp(req)}`, 20, 60 * 10);
    if (limited) {
      return rateLimitResponse(t("common.rateLimited"));
    }

    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token : "";

    const result = await consumeEmailVerificationToken(token);
    if (result === "invalid") {
      return badRequestResponse(t("auth.verifyEmail.invalid"));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return internalErrorResponse("auth-verify-email", error, t("common.internalError"));
  }
}
