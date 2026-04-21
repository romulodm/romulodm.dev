import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronRight, Code2, FileText, Plus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@romulo/database";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import { getIntlLocaleCode } from "@/lib/locales";

const STATUS_CLASSES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  SENT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default async function CampaignsListPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const locale = await getLocale();
  const localeCode = getIntlLocaleCode(locale);
  const t = await getTranslations({ locale, namespace: "admin.campaignsList" });
  const searchParams = await props.searchParams;

  if (!(await isAdminAuthenticated())) redirect(`/${locale}`);

  const formatNumber = (value: number) => new Intl.NumberFormat(localeCode).format(value);
  const formatDate = (value: Date) =>
    new Intl.DateTimeFormat(localeCode, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);

  const statusLabels: Record<string, string> = {
    DRAFT: t("status.draft"),
    SCHEDULED: t("status.scheduled"),
    SENDING: t("status.sending"),
    SENT: t("status.sent"),
    FAILED: t("status.failed"),
  };

  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;
  const skip = (page - 1) * limit;

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        subject: true,
        status: true,
        type: true,
        scheduledAt: true,
        sentAt: true,
        totalRecipients: true,
        sentCount: true,
        failedCount: true,
        openCount: true,
        createdAt: true,
        post: {
          select: {
            translations: {
              where: { locale: "pt" },
              select: { title: true },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.campaign.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <main className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin/newsletter`}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("total", { count: formatNumber(total) })}
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/admin/newsletter/campaigns/new`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t("newCampaign")}
        </Link>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t("columns.subject")}
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                {t("columns.type")}
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                {t("columns.status")}
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                {t("columns.sent")}
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                {t("columns.openRate")}
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                {t("columns.date")}
              </th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {campaigns.map((campaign: typeof campaigns[number]) => {
              const badgeLabel = statusLabels[campaign.status] ?? statusLabels.DRAFT;
              const badgeClass = STATUS_CLASSES[campaign.status] ?? STATUS_CLASSES.DRAFT;
              const openRate = campaign.sentCount > 0
                ? `${((campaign.openCount / campaign.sentCount) * 100).toFixed(1)}%`
                : "—";
              const date = campaign.sentAt ?? campaign.scheduledAt ?? campaign.createdAt;

              return (
                <tr key={campaign.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <Link
                      href={`/${locale}/admin/newsletter/campaigns/${campaign.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {campaign.subject}
                    </Link>
                    {campaign.type === "POST_BASED" && campaign.post && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {campaign.post.translations[0]?.title ?? t("unavailableTitle")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      {campaign.type === "POST_BASED" ? (
                        <>
                          <FileText className="w-3 h-3" />
                          {t("type.post")}
                        </>
                      ) : (
                        <>
                          <Code2 className="w-3 h-3" />
                          {t("type.html")}
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
                      {badgeLabel}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-muted-foreground font-medium hidden md:table-cell">
                    {formatNumber(campaign.sentCount)}
                  </td>
                  <td className="px-4 py-4 text-right text-muted-foreground font-medium hidden md:table-cell">
                    {openRate}
                  </td>
                  <td className="px-4 py-4 text-right text-muted-foreground hidden lg:table-cell">
                    {formatDate(new Date(date))}
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/${locale}/admin/newsletter/campaigns/${campaign.id}`}>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {campaigns.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">
            {t("empty")}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}`}
              className="px-3 py-1.5 text-sm bg-card border border-border rounded-lg hover:bg-muted text-foreground transition-colors"
            >
              {t("previous")}
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            {t("page", {
              page: formatNumber(page),
              totalPages: formatNumber(totalPages),
            })}
          </span>
          {page < totalPages && (
            <Link
              href={`?page=${page + 1}`}
              className="px-3 py-1.5 text-sm bg-card border border-border rounded-lg hover:bg-muted text-foreground transition-colors"
            >
              {t("next")}
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
