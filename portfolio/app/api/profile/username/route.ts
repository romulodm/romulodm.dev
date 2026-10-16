import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@romulo/database";

import {
  badRequestResponse,
  conflictResponse,
  internalErrorResponse,
  rateLimitResponse,
  unauthorizedResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { requireAuth } from "@/lib/auth-helpers";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";
import { checkUsername, normalizeUsernameInput } from "@/lib/username-rules";

/**
 * First (and only) username choice of an account whose username was assigned
 * by the system: OAuth sign-ups, and older accounts whose username was derived
 * from the e-mail address. The "choose a username" dialog posts here.
 *
 * Only the first choice goes through here; once usernameChosenAt is set the
 * request is refused. Later renames happen in the profile settings
 * (updateProfileSettings in app/[locale]/profile/[username]/actions.ts),
 * which applies the same rules.
 */
export async function POST(req: NextRequest) {
  const t = await getApiTranslator(req);
  const auth = await requireAuth();
  if (!auth.ok) {
    return unauthorizedResponse(t("common.unauthorized"));
  }

  try {
    const limited = await rateLimit(
      `profile:username:${auth.user.id}:${getRequestIp(req)}`,
      10,
      60,
    );
    if (limited) {
      return rateLimitResponse(t("common.rateLimited"));
    }

    const body = await req.json().catch(() => null);
    const username = normalizeUsernameInput(
      typeof body?.username === "string" ? body.username : "",
    );

    const problem = checkUsername(username);
    // The reserved list guards against impersonating the site; the site owner
    // is exactly who may use those names.
    if (problem && !(problem === "reserved" && auth.user.admin)) {
      return badRequestResponse(t(`username.${problem}`));
    }

    // The `usernameChosenAt: null` filter makes the check-and-set atomic: two
    // tabs submitting at once cannot both win.
    const updated = await prisma.user.updateMany({
      where: { id: auth.user.id, usernameChosenAt: null },
      data: { username, usernameChosenAt: new Date() },
    });
    if (updated.count === 0) {
      return conflictResponse(t("username.alreadyChosen"));
    }

    return NextResponse.json({ ok: true, username });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return conflictResponse(t("username.taken"));
    }
    return internalErrorResponse("profile-username", error, t("common.internalError"));
  }
}
