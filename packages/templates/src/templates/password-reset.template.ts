import { wrapper, greetingRow } from "../base";
import { getStrings } from "../i18n";
import { PasswordResetTemplateOptions } from "../types";

export function passwordResetTemplate(opts: PasswordResetTemplateOptions): string {
  const expires = opts.expiresInMinutes ?? 15;
  const s = getStrings(opts.recipient.locale);
  const privacyUrl = opts.brand.privacyUrl ?? `${opts.brand.baseUrl}/privacy`;

  const body = `
  ${greetingRow(opts.recipient.displayName, opts.recipient.locale)}
  <tr>
    <td style="padding:16px 36px 36px;">
      <h1 style="margin:0 0 10px;font-family:'Inter',sans-serif;
                 color:#1a1412;font-size:20px;font-weight:600;line-height:1.3;
                 letter-spacing:-0.3px;">
        ${s.passwordResetHeading}
      </h1>
      <p style="margin:0 0 24px;font-family:'Inter',sans-serif;
                color:#6b6460;font-size:15px;line-height:1.65;">
        ${s.passwordResetBody(expires)}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:0 0 24px;">
            <div style="display:inline-block;background:#faf8f6;
                        border:2px dashed #e4ded7;border-radius:10px;
                        padding:22px 40px;text-align:center;">
              <span style="font-family:'Courier New',Courier,monospace;
                           font-size:36px;font-weight:800;letter-spacing:12px;
                           color:#1a1412;">
                ${opts.code}
              </span>
            </div>
          </td>
        </tr>
      </table>
      <div style="padding-top:18px;border-top:1px solid #f0ede8;">
        <p style="margin:0;font-family:'Inter',sans-serif;
                  color:#b8b0a8;font-size:12px;line-height:1.6;">
          ${s.passwordResetIgnore}
        </p>
      </div>
    </td>
  </tr>`;

  return wrapper(body, opts.brand, privacyUrl, opts.recipient.locale);
}