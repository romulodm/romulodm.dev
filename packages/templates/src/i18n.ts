// ─── Supported locales ───────────────────────────────────────────────────────

export type EmailLocale = "en" | "pt" | "es";

export const SUPPORTED_LOCALES: EmailLocale[] = ["en", "pt", "es"];

export function resolveLocale(raw?: string | null): EmailLocale {
  if (raw === "pt" || raw === "es") return raw;
  return "en";
}

// ─── String bag ───────────────────────────────────────────────────────────────

export interface EmailStrings {
  // Shared
  greeting: (name: string) => string;
  privacyPolicy: string;
  unsubscribe: string;
  footerNote: (brandName: string) => string;
  copyright: (year: number, brandName: string) => string;

  // Confirmation
  confirmationHeading: string;
  confirmationBody: string;
  confirmationCta: string;
  confirmationExpiry: string;
  confirmationIgnore: string;
  confirmationUrlFallback: string;

  // Welcome
  welcomeHeading: string;
  welcomeBody: string;
  welcomeItems: [string, string, string];
  welcomeSignoff: string;

  // Unsubscribe confirm
  unsubscribeHeading: string;
  unsubscribeBody: string;
  unsubscribeCta: string;
  unsubscribeIgnore: string;

  // Password reset
  passwordResetHeading: string;
  passwordResetBody: (minutes: number) => string;
  passwordResetIgnore: string;

  // Campaign
  newPostLabel: string;
  readArticle: string;
  campaignReceivedBecause: (brandName: string) => string;
}

// ─── EN ───────────────────────────────────────────────────────────────────────

const en: EmailStrings = {
  greeting: (name) => `Hi, ${name} 👋`,
  privacyPolicy: "Privacy Policy",
  unsubscribe: "Unsubscribe",
  footerNote: (brand) =>
    `You're receiving this because you subscribed to ${brand}.`,
  copyright: (year, brand) => `© ${year} ${brand}. All rights reserved.`,

  confirmationHeading: "Confirm your subscription",
  confirmationBody:
    "Thanks for your interest! Click below to activate your subscription and start receiving the best articles straight to your inbox.",
  confirmationCta: "Confirm subscription",
  confirmationExpiry: "This link expires in <strong>24 hours</strong>.",
  confirmationIgnore:
    "If you didn't request this, you can safely ignore this email — no action will be taken.",
  confirmationUrlFallback: "Or paste this link in your browser:",

  welcomeHeading: "You're in! 🎉",
  welcomeBody: "Your subscription is confirmed. You'll now receive:",
  welcomeItems: [
    "New articles as soon as they're published",
    "Exclusive tips and technical content",
    "Projects and updates, first",
  ],
  welcomeSignoff: "Thanks for being part of this community!",

  unsubscribeHeading: "Confirm unsubscribe",
  unsubscribeBody:
    "We received your request to unsubscribe. If that was you, click below to confirm.",
  unsubscribeCta: "Confirm unsubscribe",
  unsubscribeIgnore:
    "If it wasn't you, ignore this email safely — your subscription stays active. We'll miss you! 😢",

  passwordResetHeading: "Password recovery",
  passwordResetBody: (min) =>
    `Use the code below to reset your password. It's valid for <strong>${min} minutes</strong> and can only be used once.`,
  passwordResetIgnore:
    "If you didn't request a password reset, ignore this email. Your account remains secure.",

  newPostLabel: "New post 🚀",
  readArticle: "Read full article",
  campaignReceivedBecause: (brand) =>
    `You're receiving this because you subscribed to ${brand}.`,
};

// ─── PT ───────────────────────────────────────────────────────────────────────

