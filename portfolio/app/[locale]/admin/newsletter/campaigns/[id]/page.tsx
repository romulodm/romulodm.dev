import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Code2,
  FileText,
  MailOpen,
  Send,
  TrendingUp,
  Users,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@romulo/database";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import { getIntlLocaleCode } from "@/lib/locales";
import CampaignForm from "../new/CampaignForm";
import DeleteCampaignButton from "./DeleteCampaignButton";

const STATUS_CLASSES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  SENT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default async function CampaignDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const localeCode = getIntlLocaleCode(locale);
  const t = await getTranslations({ locale, namespace: "admin.campaignDetail" });
  const params = await props.params;

  if (!(await isAdminAuthenticated())) redirect(`/${locale}`);

  const formatNumber = (value: number) => new Intl.NumberFormat(localeCode).format(value);
  const formatDateTime = (value: Date) =>
    new Intl.DateTimeFormat(localeCode, {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(value);

  const statusLabels: Record<string, string> = {
    DRAFT: t("status.draft"),
    SCHEDULED: t("status.scheduled"),
    SENDING: t("status.sending"),
    SENT: t("status.sent"),
    FAILED: t("status.failed"),
  };

  const [campaign, deliveryBreakdown, publishedPosts] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        post: {
          select: {
            slug: true,
            translations: {
              where: { locale: "pt" },
              select: { title: true },
              take: 1,
            },
          },
        },
        campaignPosts: {
          orderBy: { order: "asc" },
          select: { postId: true },
        },
      },
    }),
    prisma.campaignRecipient.groupBy({
      by: ["status"],
      where: { campaignId: params.id },
      _count: { status: true },
    }),
    prisma.post.findMany({
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
    }),
  ]);

  if (!campaign) notFound();

  const badgeLabel = statusLabels[campaign.status] ?? statusLabels.DRAFT;
  const badgeClass = STATUS_CLASSES[campaign.status] ?? STATUS_CLASSES.DRAFT;
  const openRate = campaign.sentCount > 0
    ? ((campaign.openCount / campaign.sentCount) * 100).toFixed(1)
    : "0.0";

  const deliveryMap = Object.fromEntries(
    deliveryBreakdown.map((item: { status: string; _count: { status: number } }) => [
      item.status,
      item._count.status,
    ]),
  );

  const isDraft = campaign.status === "DRAFT";
  const isSent = campaign.status === "SENT";

  return (
    <main className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin/newsletter/campaigns`}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground line-clamp-1">
                {campaign.subject}
              </h1>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
                {badgeLabel}
              </span>
              <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
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
            </div>
            <p className="text-muted-foreground text-xs mt-1">
              {t("createdAt", { date: formatDateTime(new Date(campaign.createdAt)) })}
            </p>
            {campaign.post && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {t("linkedPost")}{" "}
                <a
                  href={`/${locale}/blog/${campaign.post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80"
                >
                  {campaign.post.translations[0]?.title ?? t("unavailableTitle")}
                </a>
              </p>
            )}
          </div>
        </div>

        {campaign.status !== "SENDING" && (
          <DeleteCampaignButton campaignId={params.id} />
        )}
      </div>

      {(isSent || campaign.status === "SENDING") && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: t("stats.total"),
              value: formatNumber(campaign.totalRecipients),
              icon: Users,
              color: "text-muted-foreground",
              bg: "bg-muted",
            },
            {
              label: t("stats.sent"),
              value: formatNumber(campaign.sentCount),
              icon: Send,
              color: "text-green-600 dark:text-green-400",
              bg: "bg-green-50 dark:bg-green-900/30",
            },
            {
              label: t("stats.opens"),
              value: formatNumber(campaign.openCount),
              icon: MailOpen,
              color: "text-blue-600 dark:text-blue-400",
              bg: "bg-blue-50 dark:bg-blue-900/30",
            },
            {
              label: t("stats.openRate"),
              value: `${openRate}%`,
              icon: TrendingUp,
              color: "text-violet-600 dark:text-violet-400",
              bg: "bg-violet-50 dark:bg-violet-900/30",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-xl border border-border shadow-sm p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {isSent && campaign.totalRecipients > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            {t("delivery.title")}
          </h3>
          <div className="flex h-3 rounded-full overflow-hidden bg-muted mb-3">
            {deliveryMap.SENT && (
              <div
                className="bg-green-500 h-full transition-all"
                style={{ width: `${(deliveryMap.SENT / campaign.totalRecipients) * 100}%` }}
              />
            )}
            {deliveryMap.FAILED && (
              <div
                className="bg-red-400 h-full transition-all"
                style={{ width: `${(deliveryMap.FAILED / campaign.totalRecipients) * 100}%` }}
              />
            )}
            {deliveryMap.PENDING && (
              <div
                className="bg-yellow-300 h-full transition-all"
                style={{ width: `${(deliveryMap.PENDING / campaign.totalRecipients) * 100}%` }}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {Object.entries(deliveryMap).map(([status, count]) => (
              <span key={status}>
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-1 ${status === "SENT"
                    ? "bg-green-500"
                    : status === "FAILED"
                      ? "bg-red-400"
                      : "bg-yellow-300"
                    }`}
                />
                {status === "SENT"
                  ? t("delivery.delivered")
                  : status === "FAILED"
                    ? t("delivery.failed")
                    : t("delivery.pending")}
                : <strong>{formatNumber(Number(count))}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {isDraft && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-8">
          <h2 className="text-lg font-semibold text-foreground mb-6">
            {t("editTitle")}
          </h2>
          <CampaignForm
            mode="edit"
            campaign={{
              id: campaign.id,
              type: campaign.type as "POST_BASED" | "CUSTOM" | "DIGEST",
              subject: campaign.subject,
              previewText: campaign.previewText ?? undefined,
              content: campaign.content,
              postId: campaign.postId,
              postIds: campaign.campaignPosts.map((cp) => cp.postId),
              translations: campaign.translations,
            }}
            publishedPosts={publishedPosts.map((post: typeof publishedPosts[number]) => ({
              id: post.id,
              slug: post.slug,
              publishedAt: post.publishedAt?.toISOString() ?? null,
              title: post.translations[0]?.title ?? "",
              summary: post.translations[0]?.summary ?? null,
            }))}
          />
        </div>
      )}

      {!isDraft && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-8">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            {t("sentContent")}
          </h3>
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: campaign.content }}
          />
        </div>
      )}
    </main>
  );
}
