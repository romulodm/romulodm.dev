// app/[locale]/admin/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
    DollarSign, Eye, Heart, MessageSquare, Users, FileText,
    TrendingUp, BarChart2, Coffee, AlertTriangle, RefreshCw,
    Activity, Info, Radio,
} from 'lucide-react';

import type { DashboardData, Period } from '@/components/admin/dashboard/types';
import { PeriodSelector } from '@/components/admin/dashboard/PeriodSelector';
import { KpiCard, SectionHeading, Panel, GrowthBadge } from '@/components/admin/dashboard/primitives';
import { AlertsPanel } from '@/components/admin/dashboard/AlertsPanel';
import { FunnelPanel } from '@/components/admin/dashboard/FunnelPanel';
import { ContentHealthPanel } from '@/components/admin/dashboard/ContentHealthPanel';
import { RecentCommentsPanel } from '@/components/admin/dashboard/RecentCommentsPanel';
import { TopPostsPanel } from '@/components/admin/dashboard/TopPostsPanel';
import { TagPerformancePanel } from '@/components/admin/dashboard/TagPerformancePanel';
import { NewsletterPanel } from '@/components/admin/dashboard/NewsletterPanel';
import { DraftsPanel } from '@/components/admin/dashboard/DraftsPanel';
import { DonationsSection } from '@/components/admin/dashboard/DonationsPanel';
import { DashboardSkeleton } from '@/components/admin/dashboard/DashboardSkeleton';
import { EngagementChart, AudienceChart, MonthlyChart } from '@/components/admin/dashboard/charts';
import { fmtCompact, fmtCurrency, fmtNumber, fmtTime } from '@/components/admin/dashboard/format';

const REFRESH_MS = 60_000;

