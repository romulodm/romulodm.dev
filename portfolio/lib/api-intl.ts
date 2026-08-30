import { createTranslator } from "use-intl/core";

type SupportedApiLocale = "en" | "pt";

const SUPPORTED_API_LOCALES: SupportedApiLocale[] = ["en", "pt"];

function normalizeLocale(candidate: string | null | undefined): SupportedApiLocale | null {
  if (!candidate) {
    return null;
  }

  const normalized = candidate.toLowerCase();

  if (normalized.startsWith("pt")) {
    return "pt";
  }

  if (normalized.startsWith("en")) {
    return "en";
  }

  return null;
}

function getCookieLocale(cookieHeader: string | null): SupportedApiLocale | null {
  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  return normalizeLocale(match?.[1]);
}

function getPathLocale(pathLike: string | null): SupportedApiLocale | null {
  if (!pathLike) {
    return null;
  }

  const match = pathLike.match(/\/(en|pt)(?:\/|$)/i);
  return normalizeLocale(match?.[1]);
}

function getAcceptLanguageLocale(acceptLanguage: string | null): SupportedApiLocale | null {
  if (!acceptLanguage) {
    return null;
  }

  const candidates = acceptLanguage
    .split(",")
    .map((part) => part.trim().split(";")[0])
    .filter(Boolean);

  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate);
    if (locale) {
      return locale;
    }
  }

  return null;
}

export function resolveApiLocale(request: Request): SupportedApiLocale {
  const headerLocale =
    normalizeLocale(request.headers.get("x-next-intl-locale")) ??
    getCookieLocale(request.headers.get("cookie")) ??
    getPathLocale(request.headers.get("referer")) ??
    getAcceptLanguageLocale(request.headers.get("accept-language"));

  return headerLocale ?? "pt";
}

async function loadMessages(locale: SupportedApiLocale) {
  return (await import(`../messages/${locale}.json`)).default;
}

export async function getApiTranslator(request: Request, namespace: string = "api") {
  const locale = resolveApiLocale(request);
  const messages = await loadMessages(locale);

  return createTranslator({
    locale,
    messages,
    namespace,
  });
}
