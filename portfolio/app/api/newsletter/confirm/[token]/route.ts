import { NextRequest, NextResponse } from "next/server";
import { confirmSubscription } from "@/lib/newsletter/newsletter.service";
import { getApiTranslator } from '@/lib/api-intl'

export async function GET(req: NextRequest, props: { params: Promise<{ token: string }> }) {
  const t = await getApiTranslator(req)
  const params = await props.params;
  const { token } = params;

  if (!token) {
    return NextResponse.json({ error: t('newsletter.confirm.missingToken') }, { status: 400 });
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
    console.error("[confirm]", error);
    return NextResponse.json({ error: t('newsletter.confirm.internal') }, { status: 500 });
  }
}