export default function AdminDashboardPage() {
    const t = useTranslations('admin.dashboard');
    const locale = useLocale();

    const [period, setPeriod] = useState<Period>('30d');
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Evita que uma resposta lenta de um período antigo sobrescreva a atual.
    const requestId = useRef(0);

    const fetchData = useCallback(async (p: Period) => {
        const id = ++requestId.current;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/dashboard?period=${p}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = (await res.json()) as DashboardData;
            if (id === requestId.current) setData(json);
        } catch (e) {
            if (id === requestId.current) setError(e instanceof Error ? e.message : String(e));
        } finally {
            if (id === requestId.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(period);
        const timer = setInterval(() => fetchData(period), REFRESH_MS);
        return () => clearInterval(timer);
    }, [fetchData, period]);

    if (!data && loading) return <DashboardSkeleton />;

    if (!data) {
        return (
            <main className="p-6 lg:p-8">
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{t('error.title')}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{error ?? t('error.unknown')}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => fetchData(period)}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        {t('error.retry')}
                    </button>
                </div>
            </main>
        );
    }

    const { overview, deltas, funnel, contentHealth, alerts, newsletter, moderation, donations, drafts, highlight, charts } = data;

    // Sparklines derivadas das séries já carregadas — sem query extra.
    const likeSpark = charts.engagement.map((p) => p.likes);
    const commentSpark = charts.engagement.map((p) => p.comments);
    const userSpark = charts.audience.map((p) => p.users);
    const donationSpark = charts.audience.map((p) => p.donationsBrl);

    const periodLabel = t(`period.options.${period}`);

    return (
        <main className="space-y-6 p-6 lg:p-8">

            {/* ── Header ────────────────────────────────────────────────────── */}
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {t('greeting', { name: 'Romulo' })}
                    </h1>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                        {t('subtitle')}
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70">
                            <Radio className="h-3 w-3 text-emerald-500" />
                            {t('liveUpdate', { time: fmtTime(data.collectedAt, locale) })}
                        </span>
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <PeriodSelector value={period} onChange={setPeriod} disabled={loading} />
                    <button
                        type="button"
                        onClick={() => fetchData(period)}
                        disabled={loading}
                        aria-label={t('refresh')}
                        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">{t('refresh')}</span>
                    </button>
                    <a
                        href="/status"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                        <Info className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('statusPage')}</span>
                    </a>
                    <a
                        href="https://analytics.google.com/analytics/web/"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                        <Info className="h-4 w-4" />
                        <span className="hidden sm:inline">Google Analytics</span>
                    </a>
                </div>
            </header>

            {/* ── KPIs ──────────────────────────────────────────────────────── */}
            <section>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
                    <KpiCard
                        label={t('kpi.raised')}
                        value={fmtCurrency(overview.totalRaisedBrl, locale)}
                        sub={t('kpi.raisedSub', { count: overview.totalSupporters })}
                        icon={DollarSign}
                        accent="text-emerald-600 dark:text-emerald-400"
                        growth={deltas.donations.amountGrowth}
                        spark={donationSpark}
                        href="/admin/donations"
                    />
                    <KpiCard
                        label={t('kpi.views')}
                        value={fmtCompact(overview.totalViews, locale)}
                        sub={t('kpi.viewsSub', { count: overview.totalPosts })}
                        icon={Eye}
                        accent="text-blue-600 dark:text-blue-400"
                    />
                    <KpiCard
                        label={t('kpi.likes')}
                        value={fmtNumber(overview.totalLikes, locale)}
                        sub={t('kpi.inPeriod', { period: periodLabel })}
                        icon={Heart}
                        accent="text-rose-500 dark:text-rose-400"
                        growth={deltas.likes.growth}
                        spark={likeSpark}
                    />
                    <KpiCard
                        label={t('kpi.comments')}
                        value={fmtNumber(overview.totalCommentsAll, locale)}
                        sub={t('kpi.inPeriod', { period: periodLabel })}
                        icon={MessageSquare}
                        accent="text-violet-600 dark:text-violet-400"
                        growth={deltas.comments.growth}
                        spark={commentSpark}
                    />
                    <KpiCard
                        label={t('kpi.newUsers')}
                        value={fmtNumber(deltas.users.current, locale)}
                        sub={t('kpi.previous', { value: deltas.users.previous })}
                        icon={Users}
                        accent="text-sky-600 dark:text-sky-400"
                        growth={deltas.users.growth}
                        spark={userSpark}
                    />
                    <KpiCard
                        label={t('kpi.published')}
                        value={fmtNumber(deltas.posts.current, locale)}
                        sub={t('kpi.perWeek', { value: contentHealth.publishVelocity.perWeek })}
                        icon={FileText}
                        accent="text-amber-600 dark:text-amber-500"
                        growth={deltas.posts.growth}
                        href="/admin/posts"
                    />
                </div>
            </section>

            {/* ── Precisa de atenção ────────────────────────────────────────── */}
            <section>
                <SectionHeading icon={Activity}>{t('sections.attention')}</SectionHeading>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <div className="xl:col-span-2">
                        <AlertsPanel alerts={alerts} />
                    </div>
                    <DraftsPanel drafts={drafts} highlight={highlight} />
                </div>
            </section>

            {/* ── Desempenho ────────────────────────────────────────────────── */}
            <section>
                <SectionHeading
                    icon={BarChart2}
                    aside={
                        <span className="text-xs text-muted-foreground">
                            {t('sections.performanceHint', { period: periodLabel })}
                        </span>
                    }
                >
                    {t('sections.performance')}
                </SectionHeading>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <Panel
                        title={t('charts.engagementTitle')}
                        subtitle={t('charts.engagementSubtitle', { period: periodLabel })}
                        className="xl:col-span-2"
                        legend={[
                            { label: t('charts.likes'), color: '#f43f5e' },
                            { label: t('charts.comments'), color: '#8b5cf6' },
                        ]}
                    >
                        <div className="mb-2 flex flex-wrap items-baseline gap-x-5 gap-y-1">
                            <span className="flex items-baseline gap-2">
                                <span className="text-2xl font-semibold tabular-nums text-foreground">
                                    {fmtNumber(deltas.likes.current, locale)}
                                </span>
                                <span className="text-xs text-muted-foreground">{t('charts.likes')}</span>
                                <GrowthBadge growth={deltas.likes.growth} />
                            </span>
                            <span className="flex items-baseline gap-2">
                                <span className="text-2xl font-semibold tabular-nums text-foreground">
                                    {fmtNumber(deltas.comments.current, locale)}
                                </span>
                                <span className="text-xs text-muted-foreground">{t('charts.comments')}</span>
                                <GrowthBadge growth={deltas.comments.growth} />
                            </span>
                        </div>
                        <EngagementChart data={charts.engagement} bucket={data.bucket} />
                    </Panel>

                    <FunnelPanel funnel={funnel} />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <Panel
                        title={t('charts.audienceTitle')}
                        subtitle={t('charts.audienceSubtitle')}
                        className="xl:col-span-2"
                        legend={[
                            { label: t('charts.newUsers'), color: '#3b82f6' },
                            { label: t('charts.donations'), color: '#10b981' },
                        ]}
                    >
                        <AudienceChart data={charts.audience} bucket={data.bucket} />
                    </Panel>

                    <TagPerformancePanel tags={charts.tagPerformance} />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <Panel
                        title={t('charts.monthlyTitle')}
                        subtitle={t('charts.monthlySubtitle')}
                        className="xl:col-span-2"
                        legend={[
                            { label: t('charts.views'), color: '#3b82f6' },
                            { label: t('charts.postsPublished'), color: '#f59e0b' },
                        ]}
                    >
                        <MonthlyChart data={charts.monthly} />
                    </Panel>

                    <ContentHealthPanel health={contentHealth} />
                </div>
            </section>

            {/* ── Comunidade ────────────────────────────────────────────────── */}
            <section>
                <SectionHeading icon={MessageSquare}>{t('sections.community')}</SectionHeading>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <div className="xl:col-span-2">
                        <RecentCommentsPanel
                            comments={moderation.recentComments}
                            suspiciousCount={moderation.suspicious72h}
                        />
                    </div>
                    <NewsletterPanel newsletter={newsletter} subscribers={deltas.subscribers} />
                </div>
            </section>

            {/* ── Conteúdo ──────────────────────────────────────────────────── */}
            <section>
                <SectionHeading icon={TrendingUp}>{t('sections.content')}</SectionHeading>
                <TopPostsPanel posts={charts.topPosts} />
            </section>

            {/* ── Doações ───────────────────────────────────────────────────── */}
            <section>
                <SectionHeading icon={Coffee}>{t('sections.donations')}</SectionHeading>
                <DonationsSection data={data} />
            </section>

            <footer className="flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
                <span>{t('footer.autoRefresh', { seconds: REFRESH_MS / 1000 })}</span>
                <span>{t('footer.collectedAt', { time: fmtTime(data.collectedAt, locale) })}</span>
            </footer>
        </main>
    );
}
