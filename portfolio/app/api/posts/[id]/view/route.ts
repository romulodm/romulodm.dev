import { NextRequest, NextResponse } from "next/server";

import { recordPostViewByIdentifier } from "@/lib/views";

/**
 * Thin compatibility wrapper for older clients that still POST to this route.
 * The canonical flow now lives in `portfolio/lib/views.ts` and buffers into
 * the worker-backed queue path used by the views worker.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const postId = params.id;

  let identifier: string | undefined;

  try {
    const body = await req.json();
    identifier = body.userId || body.sessionId;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!identifier) {
    return NextResponse.json({ error: "identifier required" }, { status: 400 });
  }

  const result = await recordPostViewByIdentifier(postId, identifier);
  return NextResponse.json(result);
}

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      error:
        "View flushing now runs exclusively through the worker-backed queue path.",
    },
    { status: 410 },
  );
}
