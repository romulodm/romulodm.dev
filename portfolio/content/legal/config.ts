// content/legal/config.ts
//
// Single source of truth for the data shown in the legal documents.
// The .md files use {{KEY}} placeholders that lib/legal.ts replaces with
// these values at render time — don't edit the .md files to fill anything in.
//
// If a value is left empty, /legal fails to render with a message stating
// which key is missing, instead of publishing "{{OWNER}}" live. This is
// intentional: a legal document with a visible placeholder is worthless.

export interface LegalConfig {
  /** Full legal name or company name (+ tax ID, if applicable). */
  OWNER: string
  /** Mailing address. City/state is enough. */
  ADDRESS: string
  /** General contact email — used in the Terms and for refund requests. */
  CONTACT_EMAIL: string
  /** Email for privacy/data-protection matters. Can be the same as contact. */
  PRIVACY_EMAIL: string
  /** Canonical domain, without protocol. E.g.: romulodm.dev */
  DOMAIN: string
  /**
   * Date of the last actual revision of the text — NOT the last deploy.
   * Only change this when the document's content actually changes.
   */
  EFFECTIVE_DATE: string
  /** Jurisdiction/venue chosen in the Terms. Usually your place of domicile. */
  VENUE: string
  /** License for the blog posts, or "all rights reserved". */
  CONTENT_LICENSE: string
}

const base: LegalConfig = {
  OWNER: 'Romulo de Moraes',
  ADDRESS: 'Av. Itália Carreiros, Rio Grande — RS, Brasil',
  CONTACT_EMAIL: 'eu@romulodm.dev',
  PRIVACY_EMAIL: 'eu@romulodm.dev',
  DOMAIN: 'romulodm.dev',
  VENUE: 'Rio Grande — RS',

  EFFECTIVE_DATE: '',

  CONTENT_LICENSE: 'CC BY-NC-SA 4.0',
}

const byLocale: Partial<Record<string, Partial<LegalConfig>>> = {
  pt: { EFFECTIVE_DATE: '28 de setembro de 2026' },
  en: { EFFECTIVE_DATE: 'September 28, 2026' },
  es: { EFFECTIVE_DATE: '28 de septiembre de 2026' },
}

export function getLegalConfig(locale: string): LegalConfig {
  return { ...base, ...(byLocale[locale] ?? {}) }
}
