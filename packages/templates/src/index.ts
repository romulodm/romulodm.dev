// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  BrandConfig,
  RecipientContext,
  ConfirmationTemplateOptions,
  WelcomeTemplateOptions,
  UnsubscribeConfirmTemplateOptions,
  PasswordResetTemplateOptions,
  PostMeta,
  CampaignTemplateOptions,
  DigestTemplateOptions,
} from "./types";

// ─── i18n ─────────────────────────────────────────────────────────────────────
export type { EmailLocale } from "./i18n";
export { resolveLocale, getStrings, SUPPORTED_LOCALES } from "./i18n";

// ─── Templates ────────────────────────────────────────────────────────────────
export { confirmationTemplate } from "./templates/confirmation.template";
export { welcomeTemplate } from "./templates/welcome.template";
export { unsubscribeConfirmTemplate } from "./templates/unsubscribe.template";
export { passwordResetTemplate } from "./templates/password-reset.template";
export { campaignTemplate } from "./templates/campaign.template";
export { digestTemplate } from "./templates/digest.template";

// ─── Utilities ────────────────────────────────────────────────────────────────
export { logoImg, EMAIL_LOGO_PATH } from "./logo";
export { DEFAULT_ACCENT, DEFAULT_POSTAL_ADDRESS, privacyPolicyUrl } from "./base";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derives a display name from an email address.
 * "fulano@gmail.com" → "fulano"  (first letter capitalised)
 */
export function displayNameFromEmail(email: string): string {
  const prefix = email.split("@")[0] ?? email;
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}
