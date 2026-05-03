import { wrapper, DEFAULT_ACCENT } from "../base";
import { PasswordResetTemplateOptions } from "../types";

export function passwordResetTemplate(opts: PasswordResetTemplateOptions): string {
  const expires = opts.expiresInMinutes ?? 15;

  const body = `
  <tr>
    <td style="padding:40px 40px 36px;">
      <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
        <tr>
          <td style="background-color:#f5f3ff;border:1px solid #ddd6fe;
                     border-radius:10px;padding:10px 14px;font-size:22px;line-height:1;">
            🔐
          </td>
        </tr>
      </table>

      <h1 style="margin:0 0 12px;font-family:'Georgia',serif;
                 color:#1a1412;font-size:24px;font-weight:700;line-height:1.25;
                 letter-spacing:-0.4px;">
        Recuperação de senha
      </h1>
      <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                color:#6b6460;font-size:16px;line-height:1.6;">
        Use o código abaixo para redefinir sua senha.
        Ele é válido por <strong>${expires} minutos</strong> e pode ser usado apenas uma vez.
      </p>

      <!-- Code block -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding:0 0 28px;">
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="background-color:#faf8f6;border:2px dashed #e4ded7;
                           border-radius:10px;padding:24px 40px;text-align:center;">
                  <span style="font-family:'Courier New',Courier,monospace;
                               font-size:38px;font-weight:800;letter-spacing:12px;
                               color:#1a1412;">
                    ${opts.code}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
             style="border-top:1px solid #f0ede8;">
        <tr>
          <td style="padding-top:20px;">
            <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                      color:#b8b0a8;font-size:12px;line-height:1.6;">
              Se você não solicitou a recuperação de senha, ignore este e-mail.
              Sua conta permanece segura e nenhuma alteração foi feita.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

  return wrapper(body, opts.brand);
}
