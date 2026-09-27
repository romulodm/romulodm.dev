import { NextRequest, NextResponse } from "next/server";
import { confirmSubscription } from "@/lib/newsletter/newsletter.service";
import { logApiError, rateLimitResponse } from "@/lib/api-errors";
import { getApiTranslator } from '@/lib/api-intl'
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

// Confirmação é um clique único vindo do e-mail. Qualquer volume acima disso
// é enumeração de token — sem limite, dá para varrer o espaço de tokens de
// graça, e cada tentativa custa uma consulta ao banco.
const CONFIRM_MAX = 10;
const CONFIRM_WINDOW_SECONDS = 60 * 10;

export async function GET(req: NextRequest, props: { params: Promise<{ token: string }> }) {
  const t = await getApiTranslator(req)
  const params = await props.params;
  const { token } = params;

  if (!token || token.length > 256) {
    return NextResponse.json({ error: t('newsletter.confirm.missingToken') }, { status: 400 });
  }

  const ip = getRequestIp(req);
  if (await rateLimit(`newsletter:confirm:${ip}`, CONFIRM_MAX, CONFIRM_WINDOW_SECONDS)) {
    return rateLimitResponse(t('common.rateLimited'));
  }

  try {
    const result = await confirmSubscription(token);

    if (result.status === "invalid_token") {
      return NextResponse.json(
        { error: t('newsletter.confirm.invalidToken') },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: t('newsletter.confirm.success'),
    });
  } catch (error) {
    logApiError("newsletter.confirm", error);
    return NextResponse.json({ error: t('newsletter.confirm.internal') }, { status: 500 });
  }
}
