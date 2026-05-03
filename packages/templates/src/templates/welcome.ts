import { wrapper, unsubscribeRow, DEFAULT_ACCENT } from "../base";
import { WelcomeTemplateOptions } from "../types";

export function welcomeTemplate(opts: WelcomeTemplateOptions): string {
  const accent = opts.brand.accentColor ?? DEFAULT_ACCENT;

  const items = [
    { emoji: "📝", text: "Novos artigos assim que publicados" },
    { emoji: "💡", text: "Dicas e conteúdo técnico exclusivo" },
    { emoji: "🚀", text: "Projetos e novidades em primeira mão" },
  ];

  const listItems = items
    .map(
      ({ emoji, text }) => `
      <tr>
        <td style="padding:0 0 14px;">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="width:32px;vertical-align:top;padding-top:1px;">
                <span style="font-size:16px;">${emoji}</span>
              </td>
              <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                         color:#4a4440;font-size:15px;line-height:1.5;">
                ${text}
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  const body = `
  <tr>
    <td style="padding:40px 40px 32px;">
      <!-- Accent stripe -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
             style="margin-bottom:32px;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,${accent} 0%,#ff9a6c 100%);
                     padding:28px 32px;">
            <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                      color:rgba(255,255,255,0.85);font-size:13px;font-weight:500;
                      text-transform:uppercase;letter-spacing:1px;">
              Inscrição confirmada
            </p>
            <h1 style="margin:0;font-family:'Georgia',serif;color:#ffffff;
                       font-size:26px;font-weight:700;letter-spacing:-0.4px;">
              Bem-vindo(a)! 🎉
            </h1>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                color:#6b6460;font-size:16px;line-height:1.6;">
        Sua inscrição foi confirmada. A partir de agora você receberá:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${listItems}
      </table>

      <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                color:#6b6460;font-size:15px;line-height:1.6;">
        Obrigado por fazer parte desta comunidade. Fique à vontade para responder
        este e-mail se tiver alguma dúvida ou sugestão.
      </p>
    </td>
  </tr>
  ${unsubscribeRow(opts.unsubscribeUrl)}`;

  return wrapper(body, opts.brand);
}
