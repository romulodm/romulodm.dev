// src/lib/email/templates.ts
//
// All HTML email templates — table-based for maximum client compatibility.
//

const BRAND_COLOR = "#22c55e"; // green-500

function getAppName() {
  return process.env.NEXT_PUBLIC_APP_NAME ?? "Your Blog";
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com";
}

function wrapper(body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${getAppName()}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
             style="background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:${BRAND_COLOR};padding:24px 40px;text-align:center;">
            <a href="${getBaseUrl()}" style="color:#ffffff;font-size:22px;font-weight:700;text-decoration:none;">${getAppName()}</a>
          </td>
        </tr>

        <!-- Body -->
        ${body}

        <!-- Footer -->
        <tr>
          <td style="background:#fafafa;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              © ${new Date().getFullYear()} ${getAppName()}. Todos os direitos reservados.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Templates ────────────────────────────────────────────────────────────────

export function confirmationTemplate(confirmationUrl: string): string {
  return wrapper(`
    <tr>
      <td style="padding:40px;">
        <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700;">
          Confirme sua inscrição 🎉
        </h2>
        <p style="margin:0 0 20px;color:#6b7280;font-size:16px;line-height:1.6;">
          Obrigado pelo interesse! Clique no botão abaixo para ativar sua inscrição e
          começar a receber nossos melhores artigos diretamente no seu e-mail.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="center" style="padding:24px 0;">
              <a href="${confirmationUrl}"
                 style="display:inline-block;padding:14px 32px;background:${BRAND_COLOR};
                        color:#ffffff;text-decoration:none;border-radius:6px;
                        font-size:16px;font-weight:600;">
                Confirmar inscrição
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;line-height:1.5;">
          Ou copie e cole este link no seu navegador:<br/>
          <a href="${confirmationUrl}" style="color:${BRAND_COLOR};word-break:break-all;">${confirmationUrl}</a>
        </p>
        <p style="margin:12px 0 0;color:#9ca3af;font-size:12px;">
          Este link expira em 24 horas. Se você não solicitou a inscrição, pode ignorar este e-mail.
        </p>
      </td>
    </tr>
  `);
}

export function welcomeTemplate(unsubscribeUrl: string): string {
  return wrapper(`
    <tr>
      <td style="padding:40px;">
        <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700;">
          Bem-vindo(a)! 🚀
        </h2>
        <p style="margin:0 0 20px;color:#6b7280;font-size:16px;line-height:1.6;">
          Sua inscrição foi confirmada com sucesso. A partir de agora você receberá:
        </p>
        <ul style="margin:0 0 24px;padding-left:20px;color:#6b7280;font-size:16px;line-height:2;">
          <li>Novos artigos assim que publicados</li>
          <li>Dicas e conteúdo exclusivo</li>
          <li>Novidades e projetos</li>
        </ul>
        <p style="margin:0;color:#6b7280;font-size:16px;line-height:1.6;">
          Obrigado por fazer parte da nossa comunidade!
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 32px;text-align:center;">
        <p style="margin:0;color:#d1d5db;font-size:11px;">
          <a href="${unsubscribeUrl}" style="color:#d1d5db;">Cancelar inscrição</a>
        </p>
      </td>
    </tr>
  `);
}

export function unsubscribeConfirmTemplate(unsubscribeUrl: string): string {
  return wrapper(`
    <tr>
      <td style="padding:40px;">
        <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700;">
          Confirme o cancelamento
        </h2>
        <p style="margin:0 0 20px;color:#6b7280;font-size:16px;line-height:1.6;">
          Recebemos seu pedido de cancelamento. Se foi você, clique no botão abaixo para confirmar.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="center" style="padding:24px 0;">
              <a href="${unsubscribeUrl}"
                 style="display:inline-block;padding:14px 32px;background:#dc2626;
                        color:#ffffff;text-decoration:none;border-radius:6px;
                        font-size:16px;font-weight:600;">
                Confirmar cancelamento
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0;color:#9ca3af;font-size:12px;">
          Se não foi você, pode ignorar este e-mail com segurança. Sentiremos sua falta! 😢
        </p>
      </td>
    </tr>
  `);
}

export function passwordResetTemplate(opts: {
  code: string;
  expiresInMinutes?: number;
}): string {
  const expires = opts.expiresInMinutes ?? 15;

  return wrapper(`
    <tr>
      <td style="padding:40px;">
        <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700;">
          Recuperação de senha 🔐
        </h2>
        <p style="margin:0 0 24px;color:#6b7280;font-size:16px;line-height:1.6;">
          Use o código abaixo para redefinir sua senha. Ele é válido por ${expires} minutos
          e pode ser usado apenas uma vez.
        </p>

        <!-- Code block -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="center" style="padding:8px 0 32px;">
              <div style="display:inline-block;padding:20px 40px;
                          background:#f4f4f5;border-radius:8px;
                          border:2px dashed #d1d5db;">
                <span style="font-size:36px;font-weight:800;
                             letter-spacing:10px;color:#111827;
                             font-family:'Courier New',Courier,monospace;">
                  ${opts.code}
                </span>
              </div>
            </td>
          </tr>
        </table>

        <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
          Se você não solicitou a recuperação de senha, ignore este e-mail. Sua conta
          permanece segura.
        </p>
      </td>
    </tr>
  `);
}

export function campaignTemplate(opts: {
  subject: string;
  content: string;
  unsubscribeUrl: string;
  trackingPixelUrl: string;
}): string {
  return wrapper(`
    <tr>
      <td style="padding:40px;color:#374151;font-size:16px;line-height:1.7;">
        ${opts.content}
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 24px;text-align:center;">
        <p style="margin:0;color:#d1d5db;font-size:11px;">
          Você está recebendo este e-mail porque se inscreveu em ${getAppName()}.<br/>
          <a href="${opts.unsubscribeUrl}" style="color:#d1d5db;">Cancelar inscrição</a>
        </p>
      </td>
    </tr>
    <!-- 1×1 tracking pixel -->
    <tr>
      <td style="padding:0;line-height:0;font-size:0;">
        <img src="${opts.trackingPixelUrl}" width="1" height="1" alt="" style="display:block;border:0;" />
      </td>
    </tr>
  `);
}