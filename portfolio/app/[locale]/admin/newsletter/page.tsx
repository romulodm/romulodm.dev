import Link from 'next/link';
import { prisma } from '@romulo/database';
import { ChevronRight, Clock, Code2, FileText, MailCheck, Plus, Send, TrendingUp, UserMinus, Users } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { isAdminAuthenticated } from '@/lib/auth-helpers';
import { getIntlLocaleCode } from '@/lib/locales';

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatNumber(value: number, localeCode: string) {
  return value.toLocaleString(localeCode);
}

export default async function AdminNewsletterPage() {
  const locale = await getLocale();
  const localeCode = getIntlLocaleCode(locale);
  const t = await getTranslations({ locale, namespace: 'admin.newsletterPage' });

  if (!(await isAdminAuthenticated())) redirect(`/${locale}`);

  const [totalSubscribers, confirmedSubscribers, pendingSubscribers, unsubscribedCount, recentCampaigns, campaignMetrics] = await Promise.all([
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { isConfirmed: true, unsubscribedAt: null } }),
    prisma.newsletterSubscriber.count({ where: { isConfirmed: false } }),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: { not: null } } }),
    prisma.campaign.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, subject: true, status: true, type: true, sentAt: true, scheduledAt: true, totalRecipients: true, sentCount: true, openCount: true, createdAt: true, post: { select: { translations: { where: { locale: 'pt' }, select: { title: true }, take: 1 } } } } }),
    prisma.campaign.aggregate({ _sum: { sentCount: true, openCount: true } }),
  ]);

  const totalSent = campaignMetrics._sum.sentCount ?? 0;
  const totalOpens = campaignMetrics._sum.openCount ?? 0;
  const overallOpenRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;

  const statusLabels: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: t('status.draft'), cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    SCHEDULED: { label: t('status.scheduled'), cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    SENDING: { label: t('status.sending'), cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    SENT: { label: t('status.sent'), cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    FAILED: { label: t('status.failed'), cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };

  const stats = [
    { key: 'active', label: t('stats.active'), value: formatNumber(confirmedSubscribers, localeCode), icon: Users, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
    { key: 'pending', label: t('stats.pending'), value: formatNumber(pendingSubscribers, localeCode), icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { key: 'unsubscribed', label: t('stats.unsubscribed'), value: formatNumber(unsubscribedCount, localeCode), icon: UserMinus, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
    { key: 'openRate', label: t('stats.openRate'), value: formatPercent(overallOpenRate), icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  ];

  return (
    <main className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle', { count: totalSubscribers })}</p>
        </div>
        <Link href={`/${locale}/admin/newsletter/campaigns/new`} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700">
          <Plus className="h-4 w-4" />
          {t('newCampaign')}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.key} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><Send className="h-5 w-5 text-muted-foreground" />{t('recentCampaigns')}</h2>
          <Link href={`/${locale}/admin/newsletter/campaigns`} className="flex items-center gap-1 text-sm font-medium text-green-600 hover:underline dark:text-green-400">{t('seeAll')}<ChevronRight className="h-4 w-4" /></Link>
        </div>

        {recentCampaigns.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground"><MailCheck className="mx-auto mb-3 h-12 w-12 opacity-40" /><p className="text-sm font-medium">{t('empty.title')}</p><p className="mt-1 text-xs">{t('empty.description')}</p></div>
        ) : (
          <div className="divide-y divide-border">
            {recentCampaigns.map((campaign) => {
              const openRate = campaign.sentCount > 0 ? ((campaign.openCount / campaign.sentCount) * 100).toFixed(1) : '—';
              const badge = statusLabels[campaign.status] ?? statusLabels.DRAFT;
              return (
                <Link key={campaign.id} href={`/${locale}/admin/newsletter/campaigns/${campaign.id}`} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50">
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {campaign.type === 'POST_BASED' ? <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <Code2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                      <p className="truncate text-sm font-semibold text-foreground">{campaign.subject}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString(localeCode, { day: '2-digit', month: 'short', year: 'numeric' }) : campaign.scheduledAt ? t('scheduledFor', { date: new Date(campaign.scheduledAt).toLocaleDateString(localeCode) }) : new Date(campaign.createdAt).toLocaleDateString(localeCode, { day: '2-digit', month: 'short' })}</p>
                  </div>
                  <div className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
                    <div className="text-center"><p className="font-semibold text-foreground">{formatNumber(campaign.sentCount, localeCode)}</p><p className="text-xs">{t('metrics.sent')}</p></div>
                    <div className="text-center"><p className="font-semibold text-foreground">{openRate}%</p><p className="text-xs">{t('metrics.openRate')}</p></div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
