'use client';

import { useEffect, useState } from 'react';
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

    if (loading) {
        return (
            <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
                <h1 className="type-h1 mb-8 text-foreground">
                    Estatisticas e Status do Site
                </h1>
                <div className="space-y-3">
                    {[100, 80, 100, 60, 80, 40].map((w, i) => (
                        <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
                    ))}
                </div>
            </main>
        );
    }

    if (!data) return null;

    const db = data.dependencies.database;
    const web = data.dependencies.webServer;
    const stats = data.statistics;

    return (
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-14">
            <h1 className="type-h1 text-foreground">
                Estatisticas e Status do Site
            </h1>

            {/* ── SECAO: Atividade de usuarios ── */}
            <Section title="Atividade de Usuarios">
                <StatChart title="Novos cadastros" data={stats.users} />
                <StatChart title="Novos posts publicados" data={stats.posts} />
                <StatChart title="Novos comentarios" data={stats.comments} />
                <StatChart title="Novas respostas" data={stats.replies} />
                <StatChart title="Votos em comentarios" data={stats.votes} />
                <StatChart
                    title="Comentarios suspeitos detectados"
                    data={stats.suspiciousComments}
                    color="#f97316"
                />
            </Section>

            {/* ── SECAO: Engajamento ── */}
            <Section title="Engajamento Geral">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatTile label="Posts publicados" value={String(stats.engagement.totalPosts)} />
                    <StatTile label="Media de comentarios" value={String(stats.engagement.avgComments)} />
                    <StatTile label="Media de views" value={String(stats.engagement.avgViews)} />
                    <StatTile label="Media de likes" value={String(stats.engagement.avgLikes)} />
                </div>

                {stats.topPostsWeek.length > 0 && (
                    <div className="mt-4">
                        <p className="mb-2 text-sm font-semibold text-foreground">Top posts (ultimos 7 dias)</p>
                        <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                                        <th className="px-3 py-2 text-left font-medium">Titulo</th>
                                        <th className="px-3 py-2 text-right font-medium">Views</th>
                                        <th className="px-3 py-2 text-right font-medium">Likes</th>
                                        <th className="px-3 py-2 text-right font-medium">Coments.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {stats.topPostsWeek.map((p) => (
                                        <tr key={p.slug} className="hover:bg-muted/20">
                                            <td className="px-3 py-2 text-foreground max-w-[200px] truncate">
                                                {p.title}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{p.views.toLocaleString('pt-BR')}</td>
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
            <Section title="Doacoes">
                <StatChart
                    title="Doacoes concluidas por dia"
                    data={stats.donationsPerDay}
                    color="#a855f7"
                />
                <StatChart
                    title="Valor arrecadado por dia (BRL)"
                    data={stats.donationsPerDay.map((d) => ({ day: d.day, count: d.totalBrl }))}
                    color="#a855f7"
                    unit="R$"
                />
            </Section>

            {/* ── SECAO: Newsletter ── */}
            <Section title="Newsletter">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatTile label="Total de inscritos" value={String(stats.newsletter.total)} />
                    <StatTile label="Confirmados" value={String(stats.newsletter.confirmed)} accent="green" />
                    <StatTile label="Pendentes" value={String(stats.newsletter.pending)} accent="amber" />
                    <StatTile label="Taxa de confirmacao" value={`${stats.newsletter.confirmationRate}%`} accent="green" />
                </div>

                <StatChart
                    title="Cancelamentos por dia"
                    data={stats.unsubscribesPerDay}
                    color="#ef4444"
                />

                {stats.campaigns.length > 0 && (
                    <div className="mt-4">
                        <p className="mb-2 text-sm font-semibold text-foreground">Ultimas campanhas enviadas</p>
                        <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                                        <th className="px-3 py-2 text-left font-medium">Assunto</th>
                                        <th className="px-3 py-2 text-right font-medium">Enviados</th>
                                        <th className="px-3 py-2 text-right font-medium">Aberturas</th>
                                        <th className="px-3 py-2 text-right font-medium">Taxa abert.</th>
                                        <th className="px-3 py-2 text-right font-medium">Falhas</th>
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

            {/* ── SECAO: Banco de Dados ── */}
            <Section title="Banco de Dados">
                <div className="space-y-2 text-sm text-foreground">
                    <Row label="Status">
                        <Badge value={db.status} healthy={db.status === 'healthy'} />
                    </Row>
                    {db.availableConnections !== null && (
                        <Row label="Conexoes disponiveis">
                            <Badge value={String(db.availableConnections)} />
                        </Row>
                    )}
                    {db.openedConnections !== null && (
                        <Row label="Conexoes abertas">
                            <Badge value={String(db.openedConnections)} />
                        </Row>
                    )}
                    {db.latencyMs.length > 0 && (
                        <Row label="Latencia">
                            <span className="flex flex-wrap gap-1">
                                {db.latencyMs.map((ms, i) => (
                                    <Badge key={i} value={`${ms}ms`} />
                                ))}
                            </span>
                        </Row>
                    )}
                    {db.postgresVersion && (
                        <Row label="Versao do PostgreSQL">
                            <Badge value={db.postgresVersion} />
                        </Row>
                    )}
                    {db.databaseSizeMb !== null && (
                        <Row label="Tamanho do banco">
                            <Badge value={`${db.databaseSizeMb} MB`} />
                        </Row>
                    )}
                </div>

                {db.tableSizes.length > 0 && (
                    <div className="mt-4">
                        <p className="mb-2 text-sm font-semibold text-foreground">Maiores tabelas</p>
                        <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                                        <th className="px-3 py-2 text-left font-medium">Tabela</th>
                                        <th className="px-3 py-2 text-right font-medium">Tamanho</th>
                                        <th className="px-3 py-2 text-right font-medium">Linhas (estimado)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {db.tableSizes.map((t) => (
                                        <tr key={t.name} className="hover:bg-muted/20">
                                            <td className="px-3 py-2 font-mono text-foreground">{t.name}</td>
                                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{t.sizeMb} MB</td>
                                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{t.rowEstimate.toLocaleString('pt-BR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Section>

            {/* ── SECAO: Servidor Web ── */}
            <Section title="Servidor Web">
                <div className="space-y-2 text-sm text-foreground">
                    <Row label="Status"><Badge value={web.status} healthy={web.status === 'healthy'} /></Row>
                    {web.provider && <Row label="Provedor"><Badge value={web.provider} /></Row>}
                    {web.environment && <Row label="Ambiente"><Badge value={web.environment} /></Row>}
                    {web.awsRegion && <Row label="Regiao na AWS"><Badge value={web.awsRegion} /></Row>}
                    {web.vercelRegion && <Row label="Regiao na Vercel"><Badge value={web.vercelRegion} /></Row>}
                    {web.timezone && <Row label="Timezone"><Badge value={web.timezone} /></Row>}
                    {web.commitAuthor && <Row label="Autor do ultimo commit"><Badge value={web.commitAuthor} /></Row>}
                    {web.commitSha && (
                        <Row label="SHA do commit">
                            <Badge value={`${web.commitSha.slice(0, 19)}...`} title={web.commitSha} />
                        </Row>
                    )}
                    {web.nodeVersion && <Row label="Versao do Node.js"><Badge value={web.nodeVersion} /></Row>}
                </div>
            </Section>

            <p className="text-xs text-muted-foreground">
                Atualizado em {new Date(data.updated_at).toLocaleString('pt-BR')}
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
    const chartData = data.map((d) => ({
        day: d.day.slice(5).replace('-', '/'),
        count: d.count,
    }));

    return (
        <div>
            <p className="mb-2 text-sm font-semibold text-foreground">{title}</p>
            {chartData.length === 0 ? (
                <div className="flex h-[140px] items-center justify-center rounded border border-dashed border-border">
                    <p className="text-sm text-muted-foreground">Sem dados nos ultimos 60 dias</p>
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
                            formatter={(value) => [`${unit ? unit + ' ' : ''}${value ?? 0}`, 'total']}
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