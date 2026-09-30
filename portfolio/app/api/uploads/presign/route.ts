import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-helpers";
import {
  badRequestResponse,
  forbiddenResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { generatePresignedUpload, isValidPostId, validateFileUpload } from "@/lib/s3";

export async function POST(request: NextRequest) {
  const t = await getApiTranslator(request);

  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return auth.status === 401
        ? unauthorizedResponse(t("common.unauthorized"))
        : forbiddenResponse(t("common.forbidden"));
    }

    const { postId, contentType, kind } = await request.json();

    if (!postId || !contentType || !kind) {
      return badRequestResponse(t("uploads.missingFields"));
    }

    // The post may not exist yet (new posts get their id before the first
    // save), so only the shape is checked: it becomes a path segment.
    if (!isValidPostId(postId)) {
      return badRequestResponse(t("common.invalidRequest"));
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

    const result = await generatePresignedUpload(postId, kind, contentType);
    return NextResponse.json(result);
  } catch (error) {
    return internalErrorResponse("presign", error, t("uploads.internal"));
  }
}
