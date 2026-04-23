'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Coffee, CreditCard, DollarSign, Eye, Heart, Landmark,
  MessageSquare, TrendingUp, FileChartColumn, TrendingDown, Minus,
  Users, AlertTriangle, Ban, Mail, FileText,
  BookOpen, ShieldAlert, Clock, BarChart2, RefreshCw,
  Info,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthStat { month: string; views: number; posts: number; comments: number; likes: number }
interface TopPost { slug: string; title: string; views: number; likes: number; commentsCount: number; publishedAt: string | null; tag: string | null }
interface TagStat { tag: string; count: number }
interface DayStat { day: string; likes: number; comments: number }

interface DashboardData {
  collectedAt: string;
  overview: { totalRaisedBrl: number; totalSupporters: number; totalViews: number; totalLikes: number; totalComments: number; totalPosts: number };
  trends: {
    users: { thisWeek: number; lastWeek: number; growth: number | null };
    donations: { thisMonth: { count: number; amountBrl: number }; lastMonth: { count: number; amountBrl: number }; countGrowth: number | null; amountGrowth: number | null };
    topPostWeek: { slug: string; title: string; views: number; likes: number; commentsCount: number } | null;
  };
  newsletter: { total: number; confirmed: number; pending: number; confirmationRate: number; lastCampaign: { subject: string; sentAt: string; sentCount: number; openCount: number; failedCount: number; openRate: number | null } | null };
  moderation: { suspiciousUnreviewed: number; bannedUsers: number; recentBans: { id: string; username: string; bannedAt: string | null; banReason: string | null }[] };
  health: { unverifiedUsers: number; stalePendingDonations: { id: string; name: string | null; amount: number; currency: string; provider: string; createdAt: string }[]; failingCampaigns: { id: string; subject: string; sentAt: string | null; sentCount: number; failedCount: number; failRate: number }[] };
  engagement: { postsNoComments: number; views: { thisMonth: number; lastMonth: number; growth: number | null; avgThisMonth: number; avgLastMonth: number; avgGrowth: number | null } };
  donations: { recent: any[]; top: any[] };
  drafts: { id: string; slug: string; title: string; updatedAt: string }[];
  charts: { monthly: MonthStat[]; topPosts: TopPost[]; tagDistribution: TagStat[]; dailyEngagement: DayStat[] };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROVIDER_ICON: Record<string, React.ReactNode> = {
  STRIPE: <CreditCard className="h-3.5 w-3.5" />, PIX: <Landmark className="h-3.5 w-3.5" />, ETH: <span className="text-xs font-bold">ETH</span>,
};
const PROVIDER_COLOR: Record<string, string> = {
  STRIPE: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  PIX: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  ETH: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
};
const CHART_COLORS = ['#378add', '#1d9e75', '#ba7517', '#888780', '#d85a30', '#7f77dd', '#d4537e', '#639922'];

function fmtBrl(c: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c / 100); }
function fmtAmt(a: number, cur: string) { return cur === 'ETH' ? `${(a / 1e18).toFixed(4)} ETH` : fmtBrl(a); }
function timeAgo(iso: string) { const d = Math.floor((Date.now() - +new Date(iso)) / 86400000); return d === 0 ? 'hoje' : `${d}d atrás`; }
function monthLabel(iso: string) { return new Date(iso + '-01').toLocaleDateString('pt-BR', { month: 'short' }); }

// ─── Chart helpers (vanilla Canvas) ──────────────────────────────────────────

