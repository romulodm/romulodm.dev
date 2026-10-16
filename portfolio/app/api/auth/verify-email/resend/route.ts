import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@romulo/database";

import {
  internalErrorResponse,
  rateLimitResponse,
  unauthorizedResponse,
} from "@/lib/api-errors";
import { getApiTranslator, resolveApiLocale } from "@/lib/api-intl";
import { requireAuth } from "@/lib/auth-helpers";
import { sendEmailVerification } from "@/lib/email-verification";
import { rateLimit } from "@/lib/rate-limit";

/**
 * "Send a new link", from the notice that replaces the comment box and the
 * wall composer while the address is unconfirmed. Also the only way in for
 * accounts created before confirmation existed, which never got a first link.
 */
export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);
  const auth = await requireAuth();
  if (!auth.ok) {
    return unauthorizedResponse(t("common.unauthorized"));
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, email: true, username: true, provider: true, emailVerified: true },
    });

    // Already confirmed (in another tab, or an OAuth account): nothing to
    // send, and the client only needs to refresh its session.
    if (!user || user.provider !== "EMAIL_PASSWORD" || user.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    // Per user, not per IP: every request sends an e-mail, and the limit is
    // what keeps the button from becoming a way to flood someone's inbox.
    const limited = await rateLimit(`auth:verify-email:resend:${user.id}`, 3, 60 * 15, "closed");
    if (limited) {
      return rateLimitResponse(t("auth.verifyEmail.resendRateLimited"));
    }

    await sendEmailVerification(user, resolveApiLocale(req));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return internalErrorResponse("auth-verify-email-resend", error, t("common.internalError"));
  }
}
