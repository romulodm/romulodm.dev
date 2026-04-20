import { NextRequest, NextResponse } from "next/server";

import { badRequestResponse } from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { recordPostViewByIdentifier } from "@/lib/views";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(req);
  const params = await props.params;
  const postId = params.id;

  let identifier: string | undefined;

  try {
    const body = await req.json();
    identifier = body.userId || body.sessionId;
  } catch {
    return badRequestResponse(t("posts.invalidBody"));
  }

  if (!identifier) {
    return badRequestResponse(t("posts.identifierRequired"));
  }

  const result = await recordPostViewByIdentifier(postId, identifier);
  return NextResponse.json(result);
}

export async function GET(req: NextRequest) {
  const t = await getApiTranslator(req);

  return NextResponse.json(
    {
      error: t("posts.queueOnly"),
    },
    { status: 410 },
  );
}
