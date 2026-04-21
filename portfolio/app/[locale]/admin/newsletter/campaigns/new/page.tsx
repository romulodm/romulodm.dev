import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@romulo/database";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import CampaignForm from "../CampaignForm";

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
      translations: {
        where: { locale: "pt" },
        select: { title: true, summary: true },
        take: 1,
      },
    },
  });

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
            publishedPosts={publishedPosts.map((post: typeof publishedPosts[number]) => ({
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
