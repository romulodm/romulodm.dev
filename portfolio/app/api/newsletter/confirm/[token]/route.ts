// src/app/api/newsletter/confirm/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { confirmSubscription } from "@/lib/newsletter/newsletter.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  const { token } = params;
  if (!token) {
    return NextResponse.json({ error: "Token ausente." }, { status: 400 });
  }

  try {
    const result = await confirmSubscription(token);

    if (result.status === "invalid_token") {
      return NextResponse.json(
        { error: "Token inválido ou expirado. Solicite uma nova inscrição." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: "Inscrição confirmada com sucesso! Bem-vindo(a).",
    });
  } catch (err) {
    console.error("[confirm]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
