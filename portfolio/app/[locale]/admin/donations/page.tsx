import { prisma } from '@romulo/database';
import { Coffee, DollarSign, TrendingUp, Users } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { DonationsTable } from '@/components/admin/donations/DonationsTable';
import { PreviewTable } from '@/components/admin/donations/PreviewTable';
import { isAdminAuthenticated } from '@/lib/auth-helpers';
import { getIntlLocaleCode } from '@/lib/locales';

const PAGE_SIZE = 20;

type Filter = 'ALL' | 'COMPLETED' | 'PENDING';

function formatNumber(value: number, localeCode: string) {
  return value.toLocaleString(localeCode);
}

function formatBRL(cents: number, localeCode: string) {
  return (cents / 100).toLocaleString(localeCode, { style: 'currency', currency: 'BRL' });
}

async function getData(page: number, filter: Filter) {
  const where = filter === 'ALL' ? {} : { status: filter };

  const [donations, total, stats, topDonors, recentDonors] = await Promise.all([
    prisma.donation.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.donation.count({ where }),
    prisma.donation.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true }, _count: { id: true } }),
    prisma.donation.findMany({ where: { status: 'COMPLETED', currency: 'BRL' }, orderBy: { amount: 'desc' }, take: 10, select: { id: true, name: true, message: true, amount: true, coffees: true, createdAt: true, currency: true } }),
    prisma.donation.findMany({ where: { status: 'COMPLETED' }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, name: true, message: true, amount: true, coffees: true, createdAt: true, currency: true } }),
  ]);

  return { donations, total, stats, topDonors, recentDonors };
}

export default async function AdminDonationsPage({ searchParams }: { searchParams: Promise<{ page?: string; filter?: string }> }) {
  const locale = await getLocale();
  const localeCode = getIntlLocaleCode(locale);
  const t = await getTranslations({ locale, namespace: 'admin.donationsPage' });

  if (!(await isAdminAuthenticated())) redirect(`/${locale}`);

  const { page: pageParam, filter: filterParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10));
  const filter: Filter = filterParam === 'COMPLETED' ? 'COMPLETED' : filterParam === 'PENDING' ? 'PENDING' : 'ALL';

  const { donations, total, stats, topDonors, recentDonors } = await getData(page, filter);
  const totalBRL = stats._sum.amount ?? 0;
  const totalSupporters = stats._count.id;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const statCards = [
    { key: 'raised', label: t('stats.raised'), value: formatBRL(totalBRL, localeCode), icon: DollarSign, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
    { key: 'supporters', label: t('stats.supporters'), value: formatNumber(totalSupporters, localeCode), icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { key: 'donations', label: t('stats.donations'), value: formatNumber(total, localeCode), icon: Coffee, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { key: 'ticket', label: t('stats.averageTicket'), value: totalSupporters > 0 ? formatBRL(Math.round(totalBRL / totalSupporters), localeCode) : formatBRL(0, localeCode), icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  return (
    <main className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.key} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PreviewTable title={t('preview.topSupporters.title')} subtitle={t('preview.topSupporters.subtitle')} icon="trophy" donations={topDonors} />
        <PreviewTable title={t('preview.recent.title')} subtitle={t('preview.recent.subtitle')} icon="clock" donations={recentDonors} />
      </div>

      <DonationsTable donations={donations} total={total} page={page} pageSize={PAGE_SIZE} totalPages={totalPages} filter={filter} />
    </main>
  );
}
