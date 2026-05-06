import { wrapper, greetingRow } from "../base";
import { getStrings } from "../i18n";
import { UnsubscribeConfirmTemplateOptions } from "../types";

export function unsubscribeConfirmTemplate(
  opts: UnsubscribeConfirmTemplateOptions,
): string {
  const s = getStrings(opts.recipient.locale);

  const body = `
  ${greetingRow(opts.recipient.displayName, opts.recipient.locale)}
  <tr>
    <td style="padding:16px 36px 36px;">
      <h1 style="margin:0 0 10px;font-family:'Inter',sans-serif;
                 color:#1a1412;font-size:20px;font-weight:600;line-height:1.3;
                 letter-spacing:-0.3px;">
        ${s.unsubscribeHeading}
      </h1>
      <p style="margin:0 0 24px;font-family:'Inter',sans-serif;
                color:#6b6460;font-size:15px;line-height:1.65;">
        ${s.unsubscribeBody}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:4px 0 20px;">
            <a href="${opts.unsubscribeUrl}"
               style="display:inline-block;padding:14px 36px;background:#dc2626;
                      color:#ffffff;font-family:'Inter',sans-serif;font-size:15px;
                      font-weight:600;text-decoration:none;border-radius:8px;">
              ${s.unsubscribeCta}
            </a>
          </td>
        </tr>
      </table>
      <div style="padding-top:18px;border-top:1px solid #f0ede8;">
        <p style="margin:0;font-family:'Inter',sans-serif;
                  color:#b8b0a8;font-size:12px;line-height:1.6;">
          ${s.unsubscribeIgnore}
        </p>
      </div>
    </td>
  </tr>`;

  return wrapper(body, opts.brand, opts.unsubscribeUrl, opts.recipient.locale);
}