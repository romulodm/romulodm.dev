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
} from "./types";

// ─── i18n ─────────────────────────────────────────────────────────────────────
export type { EmailLocale } from "./i18n";
export { resolveLocale, getStrings, SUPPORTED_LOCALES } from "./i18n";

// ─── Templates ────────────────────────────────────────────────────────────────
export { confirmationTemplate } from "./templates/confirmation";
export { welcomeTemplate } from "./templates/welcome";
export { unsubscribeConfirmTemplate } from "./templates/unsubscribe";
export { passwordResetTemplate } from "./templates/password-reset";
export { campaignTemplate } from "./templates/campaign";

// ─── Utilities ────────────────────────────────────────────────────────────────
export { logoImg } from "./logo";
export { DEFAULT_ACCENT } from "./base";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derives a display name from an email address.
 * "fulano@gmail.com" → "fulano"  (first letter capitalised)
 */
export function displayNameFromEmail(email: string): string {
  const prefix = email.split("@")[0] ?? email;
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}
