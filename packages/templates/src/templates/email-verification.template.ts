import { wrapper, greetingRow, ctaButton, urlFallback, DEFAULT_ACCENT } from "../base";
import { getStrings } from "../i18n";
import { EmailVerificationTemplateOptions } from "../types";

/** Account e-mail: confirms the address of an e-mail and password sign-up. */
export function emailVerificationTemplate(opts: EmailVerificationTemplateOptions): string {
  const accent = opts.brand.accentColor ?? DEFAULT_ACCENT;
  const s = getStrings(opts.recipient.locale);

  const body = `
  ${greetingRow(opts.recipient.displayName, opts.recipient.locale)}
  <tr>
    <td style="padding:16px 36px 36px;">
      <h1 style="margin:0 0 10px;font-family:'Inter',sans-serif;
                 color:#1a1412;font-size:20px;font-weight:600;line-height:1.3;
                 letter-spacing:-0.3px;">
        ${s.verifyEmailHeading}
      </h1>
      <p style="margin:0;font-family:'Inter',sans-serif;
                color:#6b6460;font-size:15px;line-height:1.65;">
        ${s.verifyEmailBody}
      </p>
      ${ctaButton(opts.verifyUrl, s.verifyEmailCta, accent)}
      ${urlFallback(opts.verifyUrl, s.confirmationUrlFallback, accent)}
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f0ede8;">
        <p style="margin:0 0 6px;font-family:'Inter',sans-serif;
                  color:#b8b0a8;font-size:12px;line-height:1.6;">
          ${s.verifyEmailExpiry(opts.expiresInHours ?? 24)}
        </p>
        <p style="margin:0;font-family:'Inter',sans-serif;
                  color:#b8b0a8;font-size:12px;line-height:1.6;">
          ${s.verifyEmailIgnore}
        </p>
      </div>
    </td>
  </tr>`;

  // null: an account email, not list mail — no unsubscribe link.
  return wrapper(body, opts.brand, null, opts.recipient.locale);
}
