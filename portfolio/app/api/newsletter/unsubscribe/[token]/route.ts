import { NextRequest, NextResponse } from "next/server";
import { logApiError, rateLimitResponse } from "@/lib/api-errors";
import { confirmUnsubscribe } from "@/lib/newsletter/newsletter.service";
import { getApiTranslator } from '@/lib/api-intl'
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

// Mesma lógica do confirm: sem limite, o token vira enumerável e cada
// tentativa custa uma consulta ao banco. Aqui o dano é pior — acertar um
// token remove alguém da lista.
const UNSUBSCRIBE_MAX = 10;
const UNSUBSCRIBE_WINDOW_SECONDS = 60 * 10;

export async function POST(req: NextRequest, props: { params: Promise<{ token: string }> }) {
  const t = await getApiTranslator(req)
  const params = await props.params;
  const { token } = params;
  if (!token || token.length > 256) {
    return NextResponse.json({ error: t('newsletter.unsubscribe.missingToken') }, { status: 400 });
  }

  const ip = getRequestIp(req);
  if (await rateLimit(`newsletter:unsubscribe:${ip}`, UNSUBSCRIBE_MAX, UNSUBSCRIBE_WINDOW_SECONDS)) {
    return rateLimitResponse(t('common.rateLimited'));
  }

  try {
    const result = await confirmUnsubscribe(token);

    switch (result.status) {
      case "invalid_token":
        return NextResponse.json(
          { error: t('newsletter.unsubscribe.invalidToken') },
          { status: 400 },
        );
      case "already_unsubscribed":
      case "unsubscribed":
        return NextResponse.json({
          message: t('newsletter.unsubscribe.success'),
        });
    }
  } catch (error) {
    logApiError("newsletter.unsubscribe", error);
    return NextResponse.json({ error: t('newsletter.unsubscribe.internal') }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  return NextResponse.redirect(
    `${BASE_URL}/newsletter/unsubscribe/${encodeURIComponent(params.token)}`,
  );
}
