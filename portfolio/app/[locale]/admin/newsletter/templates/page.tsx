// portfolio/src/app/[locale]/admin/newsletter/templates/page.tsx
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
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

function previewRecipient(locale: string): RecipientContext {
    return { displayName: "romulodm", locale: locale as RecipientContext["locale"] };
}

// ─── Sample previews ──────────────────────────────────────────────────────────

// Minimal signature satisfied by the `t` returned from getTranslations.
type Translator = (key: string) => string;

function buildPreviews(t: Translator, locale: string) {
    const base = BRAND.baseUrl;
    const PREVIEW_RECIPIENT = previewRecipient(locale);
    const networksPost = {
        title: t("samples.networks.title"),
        summary: t("samples.networks.summary"),
        summaryShort: t("samples.networks.summaryShort"),
    };

    return [
        {
            id: "confirmation",
            label: t("items.confirmation.label"),
            description: t("items.confirmation.description"),
            html: confirmationTemplate({
                confirmationUrl: `${base}/newsletter/confirm?token=abc123`,
                brand: BRAND,
                recipient: PREVIEW_RECIPIENT,
            }),
            interactive: false,
        },
        {
            id: "welcome",
            label: t("items.welcome.label"),
            description: t("items.welcome.description"),
            html: welcomeTemplate({
                unsubscribeUrl: `${base}/newsletter/unsubscribe?token=abc123`,
                brand: BRAND,
                recipient: PREVIEW_RECIPIENT,
            }),
            interactive: false,
        },
        {
            id: "unsubscribe",
            label: t("items.unsubscribe.label"),
            description: t("items.unsubscribe.description"),
            html: unsubscribeConfirmTemplate({
                unsubscribeUrl: `${base}/newsletter/unsubscribe/confirm?token=abc123`,
                brand: BRAND,
                recipient: PREVIEW_RECIPIENT,
            }),
            interactive: false,
        },
        {
            id: "password-reset",
            label: t("items.passwordReset.label"),
            description: t("items.passwordReset.description"),
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
            label: t("items.campaignPost.label"),
            description: t("items.campaignPost.description"),
            html: campaignTemplate({
                subject: networksPost.title,
                post: {
                    imageUrl: "https://romulodm.com.br/og/redes.png",
                    title: networksPost.title,
                    summary: networksPost.summary,
                    tags: ["redes", "typescript", "backend"],
                    url: `${base}/${locale}/blog/fundamentos-de-redes`,
                    ctaLabel: t("samples.readMore"),
                },
                unsubscribeUrl: `${base}/newsletter/unsubscribe?token=abc123`,
                brand: BRAND,
                recipient: PREVIEW_RECIPIENT,
            }),
            interactive: false,
        },
        {
            id: "campaign-digest",
            label: t("items.campaignDigest.label"),
            description: t("items.campaignDigest.description"),
            html: digestTemplate({
                subject: t("samples.digestSubject"),
                posts: [
                    {
                        title: networksPost.title,
                        summary: networksPost.summaryShort,
                        tags: ["redes", "backend"],
                        imageUrl: "https://romulodm.com.br/og/redes.png",
                        url: `${base}/${locale}/blog/fundamentos-de-redes`,
                    },
                    {
                        title: t("samples.typescript.title"),
                        summary: t("samples.typescript.summary"),
                        tags: ["typescript"],
                        url: `${base}/${locale}/blog/typescript-tipos-condicionais`,
                    },
                    {
                        title: t("samples.cleanArchitecture.title"),
                        summary: t("samples.cleanArchitecture.summary"),
                        tags: ["arquitetura", "nodejs"],
                        url: `${base}/${locale}/blog/clean-architecture-nodejs`,
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
            label: t("items.campaignCustom.label"),
            description: t("items.campaignCustom.description"),
            html: campaignTemplate({
                subject: t("samples.custom.title"),
                content: `
          <h2 style="margin:0 0 12px;font-family:'Inter',sans-serif;color:#1a1412;font-size:20px;font-weight:700;">
            ${t("samples.custom.title")}
          </h2>
          <p style="margin:0 0 14px;color:#6b6460;font-size:15px;line-height:1.65;">
            ${t("samples.custom.intro")}
          </p>
          <ul style="margin:0 0 14px;padding-left:20px;color:#6b6460;font-size:15px;line-height:1.9;">
            <li>${t("samples.custom.item1")}</li>
            <li>${t("samples.custom.item2")}</li>
            <li>${t("samples.custom.item3")}</li>
          </ul>
          <p style="margin:0;color:#6b6460;font-size:15px;">${t("samples.custom.outro")}</p>
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

    const t = await getTranslations("admin.emailTemplates");
    const previews = buildPreviews(t, locale);

    return (
        <main className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {t("subtitle")}
                </p>
            </div>

            <div className="space-y-10">
                {previews.map((preview) =>
                    preview.interactive ? (
                        <InteractiveCustomPreviewCard key={preview.id} {...preview} />
                    ) : (
                        <TemplatePreviewCard key={preview.id} {...preview} iframeTitle={t("iframeTitle")} />
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
    iframeTitle,
}: {
    id: string;
    label: string;
    description: string;
    html: string;
    iframeTitle: string;
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
                    title={iframeTitle}
                    className="w-full border-0"
                    style={{ height: "600px" }}
                    sandbox="allow-same-origin"
                    loading="lazy"
                />
            </div>
        </section>
    );
}