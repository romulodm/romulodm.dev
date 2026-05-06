import { wrapper, greetingRow, ctaButton, urlFallback, DEFAULT_ACCENT } from "../base";
import { getStrings } from "../i18n";
import { ConfirmationTemplateOptions } from "../types";

export function confirmationTemplate(opts: ConfirmationTemplateOptions): string {
  const accent = opts.brand.accentColor ?? DEFAULT_ACCENT;
  const s = getStrings(opts.recipient.locale);

  const body = `
  ${greetingRow(opts.recipient.displayName, opts.recipient.locale)}
  <tr>
    <td style="padding:16px 36px 36px;">
      <h1 style="margin:0 0 10px;font-family:'Inter',sans-serif;
                 color:#1a1412;font-size:20px;font-weight:600;line-height:1.3;
                 letter-spacing:-0.3px;">
        ${s.confirmationHeading}
      </h1>
      <p style="margin:0;font-family:'Inter',sans-serif;
                color:#6b6460;font-size:15px;line-height:1.65;">
        ${s.confirmationBody}
      </p>
      ${ctaButton(opts.confirmationUrl, s.confirmationCta, accent)}
      ${urlFallback(opts.confirmationUrl, s.confirmationUrlFallback, accent)}
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f0ede8;">
        <p style="margin:0 0 6px;font-family:'Inter',sans-serif;
                  color:#b8b0a8;font-size:12px;line-height:1.6;">
          ${s.confirmationExpiry}
        </p>
        <p style="margin:0;font-family:'Inter',sans-serif;
                  color:#b8b0a8;font-size:12px;line-height:1.6;">
          ${s.confirmationIgnore}
        </p>
      </div>
    </td>
  </tr>`;

  return wrapper(body, opts.brand, opts.confirmationUrl, opts.recipient.locale);
}