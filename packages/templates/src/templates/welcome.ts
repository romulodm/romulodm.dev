import { wrapper, greetingRow, DEFAULT_ACCENT } from "../base";
import { getStrings } from "../i18n";
import { WelcomeTemplateOptions } from "../types";

export function welcomeTemplate(opts: WelcomeTemplateOptions): string {
  const accent = opts.brand.accentColor ?? DEFAULT_ACCENT;
  const s = getStrings(opts.recipient.locale);

  const listItems = s.welcomeItems
    .map(
      (text, i) => {
        const icons = ["📝", "💡", "🚀"];
        return `
        <tr>
          <td style="padding-bottom:12px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:28px;font-size:15px;vertical-align:top;padding-top:2px;">
                  ${icons[i]}
                </td>
                <td style="font-family:'Inter',sans-serif;color:#4a4440;
                           font-size:15px;line-height:1.5;">
                  ${text}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
      }
    )
    .join("");

  const body = `
  ${greetingRow(opts.recipient.displayName, opts.recipient.locale)}
  <tr>
    <td style="padding:20px 36px 8px;">
      <div style="background:linear-gradient(135deg,${accent} 0%,#ff9a6c 100%);
                  border-radius:10px;padding:24px 28px;margin-bottom:24px;">
        <h1 style="margin:0;font-family:'Inter',sans-serif;color:#ffffff;
                   font-size:22px;font-weight:700;letter-spacing:-0.4px;">
          ${s.welcomeHeading}
        </h1>
      </div>
      <p style="margin:0 0 20px;font-family:'Inter',sans-serif;
                color:#6b6460;font-size:15px;line-height:1.65;">
        ${s.welcomeBody}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${listItems}
      </table>
      <p style="margin:8px 0 0;font-family:'Inter',sans-serif;
                color:#6b6460;font-size:14px;line-height:1.6;">
        ${s.welcomeSignoff}
      </p>
    </td>
  </tr>`;

  return wrapper(body, opts.brand, opts.unsubscribeUrl, opts.recipient.locale);
}
