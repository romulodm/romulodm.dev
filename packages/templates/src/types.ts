// ─── Core types ──────────────────────────────────────────────────────────────

export interface BrandConfig {
  /** Displayed name next to the logo, e.g. "romulodm" */
  name: string;
  /** Full URL of the site, used for the header link */
  baseUrl: string;
  /** Primary accent color (hex). Defaults to #f57842 */
  accentColor?: string;
}

// ─── Template option bags ─────────────────────────────────────────────────────

export interface ConfirmationTemplateOptions {
  confirmationUrl: string;
  brand: BrandConfig;
}

export interface WelcomeTemplateOptions {
  unsubscribeUrl: string;
  brand: BrandConfig;
}

export interface UnsubscribeConfirmTemplateOptions {
  unsubscribeUrl: string;
  brand: BrandConfig;
}

export interface PasswordResetTemplateOptions {
  code: string;
  expiresInMinutes?: number;
  brand: BrandConfig;
}

export interface PostMeta {
  /** Full URL of the cover/hero image */
  imageUrl?: string;
  title: string;
  summary?: string;
  /** Array of tag strings, e.g. ["typescript", "nextjs"] */
  tags?: string[];
  /** Canonical post URL the CTA button links to */
  url: string;
  /** Override the CTA label. Defaults to "Read article" */
  ctaLabel?: string;
}

export interface CampaignTemplateOptions {
  subject: string;
  /** Raw HTML body for CUSTOM campaigns */
  content?: string;
  /** Structured post data for POST_BASED campaigns */
  post?: PostMeta;
  unsubscribeUrl: string;
  /** 1×1 tracking pixel URL. Omit to skip the pixel. */
  trackingPixelUrl?: string;
  brand: BrandConfig;
}