function useChartJs(cb: (Chart: any) => void, deps: any[]) {
  const ready = useRef(false);
  useEffect(() => {
    if ((window as any).Chart) { cb((window as any).Chart); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    s.onload = () => { ready.current = true; cb((window as any).Chart); };
    document.head.appendChild(s);
  }, deps);
}

function destroyChart(ref: React.MutableRefObject<any>) {
  if (ref.current) { ref.current.destroy(); ref.current = null; }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const id = setInterval(fetchData, 30_000); return () => clearInterval(id); }, [fetchData]);

  if (!data && loading) return <DashboardSkeleton />;
  if (!data) return (
    <main className="p-8">
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-900/20">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <p className="text-sm text-red-700 dark:text-red-400">{error ?? 'Erro ao carregar'}</p>
        <button onClick={fetchData} className="ml-auto text-sm font-medium text-red-600 hover:underline">Tentar novamente</button>
      </div>
    </main>
  );

  const { overview, trends, newsletter, moderation, health, engagement, donations, drafts, charts } = data;

  return (
    <main className="space-y-8 p-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, Romulo 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão geral do seu blog e doações
          </p>
        </div>
        <div className='flex gap-2'>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <a
            onClick={fetchData}
            href="/status"
            target='_blank'
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm bg-primary text-white hover:bg-primary/90"
          >
            <Info className="h-4 w-4" />
            Página de status
          </a>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Arrecadado" value={fmtBrl(overview.totalRaisedBrl)} sub={`${overview.totalSupporters} apoiadores`} icon={DollarSign} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20" />
        <StatCard label="Views" value={overview.totalViews.toLocaleString('pt-BR')} sub={`${overview.totalPosts} posts`} icon={Eye} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" />
        <StatCard label="Likes" value={overview.totalLikes.toLocaleString('pt-BR')} sub="Todos os posts" icon={Heart} color="text-rose-500 dark:text-rose-400" bg="bg-rose-50 dark:bg-rose-900/20" />
        <StatCard label="Comentários" value={overview.totalComments.toLocaleString('pt-BR')} sub="Todos os posts" icon={MessageSquare} color="text-violet-600 dark:text-violet-400" bg="bg-violet-50 dark:bg-violet-900/20" />
      </div>

      {/* ── Tendências ── */}
      <section>
        <SectionTitle icon={TrendingUp}>Tendências</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TrendCard
            label="Novos usuários esta semana"
            current={trends.users.thisWeek}
            previous={trends.users.lastWeek}
            previousLabel="semana anterior"
            growth={trends.users.growth}
            icon={Users}
          />
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Coffee className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">Doações este mês</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{trends.donations.thisMonth.count}</p>
            <p className="text-xs text-muted-foreground">{fmtBrl(trends.donations.thisMonth.amountBrl)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mês anterior: {trends.donations.lastMonth.count} · {fmtBrl(trends.donations.lastMonth.amountBrl)}
            </p>
            <div className="mt-2 flex gap-2 flex-wrap">
              <GrowthBadge growth={trends.donations.countGrowth} label="qtd" />
              <GrowthBadge growth={trends.donations.amountGrowth} label="valor" />
            </div>
          </div>
          {trends.topPostWeek ? (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <Eye className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Post mais visto esta semana</p>
              </div>
              <Link href={`/admin/posts/${trends.topPostWeek.slug}`} className="block text-sm font-semibold text-foreground hover:underline line-clamp-2 mb-3">
                {trends.topPostWeek.title}
              </Link>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{trends.topPostWeek.views.toLocaleString('pt-BR')}</span>
                <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{trends.topPostWeek.likes}</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{trends.topPostWeek.commentsCount}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Nenhum post publicado esta semana</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Tendencias + Visao geral ── */}
      <section>
        <SectionTitle icon={FileChartColumn}>Visão Geral</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Newsletter */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm xl:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-900/20"><Mail className="h-4 w-4 text-sky-500" /></div>
              <p className="text-xs font-medium text-muted-foreground">Newsletter</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div><p className="text-xl font-bold text-foreground">{newsletter.confirmed.toLocaleString('pt-BR')}</p><p className="text-xs text-muted-foreground">Confirmados</p></div>
              <div><p className="text-xl font-bold text-amber-500">{newsletter.pending}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
              <div><p className="text-xl font-bold text-foreground">{newsletter.confirmationRate}%</p><p className="text-xs text-muted-foreground">Taxa confirm.</p></div>
            </div>
            {newsletter.lastCampaign && (
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
                <p className="font-medium text-foreground truncate" title={newsletter.lastCampaign.subject}>Última: {newsletter.lastCampaign.subject}</p>
                <p className="text-muted-foreground mt-0.5">
                  {newsletter.lastCampaign.sentCount} enviados
                  {newsletter.lastCampaign.openRate !== null && <> · <span className={newsletter.lastCampaign.openRate >= 30 ? 'text-emerald-400' : newsletter.lastCampaign.openRate >= 15 ? 'text-amber-400' : 'text-muted-foreground'}>{newsletter.lastCampaign.openRate}% abertura</span></>}
                  {newsletter.lastCampaign.failedCount > 0 && <> · <span className="text-red-400">{newsletter.lastCampaign.failedCount} falhas</span></>}
                </p>
              </div>
            )}
          </div>

          {/* Rascunhos */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm xl:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><FileText className="h-4 w-4 text-muted-foreground" /></div>
                <p className="text-xs font-medium text-muted-foreground">Posts em rascunho</p>
              </div>
              {drafts.length > 0 && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{drafts.length}</span>}
            </div>
            {drafts.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum rascunho pendente</p> : (
              <ul className="space-y-0.5">
                {drafts.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/posts/${p.slug}/edit`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-muted/60 transition-colors">
                      <span className="truncate font-medium text-foreground">{p.title}</span>
                      <span className="shrink-0 text-muted-foreground ml-2">{timeAgo(p.updatedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Suspeitos */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${moderation.suspiciousUnreviewed > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-muted'}`}><ShieldAlert className={`h-4 w-4 ${moderation.suspiciousUnreviewed > 0 ? 'text-red-500' : 'text-muted-foreground'}`} /></div>
                <p className="text-xs font-medium text-muted-foreground">Suspeitos</p>
              </div>
              {moderation.suspiciousUnreviewed > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{moderation.suspiciousUnreviewed}</span>}
            </div>
            <p className="text-2xl font-bold text-foreground">{moderation.suspiciousUnreviewed}</p>
            <p className="mt-1 text-xs text-muted-foreground">Nas últimas 72h</p>
            {moderation.suspiciousUnreviewed > 0 && <Link href="/admin/suspicious" className="mt-3 block text-xs font-medium text-red-500 hover:underline">Revisar agora →</Link>}
          </div>

          {/* Banidos */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><Ban className="h-4 w-4 text-muted-foreground" /></div>
              <p className="text-xs font-medium text-muted-foreground">Usuários banidos</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{moderation.bannedUsers}</p>
            <p className="mt-1 text-xs text-muted-foreground">Total ativo</p>
            {moderation.recentBans.slice(0, 3).map((u) => (
              <div key={u.id} className="mt-2 flex items-center justify-between text-xs">
                <Link href={`/admin/users/${u.id}`} className="font-mono text-muted-foreground hover:text-foreground truncate">@{u.username}</Link>
                <span className="shrink-0 text-muted-foreground/60 ml-2">{u.bannedAt ? timeAgo(u.bannedAt) : ''}</span>
              </div>
            ))}
          </div>

          {/* Saude */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${health.stalePendingDonations.length > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-muted'}`}><Clock className={`h-4 w-4 ${health.stalePendingDonations.length > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} /></div>
              <p className="text-xs font-medium text-muted-foreground">Doações PENDING &gt;24h</p>
            </div>
            <p className={`text-2xl font-bold ${health.stalePendingDonations.length > 0 ? 'text-amber-500' : 'text-foreground'}`}>{health.stalePendingDonations.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Possível falha de webhook</p>
          </div>

          {/* Views mes */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20"><Eye className="h-4 w-4 text-blue-500" /></div>
              <p className="text-xs font-medium text-muted-foreground">Views este mês</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{engagement.views.thisMonth.toLocaleString('pt-BR')}</p>
            <p className="mt-1 text-xs text-muted-foreground">Anterior: {engagement.views.lastMonth.toLocaleString('pt-BR')}</p>
            <GrowthBadge growth={engagement.views.growth} />
          </div>
        </div>
      </section>

      {/* ── GRAFICOS ── */}
      <section>
        <SectionTitle icon={BarChart2}>Desempenho</SectionTitle>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

          {/* Grafico principal: Views + Comentarios mensais */}
          <div className="xl:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-xs text-muted-foreground">Views totais</p>
                <p className="text-2xl font-bold text-foreground">
                  {overview.totalViews.toLocaleString('pt-BR')}
                  <GrowthBadge growth={engagement.views.growth} inline />
                </p>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-slate-400 inline-block" />Comentários</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500 inline-block" />Views</span>
              </div>
            </div>
            <MonthlyChart data={charts.monthly} />
          </div>

          {/* Top posts */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground mb-3">Top posts</p>
            <ul className="space-y-0">
              {charts.topPosts.map((p, i) => (
                <li key={p.slug} className="flex items-center gap-2 py-2 border-b border-border/50 last:border-0">
                  <span className={`w-5 shrink-0 text-xs font-bold ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-600' : 'text-muted-foreground'}`}>#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/posts/${p.slug}`} className="block text-xs font-medium text-foreground truncate hover:underline">{p.title}</Link>
                    {p.tag && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-px rounded-full">{p.tag}</span>}
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-foreground tabular-nums">{p.views.toLocaleString('pt-BR')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Segunda linha de graficos */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 mt-4">

          {/* Engajamento diario */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-xs text-muted-foreground">Engajamento</p>
                <p className="text-sm font-semibold text-foreground">Likes e comentários · 30 dias</p>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-rose-400 inline-block" />Likes</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-violet-400 inline-block" />Coments.</span>
              </div>
            </div>
            <EngagementChart data={charts.dailyEngagement} />
          </div>

          {/* Distribuicao por tag */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Distribuição por tag</p>
            <p className="text-sm font-semibold text-foreground mb-3">Posts publicados por categoria</p>
            <div className="flex items-center gap-4">
              <TagChart data={charts.tagDistribution} />
              <ul className="space-y-1.5 flex-shrink-0">
                {charts.tagDistribution.slice(0, 6).map((t, i) => {
                  const total = charts.tagDistribution.reduce((s, x) => s + x.count, 0);
                  const pct = total > 0 ? Math.round((t.count / total) * 100) : 0;
                  return (
                    <li key={t.tag} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="truncate max-w-[80px]">{t.tag}</span>
                      <span className="font-medium text-foreground ml-auto">{pct}%</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Doacoes ── */}
      <section>
        <SectionTitle icon={Coffee}>Doações</SectionTitle>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <DonationList title="Transações recentes" items={donations.recent} showTime />
          <DonationList title="Top apoiadores" items={donations.top} showRank />
        </div>
      </section>

      <p className="text-right text-xs text-muted-foreground">Coletado em {new Date(data.collectedAt).toLocaleTimeString('pt-BR')}</p>
    </main>
  );
}

// ─── Chart components ─────────────────────────────────────────────────────────

function MonthlyChart({ data }: { data: MonthStat[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chart = useRef<any>(null);

  useChartJs((Chart) => {
    destroyChart(chart);
    if (!ref.current || !data.length) return;
    const isDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const grid = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    const txt = isDark ? '#888' : '#999';
    chart.current = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels: data.map((d) => monthLabel(d.month)),
        datasets: [
          { label: 'Comentários', data: data.map((d) => d.comments), backgroundColor: '#888780', borderRadius: 3, barPercentage: 0.55 },
          { label: 'Views', data: data.map((d) => d.views), backgroundColor: '#378add', borderRadius: 3, barPercentage: 0.55 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: grid }, ticks: { color: txt, font: { size: 10 } } },
          y: { grid: { color: grid }, ticks: { color: txt, font: { size: 10 }, callback: (v: number) => v >= 1000 ? Math.round(v / 1000) + 'k' : v } },
        },
      },
    });
  }, [data]);

  return <div style={{ position: 'relative', height: 200 }}><canvas ref={ref} role="img" aria-label="Gráfico de views e comentários mensais" /></div>;
}

function EngagementChart({ data }: { data: DayStat[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chart = useRef<any>(null);

  useChartJs((Chart) => {
    destroyChart(chart);
    if (!ref.current || !data.length) return;
    const isDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const grid = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    const txt = isDark ? '#888' : '#999';
    chart.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels: data.map((d) => d.day.slice(5).replace('-', '/')),
        datasets: [
          { label: 'Likes', data: data.map((d) => d.likes), borderColor: '#f43f5e', borderWidth: 1.5, backgroundColor: 'rgba(244,63,94,0.1)', fill: true, tension: 0.4, pointRadius: 0 },
          { label: 'Comentários', data: data.map((d) => d.comments), borderColor: '#8b5cf6', borderWidth: 1.5, backgroundColor: 'rgba(139,92,246,0.08)', fill: true, tension: 0.4, pointRadius: 0 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: txt, font: { size: 10 }, maxTicksLimit: 8 } },
          y: { grid: { color: grid }, ticks: { color: txt, font: { size: 10 } } },
        },
      },
    });
  }, [data]);

  return <div style={{ position: 'relative', height: 160 }}><canvas ref={ref} role="img" aria-label="Gráfico de engajamento diário" /></div>;
}

function TagChart({ data }: { data: TagStat[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chart = useRef<any>(null);

  useChartJs((Chart) => {
    destroyChart(chart);
    if (!ref.current || !data.length) return;
    chart.current = new Chart(ref.current, {
      type: 'doughnut',
      data: {
        labels: data.map((d) => d.tag),
        datasets: [{ data: data.map((d) => d.count), backgroundColor: CHART_COLORS, borderWidth: 0, hoverOffset: 4 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => ` ${c.label}: ${c.raw}` } } },
      },
    });
  }, [data]);

  return <div style={{ position: 'relative', height: 140, width: 140, flexShrink: 0 }}><canvas ref={ref} role="img" aria-label="Gráfico de distribuição por tag" /></div>;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-sm font-semibold text-foreground">{children}</h2>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, bg, growth }: { label: string; value: string; sub: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; growth?: number | null }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${bg}`}><Icon className={`h-3.5 w-3.5 ${color}`} /></div>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      {growth != null && <GrowthBadge growth={growth} />}
    </div>
  );
}

function GrowthBadge({ growth, inline, label }: { growth: number | null; inline?: boolean; label?: string }) {
  if (growth === null) return null;
  const pos = growth > 0; const neu = growth === 0;
  const cls = neu ? 'bg-muted text-muted-foreground' : pos ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
  const Icon = neu ? Minus : pos ? TrendingUp : TrendingDown;
  return (
    <span className={`${inline ? 'ml-2 text-sm' : 'mt-2 block w-fit'} inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {neu ? 'Sem variação' : `${pos ? '+' : ''}${growth}%`}{label ? ` ${label}` : ''}
    </span>
  );
}

function DonationList({ title, items, showTime, showRank }: { title: string; items: any[]; showTime?: boolean; showRank?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Coffee className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {items.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma doação ainda</div> : (
        <div className="divide-y divide-border">
          {items.map((d, i) => (
            <div key={d.id} className="flex items-center gap-3 px-5 py-3">
              {showRank && <span className={`w-5 shrink-0 text-xs font-bold ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-600' : 'text-muted-foreground'}`}>#{i + 1}</span>}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {d.isPrivate || !d.name ? '?' : d.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{d.isPrivate ? 'Anônimo' : d.name || 'Alguém'}</p>
                <p className="text-xs text-muted-foreground">{showTime && timeAgo(d.createdAt) + ' · '}{d.coffees} café{d.coffees !== 1 ? 's' : ''}</p>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${PROVIDER_COLOR[d.provider]}`}>{PROVIDER_ICON[d.provider]}{showTime && d.provider}</span>
              <span className="shrink-0 text-sm font-semibold text-foreground">{fmtAmt(d.amount, d.currency)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function TrendCard({ label, current, previous, previousLabel, growth, icon: Icon }: { label: string; current: number; previous: number; previousLabel: string; growth: number | null; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold text-foreground">{current}</p>
      <p className="mt-1 text-xs text-muted-foreground">{previousLabel}: {previous}</p>
      <div className="mt-2"><GrowthBadge growth={growth} /></div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <main className="space-y-8 p-8">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-6 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>
      <div className="grid grid-cols-3 gap-4"><div className="xl:col-span-2 h-64 animate-pulse rounded-xl bg-muted" /><div className="h-64 animate-pulse rounded-xl bg-muted" /></div>
    </main>
  );
}