import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@romulo/database";

import { requireAdmin } from "@/lib/auth-helpers";
import {
  forbiddenResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";

/** Removes the tester flag. The subscription itself is left untouched. */
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(req);
  const params = await props.params;
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.status === 401
      ? unauthorizedResponse(t("common.unauthorized"))
      : forbiddenResponse(t("common.forbidden"));
  }

  try {
    // updateMany: removing an id that is already gone is not an error.
    await prisma.newsletterSubscriber.updateMany({
      where: { id: params.id },
      data: { isTestRecipient: false },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return internalErrorResponse(
      "admin-newsletter-test-recipients-remove",
      error,
      t("common.internalError"),
    );
  }
}
