// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  BrandConfig,
  ConfirmationTemplateOptions,
  WelcomeTemplateOptions,
  UnsubscribeConfirmTemplateOptions,
  PasswordResetTemplateOptions,
  PostMeta,
  CampaignTemplateOptions,
} from "./types";

// ─── Templates ────────────────────────────────────────────────────────────────
export { confirmationTemplate } from "./templates/confirmation";
export { welcomeTemplate } from "./templates/welcome";
export { unsubscribeConfirmTemplate } from "./templates/unsubscribe";
export { passwordResetTemplate } from "./templates/password-reset";
export { campaignTemplate } from "./templates/campaign";

// ─── Utilities ────────────────────────────────────────────────────────────────
export { logoImg } from "./logo";
export { DEFAULT_ACCENT } from "./base";
