import { BrandConfig } from "./types";
import { logoImg, EMAIL_LOGO_PATH } from "./logo";
import { getStrings } from "./i18n";

export const DEFAULT_ACCENT = "#f57842";

/**
 * Printed in the footer of every email. Bulk-mail rules (CAN-SPAM, and the
 * sender guidelines Gmail and Yahoo enforce) expect a physical address for
 * the sender; the brand config can override it.
 */
export const DEFAULT_POSTAL_ADDRESS = "Av. Itália, Carreiros · Rio Grande, RS · Brasil";

/**
 * The site only serves /pt and /en, while emails also render in "es". Map
 * anything that is not "pt" to "en" so links never land on a 404.
 */
function siteLocale(locale?: string | null): "pt" | "en" {
  return locale === "pt" ? "pt" : "en";
}

export function privacyPolicyUrl(brand: BrandConfig, locale?: string | null): string {
  return brand.privacyUrl ?? `${brand.baseUrl}/${siteLocale(locale)}/legal/privacy-policy`;
}

// ─── Wrapper ──────────────────────────────────────────────────────────────────

/**
 * @param unsubscribeUrl - Pass null for emails that do not come from the
 *   mailing list (subscription confirmation, password reset): the footer then
 *   omits the unsubscribe link instead of pointing it somewhere unrelated.
 */
export function wrapper(
  body: string,
  brand: BrandConfig,
  unsubscribeUrl: string | null,
  locale?: string | null,
): string {
  const logo = logoImg(brand.logoUrl ?? `${brand.baseUrl}${EMAIL_LOGO_PATH}`, brand.name, 28);
  const s = getStrings(locale);
  const year = new Date().getFullYear();
  const privacyUrl = privacyPolicyUrl(brand, locale);
  const postalAddress = brand.postalAddress ?? DEFAULT_POSTAL_ADDRESS;
  const unsubscribeLink = unsubscribeUrl
    ? `
              <span style="color:#d1cbc5;padding:0 6px;">|</span>
              <a href="${unsubscribeUrl}"
                 style="color:#b8b0a8;text-decoration:underline;">${s.unsubscribe}</a>`
    : "";

  return `<!DOCTYPE html>
<html lang="${locale ?? "en"}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  </style>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f0ede8;
             font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#f0ede8;padding:40px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:600px;width:100%;background:#ffffff;
                    border-radius:14px;border:1px solid #e4ded7;overflow:hidden;">

        <!-- ── Header: logo only ── -->
        <tr>
          <td style="padding:24px 36px;border-bottom:1px solid #f0ede8;">
            <a href="${brand.baseUrl}" style="text-decoration:none;display:inline-block;">
              ${logo}
            </a>
          </td>
        </tr>

        <!-- ── Body ── -->
        ${body}

        <!-- ── Footer ── -->
        <tr>
          <td style="background-color:#faf8f6;border-top:1px solid #ede9e4;
                     padding:24px 36px;text-align:center;">
            <p style="margin:0 0 8px;font-family:'Inter',sans-serif;
                      color:#9c9690;font-size:12px;line-height:1.6;">
              ${s.footerNote(brand.name)}
            </p>
            <p style="margin:0 0 12px;font-family:'Inter',sans-serif;
                      font-size:12px;line-height:1;">
              <a href="${privacyUrl}"
                 style="color:#b8b0a8;text-decoration:underline;">${s.privacyPolicy}</a>${unsubscribeLink}
            </p>
            <p style="margin:0 0 4px;font-family:'Inter',sans-serif;
                      color:#c4bdb6;font-size:11px;line-height:1.5;">
              ${postalAddress}
            </p>
            <p style="margin:0;font-family:'Inter',sans-serif;
                      color:#c4bdb6;font-size:11px;">
              ${s.copyright(year, brand.name)}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

// ─── Primitives ───────────────────────────────────────────────────────────────

export function greetingRow(displayName: string, locale?: string | null): string {
  const s = getStrings(locale);
  return `
  <tr>
    <td style="padding:32px 36px 25px;">
      <p style="margin:0;font-family:'Inter',sans-serif;
                font-size:22px;font-weight:700;color:#1a1412;line-height:1.3;">
        ${s.greeting(displayName)}
      </p>
    </td>
  </tr>`;
}

export function ctaButton(href: string, label: string, accentColor: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:28px 0 8px;">
        <a href="${href}"
           style="display:inline-block;padding:14px 36px;
                  background-color:${accentColor};color:#ffffff;
                  font-family:'Inter',sans-serif;font-size:15px;font-weight:600;
                  text-decoration:none;border-radius:8px;letter-spacing:0.1px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

export function urlFallback(href: string, label: string, accentColor: string): string {
  return `<p style="margin:8px 0 0;font-family:'Inter',sans-serif;
                    color:#b8b0a8;font-size:12px;line-height:1.5;word-break:break-all;">
    ${label} <a href="${href}" style="color:${accentColor};">${href}</a>
  </p>`;
}

export function divider(): string {
  return `<tr><td style="padding:0 36px;"><div style="height:1px;background:#f0ede8;"></div></td></tr>`;
}