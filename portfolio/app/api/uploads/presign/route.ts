import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-helpers";
import {
  badRequestResponse,
  forbiddenResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { generatePresignedUpload, validateFileUpload } from "@/lib/s3";

export async function POST(request: NextRequest) {
  const t = await getApiTranslator(request);

  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return auth.status === 401
        ? unauthorizedResponse(t("common.unauthorized"))
        : forbiddenResponse(t("common.forbidden"));
    }

    const { filename, contentType, kind } = await request.json();

    if (!filename || !contentType || !kind) {
      return badRequestResponse(t("uploads.missingFields"));
    }

    if (!["cover", "inline"].includes(kind)) {
      return badRequestResponse(t("uploads.invalidKind"));
    }

    try {
      validateFileUpload(contentType);
    } catch (error) {
      const message = (error as Error).message;

      if (message.startsWith("Invalid content type")) {
        return badRequestResponse(t("uploads.invalidContentType"));
      }

      if (message.startsWith("File too large")) {
        return badRequestResponse(t("uploads.fileTooLarge"));
      }

      return badRequestResponse(t("common.invalidRequest"));
    }

    const result = await generatePresignedUpload(filename, contentType, kind);
    return NextResponse.json(result);
  } catch (error) {
    return internalErrorResponse("presign", error, t("uploads.internal"));
  }
}
