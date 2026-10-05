'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getIntlLocaleCode } from '@/lib/locales';
import { WeeklyAudience } from '@/components/status/WeeklyAudience';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayStat { day: string; count: number }
interface DayDonation { day: string; count: number; totalBrl: number }

interface StatusData {
    updated_at: string;
    status: 'healthy' | 'unhealthy';
    version: string;
    dependencies: {
        database: {
            status: 'healthy' | 'unhealthy';
            availableConnections: number | null;
            openedConnections: number | null;
            latencyMs: number[];
            postgresVersion: string | null;
            databaseSizeMb: number | null;
            tableSizes: { name: string; sizeMb: number; rowEstimate: number }[];
        };
        webServer: {
            status: 'healthy' | 'unhealthy';
            provider: string;
            environment: string;
            awsRegion: string | null;
            vercelRegion: string | null;
            timezone: string;
            commitAuthor: string | null;
            commitSha: string | null;
            nodeVersion: string;
        };
    };
    statistics: {
        users: DayStat[];
        posts: DayStat[];
        comments: DayStat[];
        replies: DayStat[];
        votes: DayStat[];
        // Opcionais: o cache de estatisticas (Redis, ate 15 min) pode ainda
        // guardar o payload de antes destes campos existirem.
        wallMessages?: DayStat[];
        wall?: { total: number };
        suspiciousComments: DayStat[];
        donationsPerDay: DayDonation[];
        unsubscribesPerDay: DayStat[];
        newsletter: {
            total: number;
            confirmed: number;
            pending: number;
            unsubscribed: number;
            confirmationRate: number;
        };
        campaigns: {
            subject: string;
            sentAt: string;
            totalRecipients: number;
            sentCount: number;
            openCount: number;
            failedCount: number;
            openRate: number;
        }[];
        topPostsWeek: {
            title: string;
            slug: string;
            views: number;
            likes: number;
            commentsCount: number;
        }[];
        engagement: {
            totalPosts: number;
            avgComments: number;
            avgViews: number;
            avgLikes: number;
        };
    };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatusPage() {
    const t = useTranslations('statusPage');
    const intlLocale = getIntlLocaleCode(useLocale());
    const [data, setData] = useState<StatusData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/status');
                setData(await res.json());
            } finally {
                setLoading(false);
            }
        }
        load();
        const id = setInterval(load, 30_000);
        return () => clearInterval(id);
    }, []);

    // Mesma largura do conteudo da navbar (container max-w-7xl px-6). O pt
    // compensa a navbar fixa.
    //
    // Os dois returns abaixo montam <main> com h1 e WeeklyAudience nas mesmas
    // posicoes (e com a mesma key): o React reaproveita o componente quando o
    // status chega, e a audiencia nao e buscada de novo.
    const mainClass = 'mx-auto max-w-7xl px-6 pb-16 pt-28 space-y-14';

    if (loading || !data) {
        return (
            <main className={mainClass}>
                <h1 className="type-h1 text-foreground">
                    {t('title')}
                </h1>
                <WeeklyAudience key="audience" />
                {loading && (
                    <div className="space-y-3">
                        {[100, 80, 100, 60, 80, 40].map((w, i) => (
                            <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
                        ))}
                    </div>
                )}
            </main>
        );
    }

    const db = data.dependencies.database;
    const web = data.dependencies.webServer;
    const stats = data.statistics;

    return (
        <main className={mainClass}>
            <h1 className="type-h1 text-foreground">
                {t('title')}
            </h1>

            {/* ── SECAO: Audiencia (GA4, ultimos 7 dias) ── */}
            <WeeklyAudience key="audience" />

            {/* ── SECAO: Atividade de usuarios ── */}
            <Section title={t('sections.activity')}>
                <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
                    <StatChart title={t('charts.signups')} data={stats.users} />
                    <StatChart title={t('charts.posts')} data={stats.posts} />
                    <StatChart title={t('charts.comments')} data={stats.comments} />
                    <StatChart title={t('charts.replies')} data={stats.replies} />
                    <StatChart title={t('charts.votes')} data={stats.votes} />
                    <StatChart
                        title={t('charts.wallMessages')}
                        data={stats.wallMessages ?? []}
                        color="#b298f0"
                    />
                    <div className="lg:col-span-2">
                        <StatChart
                            title={t('charts.suspicious')}
                            data={stats.suspiciousComments}
                            color="#f97316"
                        />
                    </div>
                </div>
            </Section>

            {/* ── SECAO: Engajamento ── */}
            <Section title={t('sections.engagement')}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    <StatTile label={t('engagement.posts')} value={String(stats.engagement.totalPosts)} />
                    <StatTile label={t('engagement.avgComments')} value={String(stats.engagement.avgComments)} />
                    <StatTile label={t('engagement.avgViews')} value={String(stats.engagement.avgViews)} />
                    <StatTile label={t('engagement.avgLikes')} value={String(stats.engagement.avgLikes)} />
                    <StatTile
                        label={t('engagement.wallMessages')}
                        value={stats.wall ? stats.wall.total.toLocaleString(intlLocale) : '—'}
                    />
                </div>

                {stats.topPostsWeek.length > 0 && (
                    <div className="mt-4">
                        <p className="mb-2 text-sm font-semibold text-foreground">{t('topPosts.title')}</p>
                        <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                                        <th className="px-3 py-2 text-left font-medium">{t('topPosts.columns.title')}</th>
                                        <th className="px-3 py-2 text-right font-medium">{t('topPosts.columns.views')}</th>
                                        <th className="px-3 py-2 text-right font-medium">{t('topPosts.columns.likes')}</th>
                                        <th className="px-3 py-2 text-right font-medium">{t('topPosts.columns.comments')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {stats.topPostsWeek.map((p) => (
                                        <tr key={p.slug} className="hover:bg-muted/20">
                                            <td className="px-3 py-2 text-foreground max-w-[200px] truncate">
                                                {p.title}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{p.views.toLocaleString(intlLocale)}</td>
                                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{p.likes}</td>
                                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{p.commentsCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Section>

            {/* ── SECAO: Doacoes ── */}
            <Section title={t('sections.donations')}>
                <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
                    <StatChart
                        title={t('charts.donations')}
                        data={stats.donationsPerDay}
                        color="#a855f7"
                    />
                    <StatChart
                        title={t('charts.donationAmount')}
                        data={stats.donationsPerDay.map((d) => ({ day: d.day, count: d.totalBrl }))}
                        color="#a855f7"
                        unit="R$"
                    />
                </div>
            </Section>

            {/* ── SECAO: Newsletter ── */}
            <Section title={t('sections.newsletter')}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatTile label={t('newsletter.total')} value={String(stats.newsletter.total)} />
                    <StatTile label={t('newsletter.confirmed')} value={String(stats.newsletter.confirmed)} accent="green" />
                    <StatTile label={t('newsletter.pending')} value={String(stats.newsletter.pending)} accent="amber" />
                    <StatTile label={t('newsletter.confirmationRate')} value={`${stats.newsletter.confirmationRate}%`} accent="green" />
                </div>

                <StatChart
                    title={t('charts.unsubscribes')}
                    data={stats.unsubscribesPerDay}
                    color="#ef4444"
                />

                {stats.campaigns.length > 0 && (
                    <div className="mt-4">
                        <p className="mb-2 text-sm font-semibold text-foreground">{t('campaigns.title')}</p>
                        <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                                        <th className="px-3 py-2 text-left font-medium">{t('campaigns.columns.subject')}</th>
                                        <th className="px-3 py-2 text-right font-medium">{t('campaigns.columns.sent')}</th>
                                        <th className="px-3 py-2 text-right font-medium">{t('campaigns.columns.opens')}</th>
                                        <th className="px-3 py-2 text-right font-medium">{t('campaigns.columns.openRate')}</th>
                                        <th className="px-3 py-2 text-right font-medium">{t('campaigns.columns.failed')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {stats.campaigns.map((c, i) => (
                                        <tr key={i} className="hover:bg-muted/20">
                                            <td className="px-3 py-2 text-foreground max-w-[180px] truncate" title={c.subject}>
                                                {c.subject}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{c.sentCount}</td>
                                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{c.openCount}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                <span className={c.openRate >= 30 ? 'text-emerald-400' : c.openRate >= 15 ? 'text-amber-400' : 'text-muted-foreground'}>
                                                    {c.openRate}%
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                                                <span className={c.failedCount > 0 ? 'text-red-400' : 'text-muted-foreground'}>
                                                    {c.failedCount}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Section>

            <div className="grid gap-14 lg:grid-cols-2 lg:gap-10">
            {/* ── SECAO: Banco de Dados ── */}
            <Section title={t('sections.database')}>
                <div className="space-y-2 text-sm text-foreground">
                    <Row label={t('common.status')}>
                        <Badge value={db.status} healthy={db.status === 'healthy'} />
                    </Row>
                    {db.availableConnections !== null && (
                        <Row label={t('database.availableConnections')}>
                            <Badge value={String(db.availableConnections)} />
                        </Row>
                    )}
                    {db.openedConnections !== null && (
                        <Row label={t('database.openConnections')}>
                            <Badge value={String(db.openedConnections)} />
                        </Row>
                    )}
                    {db.latencyMs.length > 0 && (
                        <Row label={t('database.latency')}>
                            <span className="flex flex-wrap gap-1">
                                {db.latencyMs.map((ms, i) => (
                                    <Badge key={i} value={`${ms}ms`} />
                                ))}
                            </span>
                        </Row>
                    )}
                    {db.postgresVersion && (
                        <Row label={t('database.postgresVersion')}>
                            <Badge value={db.postgresVersion} />
                        </Row>
                    )}
                    {db.databaseSizeMb !== null && (
                        <Row label={t('database.size')}>
                            <Badge value={`${db.databaseSizeMb} MB`} />
                        </Row>
                    )}
                </div>

                {db.tableSizes.length > 0 && (
                    <div className="mt-4">
                        <p className="mb-2 text-sm font-semibold text-foreground">{t('tables.title')}</p>
                        <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                                        <th className="px-3 py-2 text-left font-medium">{t('tables.columns.table')}</th>
                                        <th className="px-3 py-2 text-right font-medium">{t('tables.columns.size')}</th>
                                        <th className="px-3 py-2 text-right font-medium">{t('tables.columns.rows')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {db.tableSizes.map((table) => (
                                        <tr key={table.name} className="hover:bg-muted/20">
                                            <td className="px-3 py-2 font-mono text-foreground">{table.name}</td>
                                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{table.sizeMb} MB</td>
                                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{table.rowEstimate.toLocaleString(intlLocale)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Section>

            {/* ── SECAO: Servidor Web ── */}
            <Section title={t('sections.webServer')}>
                <div className="space-y-2 text-sm text-foreground">
                    <Row label={t('common.status')}><Badge value={web.status} healthy={web.status === 'healthy'} /></Row>
                    {web.provider && <Row label={t('webServer.provider')}><Badge value={web.provider} /></Row>}
                    {web.environment && <Row label={t('webServer.environment')}><Badge value={web.environment} /></Row>}
                    {web.awsRegion && <Row label={t('webServer.awsRegion')}><Badge value={web.awsRegion} /></Row>}
                    {web.vercelRegion && <Row label={t('webServer.vercelRegion')}><Badge value={web.vercelRegion} /></Row>}
                    {web.timezone && <Row label={t('webServer.timezone')}><Badge value={web.timezone} /></Row>}
                    {web.commitAuthor && <Row label={t('webServer.commitAuthor')}><Badge value={web.commitAuthor} /></Row>}
                    {web.commitSha && (
                        <Row label={t('webServer.commitSha')}>
                            <Badge value={`${web.commitSha.slice(0, 19)}...`} title={web.commitSha} />
                        </Row>
                    )}
                    {web.nodeVersion && <Row label={t('webServer.nodeVersion')}><Badge value={web.nodeVersion} /></Row>}
                </div>
            </Section>
            </div>

            <p className="text-xs text-muted-foreground">
                {t('updatedAt', { date: new Date(data.updated_at).toLocaleString(intlLocale) })}
            </p>
        </main>
    );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-6">
            <h2 className="type-h3 text-foreground border-b border-border pb-2">{title}</h2>
            {children}
        </section>
    );
}

// ─── Chart ────────────────────────────────────────────────────────────────────

function StatChart({
    title,
    data,
    color = '#22c55e',
    unit,
}: {
    title: string;
    data: { day: string; count: number }[];
    color?: string;
    unit?: string;
}) {
    const t = useTranslations('statusPage');
    const chartData = data.map((d) => ({
        day: d.day.slice(5).replace('-', '/'),
        count: d.count,
    }));

    return (
        <div>
            <p className="mb-2 text-sm font-semibold text-foreground">{title}</p>
            {chartData.length === 0 ? (
                <div className="flex h-[140px] items-center justify-center rounded border border-dashed border-border">
                    <p className="text-sm text-muted-foreground">{t('noData')}</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="day"
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            tickLine={false}
                            axisLine={false}
                            interval={Math.floor(chartData.length / 10)}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 6,
                                fontSize: 12,
                            }}
                            formatter={(value) => [`${unit ? unit + ' ' : ''}${value ?? 0}`, t('tooltipTotal')]}
                        />
                        <Bar dataKey="count" fill={color} radius={[2, 2, 0, 0]} maxBarSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

// ─── Small components ─────────────────────────────────────────────────────────

function StatTile({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'amber' }) {
    const text = accent === 'green' ? 'text-emerald-400'
        : accent === 'amber' ? 'text-amber-400'
            : 'text-foreground';
    return (
        <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`mt-1 text-xl font-bold tabular-nums ${text}`}>{value}</p>
        </div>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-foreground">{label}:</span>
            {children}
        </div>
    );
}

function Badge({ value, healthy, title }: { value: string; healthy?: boolean; title?: string }) {
    const color =
        healthy === true ? 'border-emerald-700 bg-emerald-950/60 text-emerald-400'
            : healthy === false ? 'border-red-700 bg-red-950/60 text-red-400'
                : 'border-emerald-800/60 bg-emerald-950/40 text-emerald-400';

    return (
        <span title={title} className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs font-medium ${color}`}>
            {value}
        </span>
    );
}