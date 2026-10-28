import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Every locale file must hold exactly the same keys as pt.json.
 *
 * next-intl has no fallback configured here, so a key missing from one locale
 * renders as the raw key ("verifyEmail.success.title") for visitors on that
 * locale, with no build error and no runtime warning in production. That is
 * how Spanish shipped without the whole email-verification flow: the locale
 * was added first, the feature later, and only pt.json and en.json got its
 * keys. New locales are picked up from the folder, not from a list.
 */

const MESSAGES_DIR = fileURLToPath(new URL("../../messages/", import.meta.url));
const REFERENCE = "pt";

type Messages = { [key: string]: string | Messages };

function leafKeys(node: Messages, prefix = ""): string[] {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? leafKeys(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

function load(locale: string): Set<string> {
  const file = path.join(MESSAGES_DIR, `${locale}.json`);
  return new Set(leafKeys(JSON.parse(readFileSync(file, "utf8")) as Messages));
}

const locales = readdirSync(MESSAGES_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => file.replace(/\.json$/, ""))
  .filter((locale) => locale !== REFERENCE);

describe("message catalogs", () => {
  const reference = load(REFERENCE);

  it.each(locales)("%s.json has every key in pt.json", (locale) => {
    const keys = load(locale);
    expect([...reference].filter((key) => !keys.has(key))).toEqual([]);
  });

  it.each(locales)("%s.json has no key that pt.json lacks", (locale) => {
    const keys = load(locale);
    expect([...keys].filter((key) => !reference.has(key))).toEqual([]);
  });
});
