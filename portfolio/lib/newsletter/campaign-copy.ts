// lib/newsletter/campaign-copy.ts
//
// Localized subject/preview text of a newsletter campaign. Shared by the API
// routes, the dispatch service and the admin form, so it imports nothing
// server-only.

import { z } from "zod";

import { SUPPORTED_LOCALES } from "@/lib/locales";

export type CampaignType = "POST_BASED" | "CUSTOM" | "DIGEST";

/** Campaign copy is written in this locale in the admin form. */
export const CAMPAIGN_SOURCE_LOCALE = "pt";

/** Locales that receive a machine translation of the source copy. */
export const CAMPAIGN_TARGET_LOCALES: readonly string[] = SUPPORTED_LOCALES
  .map((locale) => locale.code)
  .filter((code) => code !== CAMPAIGN_SOURCE_LOCALE);

export interface LocalizedCopy {
  subject: string;
  previewText: string | null;
}

/**
 * Stored in `Campaign.translations`.
 *
 * `source` is the subject/previewText the translations were made from. When
 * the admin edits the source copy, the stored `source` no longer matches and
 * the next save translates again; while it matches, hand-edited translations
 * are kept as they are.
 */
export interface CampaignTranslations {
  source: LocalizedCopy;
  locales: Record<string, LocalizedCopy>;
}

const localizedCopySchema = z.object({
  subject: z.string(),
  previewText: z.string().nullable(),
});

const campaignTranslationsSchema = z.object({
  source: localizedCopySchema,
  locales: z.record(z.string(), localizedCopySchema),
});

export function parseCampaignTranslations(value: unknown): CampaignTranslations | null {
  const parsed = campaignTranslationsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * CUSTOM campaigns carry a hand-written HTML body in a single language.
 * Translating only their subject would send an English subject on top of a
 * Portuguese body, so they always go out with the source copy.
 */
export function isTranslatableCampaignType(type: CampaignType | string): boolean {
  return type === "POST_BASED" || type === "DIGEST";
}

/**
 * Subject/previewText a recipient with `locale` should receive. Falls back to
 * the source copy when the campaign type is not translated, when no
 * translation exists for that locale, or when the stored translation was made
 * from a different source text (a stale translation is worse than none).
 */
export function resolveCampaignCopy(
  campaign: {
    type: CampaignType | string;
    subject: string;
    previewText: string | null;
    translations: unknown;
  },
  locale: string,
): LocalizedCopy {
  const source: LocalizedCopy = {
    subject: campaign.subject,
    previewText: campaign.previewText,
  };
  if (locale === CAMPAIGN_SOURCE_LOCALE || !isTranslatableCampaignType(campaign.type)) {
    return source;
  }

  const translations = parseCampaignTranslations(campaign.translations);
  if (
    !translations ||
    translations.source.subject !== source.subject ||
    translations.source.previewText !== source.previewText
  ) {
    return source;
  }

  const localized = translations.locales[locale];
  if (!localized?.subject) return source;
  return {
    subject: localized.subject,
    previewText: localized.previewText ?? source.previewText,
  };
}
