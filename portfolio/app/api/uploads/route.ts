import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-helpers";
import {
  badRequestResponse,
  forbiddenResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { isValidPostId, uploadPostMedia, validateFileUpload, type UploadKind } from "@/lib/s3";

/**
 * Stores a post image. The request body is the file itself, sent with its own
 * Content-Type; postId and kind travel in the query string.
 *
 *   POST /api/uploads?postId=<id>&kind=cover|inline
 *   Content-Type: image/png
 *   <file bytes>
 *
 * The file goes through the app instead of a presigned URL straight to MinIO.
 * A presigned URL is signed for the host it was generated against (the
 * internal `minio:9000`), and SigV4 covers the Host header and the path, so
 * pointing it at the public domain breaks the signature: MinIO answers 403.
 * nginx's /media/ is also read-only by design, so the bucket has no public
 * write path at all. The app is the only writer, over the Docker network.
 *
 * A raw body rather than multipart keeps the request exactly the size of the
 * file, so nginx's `client_max_body_size 10M` and MAX_MEDIA_BYTES (lib/media.ts)
 * agree.
 */
export async function POST(request: NextRequest) {
  const t = await getApiTranslator(request);

  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return auth.status === 401
        ? unauthorizedResponse(t("common.unauthorized"))
        : forbiddenResponse(t("common.forbidden"));
    }

    const postId = request.nextUrl.searchParams.get("postId");
    const kind = request.nextUrl.searchParams.get("kind");
    const contentType = (request.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();

    if (!postId || !kind) {
      return badRequestResponse(t("uploads.missingFields"));
    }

    // The post may not exist yet (new posts get their id before the first
    // save), so only the shape is checked: it becomes a path segment.
    if (!isValidPostId(postId)) {
      return badRequestResponse(t("common.invalidRequest"));
    }

    if (kind !== "cover" && kind !== "inline") {
      return badRequestResponse(t("uploads.invalidKind"));
    }

    // Reject on the declared length before reading the body into memory.
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    const invalid = checkFile(contentType, declaredLength, t);
    if (invalid) return invalid;

    const body = new Uint8Array(await request.arrayBuffer());
    if (body.byteLength === 0) {
      return badRequestResponse(t("common.invalidRequest"));
    }

    // Content-Length can be absent (chunked bodies), so check the real size.
    const tooLarge = checkFile(contentType, body.byteLength, t);
    if (tooLarge) return tooLarge;

    const key = await uploadPostMedia(postId, kind as UploadKind, contentType, body);
    return NextResponse.json({ key });
  } catch (error) {
    return internalErrorResponse("uploads", error, t("uploads.internal"));
  }
}

function checkFile(
  contentType: string,
  size: number,
  t: Awaited<ReturnType<typeof getApiTranslator>>,
) {
  try {
    validateFileUpload(contentType, size);
    return null;
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
}