const pt: EmailStrings = {
  greeting: (name) => `Olá, ${name} 👋`,
  privacyPolicy: "Política de Privacidade",
  unsubscribe: "Cancelar inscrição",
  footerNote: (brand) =>
    `Você está recebendo porque se inscreveu em ${brand}.`,
  copyright: (year, brand) => `© ${year} ${brand}. Todos os direitos reservados.`,

  confirmationHeading: "Confirme sua inscrição",
  confirmationBody:
    "Obrigado pelo interesse! Clique abaixo para ativar sua inscrição e começar a receber os melhores artigos diretamente no seu e-mail.",
  confirmationCta: "Confirmar inscrição",
  confirmationExpiry: "Este link expira em <strong>24 horas</strong>.",
  confirmationIgnore:
    "Se você não solicitou a inscrição, pode ignorar este e-mail — nenhuma ação será tomada.",
  confirmationUrlFallback: "Ou cole este link no seu navegador:",

  welcomeHeading: "Bem-vindo(a)! 🎉",
  welcomeBody: "Sua inscrição foi confirmada. A partir de agora você receberá:",
  welcomeItems: [
    "Novos artigos assim que publicados",
    "Dicas e conteúdo técnico exclusivo",
    "Projetos e novidades em primeira mão",
  ],
  welcomeSignoff: "Obrigado por fazer parte desta comunidade!",

  unsubscribeHeading: "Confirme o cancelamento",
  unsubscribeBody:
    "Recebemos seu pedido para cancelar a inscrição. Se foi você, clique abaixo para confirmar.",
  unsubscribeCta: "Confirmar cancelamento",
  unsubscribeIgnore:
    "Se não foi você, ignore este e-mail. Sua inscrição permanece ativa. Sentiremos sua falta! 😢",

  passwordResetHeading: "Recuperação de senha",
  passwordResetBody: (min) =>
    `Use o código abaixo para redefinir sua senha. Ele é válido por <strong>${min} minutos</strong> e pode ser usado apenas uma vez.`,
  passwordResetIgnore:
    "Se você não solicitou a recuperação, ignore este e-mail. Sua conta permanece segura.",

  newPostLabel: "Nova postagem 🚀",
  readArticle: "Ler artigo completo",
  campaignReceivedBecause: (brand) =>
    `Você está recebendo porque se inscreveu em ${brand}.`,
};

// ─── ES ───────────────────────────────────────────────────────────────────────

const es: EmailStrings = {
  greeting: (name) => `Hola, ${name} 👋`,
  privacyPolicy: "Política de privacidad",
  unsubscribe: "Cancelar suscripción",
  footerNote: (brand) =>
    `Recibes esto porque te suscribiste a ${brand}.`,
  copyright: (year, brand) => `© ${year} ${brand}. Todos los derechos reservados.`,

  confirmationHeading: "Confirma tu suscripción",
  confirmationBody:
    "¡Gracias por tu interés! Haz clic abajo para activar tu suscripción y empezar a recibir los mejores artículos en tu correo.",
  confirmationCta: "Confirmar suscripción",
  confirmationExpiry: "Este enlace expira en <strong>24 horas</strong>.",
  confirmationIgnore:
    "Si no solicitaste esto, puedes ignorar este correo — no se tomará ninguna acción.",
  confirmationUrlFallback: "O pega este enlace en tu navegador:",

  welcomeHeading: "¡Ya estás dentro! 🎉",
  welcomeBody: "Tu suscripción fue confirmada. A partir de ahora recibirás:",
  welcomeItems: [
    "Nuevos artículos en cuanto se publiquen",
    "Consejos y contenido técnico exclusivo",
    "Proyectos y novedades, los primeros",
  ],
  welcomeSignoff: "¡Gracias por ser parte de esta comunidad!",

  unsubscribeHeading: "Confirma la cancelación",
  unsubscribeBody:
    "Recibimos tu solicitud de cancelación. Si fuiste tú, haz clic abajo para confirmar.",
  unsubscribeCta: "Confirmar cancelación",
  unsubscribeIgnore:
    "Si no fuiste tú, ignora este correo. Tu suscripción sigue activa. ¡Te echaremos de menos! 😢",

  passwordResetHeading: "Recuperación de contraseña",
  passwordResetBody: (min) =>
    `Usa el código de abajo para restablecer tu contraseña. Es válido por <strong>${min} minutos</strong> y solo puede usarse una vez.`,
  passwordResetIgnore:
    "Si no solicitaste esto, ignora este correo. Tu cuenta está segura.",

  newPostLabel: "Nueva publicación 🚀",
  readArticle: "Leer artículo completo",
  campaignReceivedBecause: (brand) =>
    `Recibes esto porque te suscribiste a ${brand}.`,
};

// ─── Lookup ───────────────────────────────────────────────────────────────────

export const strings: Record<EmailLocale, EmailStrings> = { en, pt, es };

export function getStrings(locale?: string | null): EmailStrings {
  return strings[resolveLocale(locale)];
}