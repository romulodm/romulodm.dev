import type { EmailLocale } from "./i18n";

// ─── Brand config ─────────────────────────────────────────────────────────────

export interface BrandConfig {
  /** Displayed in the email footer and subjects, e.g. "romulodm" */
  name: string;
  /** Full site URL, used for header link and fallback hrefs */
  baseUrl: string;
  /**
   * Absolute URL of the header logo (a PNG, since email clients strip SVG).
   * Defaults to `${baseUrl}/email-logo.png`.
   */
  logoUrl?: string;
  /** Primary accent colour (hex). Defaults to #f57842 */
  accentColor?: string;
  /**
   * Full URL to the privacy policy page. Leave unset to use the site's own
   * locale-aware route (/<locale>/legal/privacy-policy), which is what every
   * caller should do; this exists only to point at an external policy.
   */
  privacyUrl?: string;
  /**
   * Sender's postal address, printed in the footer of every email. Defaults to
   * DEFAULT_POSTAL_ADDRESS. Plain text on purpose: a map link, especially a
   * URL shortener, is a spam signal in the footer of bulk mail.
   */
  postalAddress?: string;
}

// ─── Shared per-recipient context ─────────────────────────────────────────────

export interface RecipientContext {
  /**
   * Display name for the greeting line.
   * Pass user.username when linked to an account, otherwise the email
   * prefix (e.g. "fulano" from "fulano@gmail.com"), capitalised.
   */
  displayName: string;
  /**
   * Preferred locale for this recipient. Defaults to "en".
   */
  locale?: EmailLocale;
}

export type DigestPost = {
  title: string;
  summary?: string;
  tags?: string[];
  imageUrl?: string;
  url: string;
};

// ─── Template option bags ─────────────────────────────────────────────────────

export interface ConfirmationTemplateOptions {
  confirmationUrl: string;
  brand: BrandConfig;
  recipient: RecipientContext;
}

export interface WelcomeTemplateOptions {
  unsubscribeUrl: string;
  brand: BrandConfig;
  recipient: RecipientContext;
}

export interface UnsubscribeConfirmTemplateOptions {
  unsubscribeUrl: string;
  brand: BrandConfig;
  recipient: RecipientContext;
}

export interface PasswordResetTemplateOptions {
  code: string;
  expiresInMinutes?: number;
  brand: BrandConfig;
  recipient: RecipientContext;
}

export interface PostMeta {
  imageUrl?: string;
  title: string;
  summary?: string;
  tags?: string[];
  url: string;
  ctaLabel?: string;
}

export interface CampaignTemplateOptions {
  subject: string;
  /** Inbox preview text rendered as a hidden preheader. */
  previewText?: string | null;
  content?: string;
  post?: PostMeta;
  unsubscribeUrl: string;
  trackingPixelUrl?: string;
  brand: BrandConfig;
  recipient: RecipientContext;
}

export type DigestTemplateOptions = {
  subject: string;
  /** Inbox preview text rendered as a hidden preheader. */
  previewText?: string | null;
  posts: DigestPost[];
  unsubscribeUrl: string;
  trackingPixelUrl?: string;
  brand: BrandConfig;
  recipient: RecipientContext;
};