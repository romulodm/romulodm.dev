import { NextRequest, NextResponse } from "next/server";
import { confirmUnsubscribe } from "@/lib/newsletter/newsletter.service";
import { getApiTranslator } from '@/lib/api-intl'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

export async function POST(req: NextRequest, props: { params: Promise<{ token: string }> }) {
  const t = await getApiTranslator(req)
  const params = await props.params;
  const { token } = params;
  if (!token) {
    return NextResponse.json({ error: t('newsletter.unsubscribe.missingToken') }, { status: 400 });
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
    console.error("[unsubscribe]", error);
    return NextResponse.json({ error: t('newsletter.unsubscribe.internal') }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  return NextResponse.redirect(
    `${BASE_URL}/newsletter/unsubscribe/${params.token}`,
  );
}
