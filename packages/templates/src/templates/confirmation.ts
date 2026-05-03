import { wrapper, ctaButton, urlFallback, DEFAULT_ACCENT } from "../base";
import { ConfirmationTemplateOptions } from "../types";

export function confirmationTemplate(opts: ConfirmationTemplateOptions): string {
  const accent = opts.brand.accentColor ?? DEFAULT_ACCENT;

  const body = `
  <tr>
    <td style="padding:40px 40px 32px;">
      <!-- Icon badge -->
      <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
        <tr>
          <td style="background-color:#fff8f5;border:1px solid #fde8dc;
                     border-radius:10px;padding:10px 14px;
                     font-size:22px;line-height:1;">
            ✉️
          </td>
        </tr>
      </table>

      <h1 style="margin:0 0 12px;font-family:'Georgia',serif;
                 color:#1a1412;font-size:24px;font-weight:700;line-height:1.25;
                 letter-spacing:-0.4px;">
        Confirme sua inscrição
      </h1>
      <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                color:#6b6460;font-size:16px;line-height:1.6;">
        Obrigado pelo interesse! Clique abaixo para ativar sua inscrição e
        começar a receber os melhores artigos diretamente no seu e-mail.
      </p>

      ${ctaButton(opts.confirmationUrl, "Confirmar inscrição", accent)}
      ${urlFallback(opts.confirmationUrl, accent)}

      <!-- Expiry notice -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
             style="margin-top:28px;border-top:1px solid #f0ede8;">
        <tr>
          <td style="padding-top:20px;">
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                      color:#b8b0a8;font-size:12px;line-height:1.6;">
              🔒 Este link expira em <strong>24 horas</strong>. Se você não solicitou a inscrição,
              pode ignorar este e-mail com segurança — nenhuma ação será tomada.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

  return wrapper(body, opts.brand);
}
