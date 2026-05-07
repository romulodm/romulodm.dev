import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";

const intl = createIntlMiddleware({
    locales: ["pt", "en"],
    defaultLocale: "pt",
    localePrefix: "always",
});

export default async function proxy(req: NextRequest) {
    return intl(req); // retorna direto, sem o if
}

export const config = {
    matcher: [
        "/((?!api|_next|.*\\..*|_next/static|_next/image|favicon.ico).*)",
    ],
};