import type { EmailLocale } from "./i18n";

// ─── Brand config ─────────────────────────────────────────────────────────────

export interface BrandConfig {
  /** Displayed in the email footer and subjects, e.g. "romulodm" */
  name: string;
  /** Full site URL, used for header link and fallback hrefs */
  baseUrl: string;
  /** Primary accent colour (hex). Defaults to #f57842 */
  accentColor?: string;
  /** Full URL to the privacy policy page */
  privacyUrl?: string;
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
  content?: string;
  post?: PostMeta;
  unsubscribeUrl: string;
  trackingPixelUrl?: string;
  brand: BrandConfig;
  recipient: RecipientContext;
}

export type DigestTemplateOptions = {
  subject: string;
  posts: DigestPost[];
  unsubscribeUrl: string;
  trackingPixelUrl?: string;
  brand: BrandConfig;
  recipient: RecipientContext;
};