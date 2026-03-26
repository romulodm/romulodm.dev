// src/app/api/newsletter/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { subscribe } from "@/lib/newsletter/newsletter.service";
import { rateLimit } from "@/lib/rate-limit"; // see note below

export async function POST(req: NextRequest) {
  // Basic rate limiting: 5 subscribe attempts per IP per 10 minutes
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const limited = await rateLimit(`newsletter:subscribe:${ip}`, 5, 600);
  if (limited) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 },
    );
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }

  try {
    await subscribe(email);
    // Always return the same message (prevents email enumeration)
    return NextResponse.json({
      message: "Verifique seu e-mail para confirmar a inscrição.",
    });
  } catch (err) {
    console.error("[subscribe]", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}
