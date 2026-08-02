import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

const intl = createIntlMiddleware({
    locales: ["pt", "en"],
    defaultLocale: "pt",
    localePrefix: "always",
});

export default async function proxy(req: NextRequest) {
    try {
        return intl(req);
    } catch (error) {
        Sentry.captureException(error, {
            tags: { runtime: "proxy" },
            extra: { pathname: req.nextUrl.pathname },
        });

        throw error;
    }
}

export const config = {
    matcher: [
        "/((?!api|monitoring|_next|.*\\..*|_next/static|_next/image|favicon.ico).*)",
    ],
};
