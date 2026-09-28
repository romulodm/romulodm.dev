// portfolio/src/app/[locale]/admin/newsletter/templates/page.tsx
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import {
    confirmationTemplate,
    welcomeTemplate,
    unsubscribeConfirmTemplate,
    passwordResetTemplate,
    campaignTemplate,
    digestTemplate,
    type BrandConfig,
    type RecipientContext,
} from "@romulo/templates";
import { InteractiveCustomPreviewCard } from "./InteractiveCustomPreviewCard";

// ─── Brand config ─────────────────────────────────────────────────────────────

const BRAND: BrandConfig = {
    name: process.env.NEXT_PUBLIC_APP_NAME ?? "romulodm",
    baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://romulodm.dev",
    accentColor: "#f57842",
};

// ─── Dummy recipient for preview ──────────────────────────────────────────────

const PREVIEW_RECIPIENT: RecipientContext = {
    displayName: "romulodm",
    locale: "pt",
};

// ─── Sample previews ──────────────────────────────────────────────────────────

function buildPreviews() {
    const base = BRAND.baseUrl;

    return [
        {
            id: "confirmation",
            label: "Confirmação de inscrição",
            description: "Enviado após o usuário preencher o formulário de newsletter.",
            html: confirmationTemplate({
                confirmationUrl: `${base}/newsletter/confirm?token=abc123`,
                brand: BRAND,
                recipient: PREVIEW_RECIPIENT,
            }),
            interactive: false,
        },
        {
            id: "welcome",
            label: "Boas-vindas",
            description: "Enviado após o usuário confirmar o e-mail.",
            html: welcomeTemplate({
                unsubscribeUrl: `${base}/newsletter/unsubscribe?token=abc123`,
                brand: BRAND,
                recipient: PREVIEW_RECIPIENT,
            }),
            interactive: false,
        },
        {
            id: "unsubscribe",
            label: "Confirmar cancelamento",
            description: "Enviado quando o usuário solicita o cancelamento.",
            html: unsubscribeConfirmTemplate({
                unsubscribeUrl: `${base}/newsletter/unsubscribe/confirm?token=abc123`,
                brand: BRAND,
                recipient: PREVIEW_RECIPIENT,
            }),
            interactive: false,
        },
        {
            id: "password-reset",
            label: "Recuperação de senha",
            description: "Enviado ao solicitar redefinição de senha.",
            html: passwordResetTemplate({
                code: "482917",
                expiresInMinutes: 15,
                brand: BRAND,
                recipient: PREVIEW_RECIPIENT,
            }),
            interactive: false,
        },
        {
            id: "campaign-post",
            label: "Newsletter — Post único",
            description: "Campanha baseada em artigo do blog, com imagem, tags e resumo.",
            html: campaignTemplate({
                subject: "Por que Todo Dev Deveria Aprender os Fundamentos de Redes",
                post: {
                    imageUrl: "https://romulodm.com.br/og/redes.png",
                    title: "Por que Todo Dev Deveria Aprender os Fundamentos de Redes",
                    summary:
                        "Você já passou horas depurando um bug que, no fim, era só um problema de CORS? Entender redes muda a forma como você programa.",
                    tags: ["redes", "typescript", "backend"],
                    url: `${base}/pt/blog/fundamentos-de-redes`,
                    ctaLabel: "Ler artigo completo",
                },
                unsubscribeUrl: `${base}/newsletter/unsubscribe?token=abc123`,
                brand: BRAND,
                recipient: PREVIEW_RECIPIENT,
            }),
            interactive: false,
        },
        {
            id: "campaign-digest",
            label: "Newsletter — Digest (múltiplos posts)",
            description: "Compilado semanal/quinzenal com vários artigos em um só e-mail.",
            html: digestTemplate({
                subject: "Novidades de maio — 3 artigos para você",
                posts: [
                    {
                        title: "Por que Todo Dev Deveria Aprender os Fundamentos de Redes",
                        summary: "Você já passou horas depurando um bug que, no fim, era só um problema de CORS?",
                        tags: ["redes", "backend"],
                        imageUrl: "https://romulodm.com.br/og/redes.png",
                        url: `${base}/pt/blog/fundamentos-de-redes`,
                    },
                    {
                        title: "TypeScript: Tipos Condicionais na Prática",
                        summary: "Como usar infer, extends e tipos condicionais para escrever código mais expressivo.",
                        tags: ["typescript"],
                        url: `${base}/pt/blog/typescript-tipos-condicionais`,
                    },
                    {
                        title: "Clean Architecture em Node.js sem Complicar",
                        summary: "Uma abordagem pragmática para separar responsabilidades sem criar burocracia desnecessária.",
                        tags: ["arquitetura", "nodejs"],
                        url: `${base}/pt/blog/clean-architecture-nodejs`,
                    },
                ],
                unsubscribeUrl: `${base}/newsletter/unsubscribe?token=abc123`,
                brand: BRAND,
                recipient: PREVIEW_RECIPIENT,
            }),
            interactive: false,
        },
        {
            id: "campaign-custom",
            label: "Newsletter — HTML personalizado",
            description: "Campanha com conteúdo HTML livre. Use o editor abaixo para visualizar o seu HTML em tempo real.",
            html: campaignTemplate({
                subject: "Novidades de Maio 🌱",
                content: `
          <h2 style="margin:0 0 12px;font-family:'Inter',sans-serif;color:#1a1412;font-size:20px;font-weight:700;">
            Novidades de Maio 🌱
          </h2>
          <p style="margin:0 0 14px;color:#6b6460;font-size:15px;line-height:1.65;">
            Este mês foi recheado de lançamentos, artigos e aprendizados. Aqui está um resumo:
          </p>
          <ul style="margin:0 0 14px;padding-left:20px;color:#6b6460;font-size:15px;line-height:1.9;">
            <li>Publiquei 3 novos artigos sobre TypeScript</li>
            <li>Lancei uma nova feature no portfólio</li>
            <li>Contribuí para dois projetos open-source</li>
          </ul>
          <p style="margin:0;color:#6b6460;font-size:15px;">Até o próximo mês!</p>
        `,
                unsubscribeUrl: `${base}/newsletter/unsubscribe?token=abc123`,
                brand: BRAND,
                recipient: PREVIEW_RECIPIENT,
            }),
            interactive: true, // ← habilita o editor ao vivo
        },
    ] as const;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EmailTemplatesPage() {
    const locale = await getLocale();
    if (!(await isAdminAuthenticated())) redirect(`/${locale}`);

    const previews = buildPreviews();

    return (
        <main className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Templates de E-mail</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Visualização de todos os templates transacionais e de newsletter.
                </p>
            </div>

            <div className="space-y-10">
                {previews.map((preview) =>
                    preview.interactive ? (
                        <InteractiveCustomPreviewCard key={preview.id} {...preview} />
                    ) : (
                        <TemplatePreviewCard key={preview.id} {...preview} />
                    ),
                )}
            </div>
        </main>
    );
}

// ─── Static preview card ──────────────────────────────────────────────────────

function TemplatePreviewCard({
    id,
    label,
    description,
    html,
}: {
    id: string;
    label: string;
    description: string;
    html: string;
}) {
    return (
        <section className="space-y-3">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold text-foreground">{label}</h2>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                    {id}
                </span>
            </div>

            <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-card border-b border-border">
                    <span className="w-3 h-3 rounded-full bg-red-400/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <span className="w-3 h-3 rounded-full bg-green-400/80" />
                    <span className="ml-3 text-xs text-muted-foreground font-mono">{label}</span>
                </div>
                <iframe
                    srcDoc={html}
                    title="Email preview"
                    className="w-full border-0"
                    style={{ height: "600px" }}
                    sandbox="allow-same-origin"
                    loading="lazy"
                />
            </div>
        </section>
    );
}