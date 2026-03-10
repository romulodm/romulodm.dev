import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";

const intl = createIntlMiddleware({
    locales: ["pt", "en"],
    defaultLocale: "pt",
    localePrefix: "always",
});

export default async function middleware(req: NextRequest) {
    // 1) i18n primeiro: garante /pt e /en
    const intlResponse = intl(req);
    if (intlResponse) return intlResponse;

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next|.*\\..*|_next/static|_next/image|favicon.ico).*)", // Exclui API, arquivos estáticos e outros
    ],
};

/*
export const config = {
    matcher: ["/((?!api|_next|.*\\..*).*)"],
};
*/