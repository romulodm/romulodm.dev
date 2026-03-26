// src/app/api/newsletter/unsubscribe/[token]/route.ts
//
// POST /api/newsletter/unsubscribe/:token  → confirms unsubscription (1-click)
// GET  /api/newsletter/unsubscribe/:token  → redirects to the unsubscribe page
//      (for email clients that pre-fetch links)
//

import { NextRequest, NextResponse } from "next/server";
import { confirmUnsubscribe } from "@/lib/newsletter/newsletter.service";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  const { token } = params;
  if (!token) {
    return NextResponse.json({ error: "Token ausente." }, { status: 400 });
  }

  try {
    const result = await confirmUnsubscribe(token);

    switch (result.status) {
      case "invalid_token":
        return NextResponse.json(
          { error: "Token inválido." },
          { status: 400 },
        );
      case "already_unsubscribed":
      case "unsubscribed":
        return NextResponse.json({
          message: "Você foi removido da newsletter com sucesso.",
        });
    }
  } catch (err) {
    console.error("[unsubscribe]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

/** Handles prefetch bots — redirect to page, don't unsubscribe on GET. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  return NextResponse.redirect(
    `${BASE_URL}/newsletter/unsubscribe/${params.token}`,
  );
}
