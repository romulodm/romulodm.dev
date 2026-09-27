import { NextRequest, NextResponse } from "next/server";

import { notFoundResponse, rateLimitResponse } from "@/lib/api-errors";
import { getApiTranslator } from "@/lib/api-intl";
import { registerPostView } from "@/lib/views-internal";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const t = await getApiTranslator(req);
  const { id: postId } = await props.params;

  // Nada é lido do body. O identificador de dedupe é resolvido dentro de
  // registerPostView (sessão, senão cookie assinado emitido pelo servidor) —
  // aceitá-lo do cliente permitia gerar chaves ilimitadas no Redis e queimar
  // o cooldown de outro usuário.
  const result = await registerPostView(postId);

  if (result.reason === "invalid_post") {
    return notFoundResponse(t("posts.notFound"));
  }

  if (result.reason === "rate_limited") {
    return rateLimitResponse(t("common.rateLimited"));
  }

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
