import { BrandConfig } from "./types";
import { logoImg } from "./logo";

const DEFAULT_ACCENT = "#f57842";

/** Build the full email HTML document around a body block. */
export function wrapper(body: string, brand: BrandConfig): string {
  const accent = brand.accentColor ?? DEFAULT_ACCENT;
  const logo = logoImg(accent, 26);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f0ede8;font-family:'Georgia',serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#f0ede8;padding:40px 16px;">
    <tr><td align="center">

      <!-- Outer card -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:600px;width:100%;background:#ffffff;
                    border-radius:12px;
                    border:1px solid #e4ded7;
                    overflow:hidden;">

        <!-- ── Header ── -->
        <tr>
          <td style="padding:24px 40px;border-bottom:1px solid #f0ede8;">
            <a href="${brand.baseUrl}"
               style="text-decoration:none;display:inline-flex;align-items:center;gap:10px;">
              ${logo}
              <span style="font-family:'Georgia',serif;font-size:17px;font-weight:700;
                           color:#1a1412;letter-spacing:-0.3px;">${brand.name}</span>
            </a>
          </td>
        </tr>

        <!-- ── Body ── -->
        ${body}

        <!-- ── Footer ── -->
        <tr>
          <td style="background-color:#faf8f6;border-top:1px solid #ede9e4;
                     padding:20px 40px;text-align:center;">
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                      color:#b8b0a8;font-size:12px;line-height:1.5;">
              © ${new Date().getFullYear()} ${brand.name}. Todos os direitos reservados.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

/** Reusable accent CTA button */
export function ctaButton(href: string, label: string, accentColor: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:28px 0 8px;">
        <a href="${href}"
           style="display:inline-block;padding:14px 36px;
                  background-color:${accentColor};
                  color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                  font-size:15px;font-weight:600;text-decoration:none;
                  border-radius:8px;letter-spacing:0.1px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

/** Subtle text link fallback below a CTA */
export function urlFallback(href: string, accentColor: string): string {
  return `<p style="margin:12px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                    color:#b8b0a8;font-size:12px;line-height:1.5;word-break:break-all;">
    Ou cole no navegador: <a href="${href}" style="color:${accentColor};">${href}</a>
  </p>`;
}

/** Unsubscribe footer row */
export function unsubscribeRow(unsubscribeUrl: string): string {
  return `
  <tr>
    <td style="padding:0 40px 28px;text-align:center;">
      <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                color:#c8c0b8;font-size:11px;">
        <a href="${unsubscribeUrl}" style="color:#c8c0b8;text-decoration:underline;">
          Cancelar inscrição
        </a>
      </p>
    </td>
  </tr>`;
}

export { DEFAULT_ACCENT };
