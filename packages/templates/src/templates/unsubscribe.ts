import { wrapper, DEFAULT_ACCENT } from "../base";
import { UnsubscribeConfirmTemplateOptions } from "../types";

export function unsubscribeConfirmTemplate(
  opts: UnsubscribeConfirmTemplateOptions
): string {
  const body = `
  <tr>
    <td style="padding:40px 40px 36px;">
      <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
        <tr>
          <td style="background-color:#fff5f5;border:1px solid #fecaca;
                     border-radius:10px;padding:10px 14px;font-size:22px;line-height:1;">
            👋
          </td>
        </tr>
      </table>

      <h1 style="margin:0 0 12px;font-family:'Georgia',serif;
                 color:#1a1412;font-size:24px;font-weight:700;line-height:1.25;
                 letter-spacing:-0.4px;">
        Confirme o cancelamento
      </h1>
      <p style="margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                color:#6b6460;font-size:16px;line-height:1.6;">
        Recebemos seu pedido para cancelar a inscrição na nossa newsletter.
        Se foi você, clique no botão abaixo para confirmar.
      </p>

      <!-- Danger CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding:4px 0 24px;">
            <a href="${opts.unsubscribeUrl}"
               style="display:inline-block;padding:14px 36px;
                      background-color:#dc2626;color:#ffffff;
                      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                      font-size:15px;font-weight:600;text-decoration:none;
                      border-radius:8px;letter-spacing:0.1px;">
              Confirmar cancelamento
            </a>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
             style="margin-top:8px;border-top:1px solid #f0ede8;">
        <tr>
          <td style="padding-top:20px;">
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                      color:#b8b0a8;font-size:12px;line-height:1.6;">
              Se você não fez essa solicitação, pode ignorar este e-mail com segurança
              — sua inscrição permanece ativa. Sentiremos sua falta! 😢
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

  return wrapper(body, opts.brand);
}
