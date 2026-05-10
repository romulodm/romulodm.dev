import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@romulo/database";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import CampaignForm from "./CampaignForm";
import {
  campaignTemplate,
  type BrandConfig,
} from "@romulo/templates";

// ── Brand config (mirrors the worker / email service) ─────────────────────────

const BRAND: BrandConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "romulodm",
  baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://romulodm.com.br",
  accentColor: "#f57842",
  privacyUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://romulodm.com.br"}/privacy`,
};

// ── Dummy recipient used for preview only ─────────────────────────────────────

const PREVIEW_RECIPIENT = {
  displayName: "you",
  locale: "en" as const,
};

export default async function NewCampaignPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "admin.newCampaignPage" });

  if (!(await isAdminAuthenticated())) redirect(`/${locale}`);

  const publishedPosts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      publishedAt: true,
      coverImageUrl: true,
      postTags: { select: { tag: true } },
      translations: {
        where: { locale: "pt" },
        select: { title: true, summary: true },
        take: 1,
      },
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://romulodm.com.br";

  // Pre-render one full email HTML per post so the client can display it
  // without needing to call the server again on select.
  const previewHtmlMap: Record<string, string> = {};
  for (const post of publishedPosts) {
    const title = post.translations[0]?.title ?? "";
    const summary = post.translations[0]?.summary ?? undefined;
    const tags = post.postTags.map((t) => t.tag);

    previewHtmlMap[post.id] = campaignTemplate({
      subject: title,
      post: {
        imageUrl: post.coverImageUrl ?? undefined,
        title,
        summary,
        tags,
        url: `${baseUrl}/${locale}/blog/${post.slug}`,
      },
      unsubscribeUrl: `${baseUrl}/newsletter/unsubscribe?token=preview`,
      brand: BRAND,
      recipient: PREVIEW_RECIPIENT,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={`/${locale}/admin/newsletter/campaigns`}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t("title")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              {t("description")}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm p-8">
          <CampaignForm
            mode="create"
            previewHtmlMap={previewHtmlMap}
            publishedPosts={publishedPosts.map((post) => ({
              id: post.id,
              slug: post.slug,
              publishedAt: post.publishedAt?.toISOString() ?? null,
              title: post.translations[0]?.title ?? "",
              summary: post.translations[0]?.summary ?? null,
            }))}
          />
        </div>
      </main>
    </div>
  );
}
