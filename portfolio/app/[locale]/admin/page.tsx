import { prisma } from '@romulo/database';
import { Coffee, CreditCard, DollarSign, Eye, Heart, Landmark, MessageSquare, TrendingUp } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';

import { getIntlLocaleCode } from '@/lib/locales';
import { formatDistanceToNow } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const PROVIDER_ICON: Record<string, React.ReactNode> = {
  STRIPE: <CreditCard className="h-3.5 w-3.5" />,
  PIX: <Landmark className="h-3.5 w-3.5" />,
  ETH: <span className="text-xs font-bold">ETH</span>,
};

const PROVIDER_COLOR: Record<string, string> = {
  STRIPE: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  PIX: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  ETH: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
};

function formatAmount(amount: number, currency: string, localeCode: string) {
  if (currency === 'ETH') return `${(amount / 1e18).toFixed(4)} ETH`;
  return new Intl.NumberFormat(localeCode, { style: 'currency', currency: 'BRL' }).format(amount / 100);
}

export default async function AdminDashboardPage() {
  const locale = await getLocale();
  const localeCode = getIntlLocaleCode(locale);
  const t = await getTranslations({ locale, namespace: 'admin.dashboard' });

  const [donationStats, recentDonations, topDonations, blogStats] = await Promise.all([
    prisma.donation.aggregate({ where: { status: 'COMPLETED', currency: 'BRL' }, _sum: { amount: true }, _count: { id: true } }),
    prisma.donation.findMany({ where: { status: 'COMPLETED' }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, name: true, amount: true, currency: true, coffees: true, provider: true, createdAt: true, isPrivate: true } }),
    prisma.donation.findMany({ where: { status: 'COMPLETED', currency: 'BRL' }, orderBy: { amount: 'desc' }, take: 10, select: { id: true, name: true, amount: true, coffees: true, provider: true, createdAt: true, isPrivate: true } }),
    prisma.post.aggregate({ where: { status: 'PUBLISHED' }, _sum: { views: true, likes: true, commentsCount: true }, _count: { id: true } }),
  ]);

  const totalBRL = donationStats._sum.amount ?? 0;
  const totalSupporters = donationStats._count.id;
  const totalViews = blogStats._sum.views ?? 0;
  const totalLikes = blogStats._sum.likes ?? 0;
  const totalComments = blogStats._sum.commentsCount ?? 0;
  const totalPosts = blogStats._count.id;

  const overviewStats = [
    { key: 'raised', label: t('stats.raised.label'), value: formatAmount(totalBRL, 'BRL', localeCode), sub: t('stats.raised.sub', { count: totalSupporters }), icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { key: 'views', label: t('stats.views.label'), value: totalViews.toLocaleString(localeCode), sub: t('stats.views.sub', { count: totalPosts }), icon: Eye, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { key: 'likes', label: t('stats.likes.label'), value: totalLikes.toLocaleString(localeCode), sub: t('stats.likes.sub'), icon: Heart, color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { key: 'comments', label: t('stats.comments.label'), value: totalComments.toLocaleString(localeCode), sub: t('stats.comments.sub'), icon: MessageSquare, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  ];

  return (
    <main className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((stat) => (
          <div key={stat.key} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <Coffee className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-foreground">{t('recentTransactions')}</h2>
          </div>

          {recentDonations.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">{t('noDonationsYet')}</div>
          ) : (
            <div className="divide-y divide-border">
              {recentDonations.map((donation) => (
                <div key={donation.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {donation.isPrivate || !donation.name ? '?' : donation.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{donation.isPrivate ? t('anonymous') : donation.name || t('someone')}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(donation.createdAt, locale)} · {t('coffees', { count: donation.coffees })}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${PROVIDER_COLOR[donation.provider]}`}>
                    {PROVIDER_ICON[donation.provider]}
                    {donation.provider}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-foreground">{formatAmount(donation.amount, donation.currency, localeCode)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-foreground">{t('topSupporters')}</h2>
          </div>

          {topDonations.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">{t('noDonationsYet')}</div>
          ) : (
            <div className="divide-y divide-border">
              {topDonations.map((donation, index) => (
                <div key={donation.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`w-5 shrink-0 text-xs font-bold ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-600' : 'text-muted-foreground'}`}>#{index + 1}</span>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {donation.isPrivate || !donation.name ? '?' : donation.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{donation.isPrivate ? t('anonymous') : donation.name || t('someone')}</p>
                    <p className="text-xs text-muted-foreground">{t('coffees', { count: donation.coffees })}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${PROVIDER_COLOR[donation.provider]}`}>{PROVIDER_ICON[donation.provider]}</span>
                  <span className="shrink-0 text-sm font-bold text-foreground">{formatAmount(donation.amount, 'BRL', localeCode)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
