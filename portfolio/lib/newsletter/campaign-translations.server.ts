// lib/newsletter/campaign-translations.server.ts

import "server-only";

import { z } from "zod";
import { Prisma } from "@romulo/database";

import { logApiError } from "@/lib/api-errors";
import { optionalPlainText, sanitizePlainText } from "@/lib/api-validation";
import { translateCampaignCopy } from "@/lib/translate";

import {
  CAMPAIGN_SOURCE_LOCALE,
  CAMPAIGN_TARGET_LOCALES,
  isTranslatableCampaignType,
  parseCampaignTranslations,
  type CampaignTranslations,
  type CampaignType,
  type LocalizedCopy,
} from "./campaign-copy";

export const SUBJECT_MAX_LENGTH = 160;
export const PREVIEW_TEXT_MAX_LENGTH = 200;

export interface BuildCampaignTranslationsInput {
  type: CampaignType;
  source: LocalizedCopy;
  /** Value currently stored in `Campaign.translations` (null on create). */
  stored: unknown;
  /** Translations as submitted by the admin form, possibly hand-edited. */
  submitted?: Record<string, Partial<LocalizedCopy>>;
}

export interface BuildCampaignTranslationsResult {
  translations: CampaignTranslations | null;
  /** True when a new machine translation was needed and the OpenAI call failed. */
  translationFailed: boolean;
}

function sanitizeSubmitted(
  submitted: BuildCampaignTranslationsInput["submitted"],
): Record<string, Partial<LocalizedCopy>> {
  const result: Record<string, Partial<LocalizedCopy>> = {};
  for (const code of CAMPAIGN_TARGET_LOCALES) {
    const entry = submitted?.[code];
    if (!entry) continue;
    result[code] = {
      ...(entry.subject !== undefined && {
        subject: sanitizePlainText(entry.subject, SUBJECT_MAX_LENGTH),
      }),
      ...(entry.previewText !== undefined && {
        previewText: optionalPlainText(entry.previewText, PREVIEW_TEXT_MAX_LENGTH),
      }),
    };
  }
  return result;
}

/**
 * Decides what goes into `Campaign.translations` on save.
 *
 * - Source copy unchanged since the last translation: keep the stored
 *   translations, with any hand edits from the form applied on top. No
 *   OpenAI call.
 * - Source copy changed (or never translated): translate again. A field the
 *   admin edited in this same save (submitted value differs from the stored
 *   one) wins over the fresh machine translation.
 * - Translation fails: return null so every recipient gets the source copy
 *   rather than a translation of an older subject, and report the failure so
 *   the form can say so. The next save retries, because nothing was stored.
 */
export async function buildCampaignTranslations(
  input: BuildCampaignTranslationsInput,
): Promise<BuildCampaignTranslationsResult> {
  if (!isTranslatableCampaignType(input.type)) {
    return { translations: null, translationFailed: false };
  }

  const stored = parseCampaignTranslations(input.stored);
  const submitted = sanitizeSubmitted(input.submitted);
  const sourceUnchanged =
    stored !== null &&
    stored.source.subject === input.source.subject &&
    stored.source.previewText === input.source.previewText;

  if (sourceUnchanged) {
    const locales: Record<string, LocalizedCopy> = {};
    for (const code of CAMPAIGN_TARGET_LOCALES) {
      const current = stored.locales[code];
      if (!current) continue;
      const edited = submitted[code] ?? {};
      locales[code] = {
        subject: edited.subject || current.subject,
        previewText: edited.previewText !== undefined ? edited.previewText : current.previewText,
      };
    }
    return { translations: { source: stored.source, locales }, translationFailed: false };
  }

  let fresh: Record<string, LocalizedCopy>;
  try {
    fresh = await translateCampaignCopy(input.source, CAMPAIGN_SOURCE_LOCALE, CAMPAIGN_TARGET_LOCALES);
  } catch (error) {
    logApiError("newsletter.campaign_translate", error);
    return { translations: null, translationFailed: true };
  }

  const locales: Record<string, LocalizedCopy> = {};
  for (const code of CAMPAIGN_TARGET_LOCALES) {
    const machine = fresh[code];
    const previous = stored?.locales[code];
    const edited = submitted[code] ?? {};
    const subjectEdited =
      edited.subject !== undefined && edited.subject !== "" && edited.subject !== previous?.subject;
    const previewEdited =
      edited.previewText !== undefined && edited.previewText !== (previous?.previewText ?? null);

    locales[code] = {
      subject: subjectEdited
        ? edited.subject!
        : sanitizePlainText(machine.subject, SUBJECT_MAX_LENGTH),
      previewText: !input.source.previewText
        ? null
        : previewEdited
          ? (edited.previewText ?? null)
          : optionalPlainText(machine.previewText, PREVIEW_TEXT_MAX_LENGTH),
    };
  }

  return { translations: { source: input.source, locales }, translationFailed: false };
}

/** Prisma needs DbNull, not null, to clear a nullable Json column. */
export function translationsToJson(
  translations: CampaignTranslations | null,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return translations ? (translations as unknown as Prisma.InputJsonValue) : Prisma.DbNull;
}

/** Zod shape of the `translations` field the admin form submits. */
export const submittedTranslationsSchema = z
  .record(
    z.string(),
    z.object({
      subject: z.string().optional(),
      previewText: z.string().nullable().optional(),
    }),
  )
  .optional();
