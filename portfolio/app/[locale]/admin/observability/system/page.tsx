'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Cpu, RefreshCw, Container, ArrowDown, ArrowUp,
    MemoryStick, AlertTriangle, Server, HardDrive,
    Database, Image as ImageIcon, Copy, Check,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContainerMetric {
    id: string;
    name: string;
    status: string;
    cpuPercent: number;
    memUsageMb: number;
    memLimitMb: number;
    memPercent: number;
    netRxMb: number;
    netTxMb: number;
    ioReadMb: number;
    ioWriteMb: number;
}

interface SystemMetrics {
    collectedAt: string;
    host: {
        cpuPercent: number;
        memUsedMb: number;
        memTotalMb: number;
        memPercent: number;
        uptime: number;
    };
    docker: {
        volumeCount: number;
        imageCount: number;
        imageSizeMb: number;
    };
    containers: ContainerMetric[];
}

interface HistoryPoint {
    time: string;
    cpuPercent: number;
    memPercent: number;
    memUsedMb: number;
    netRxMb: number;
    netTxMb: number;
    ioReadMb: number;
    ioWriteMb: number;
}

interface WorkerLog {
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    event: string;
    [key: string]: unknown;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSystemPage() {
    const t = useTranslations('admin.observability.system');
    const [data, setData] = useState<SystemMetrics | null>(null);
    const [history, setHistory] = useState<HistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<WorkerLog[]>([]);
    const [levelFilter, setLevelFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all');
    const [selectedLog, setSelectedLog] = useState<WorkerLog | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [metricsRes, historyRes, logsRes] = await Promise.all([
                fetch('/api/admin/observability/system'),
                fetch('/api/admin/observability/system/history?limit=60'),
                fetch('/api/admin/observability/worker/logs?limit=100'),
            ]);

            if (!metricsRes.ok) {
                const json = await metricsRes.json();
                throw new Error(json.error ?? t('unknownError'));
            }
            setData(await metricsRes.json());

            if (historyRes.ok) {
                const { history: raw } = await historyRes.json();
                setHistory(
                    (raw as SystemMetrics[]).map((m) => {
                        const totalRx = m.containers.reduce((s, c) => s + c.netRxMb, 0);
                        const totalTx = m.containers.reduce((s, c) => s + c.netTxMb, 0);
                        const totalIoRead = m.containers.reduce((s, c) => s + (c.ioReadMb ?? 0), 0);
                        const totalIoWrite = m.containers.reduce((s, c) => s + (c.ioWriteMb ?? 0), 0);
                        return {
                            time: new Date(m.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                            cpuPercent: m.host.cpuPercent,
                            memPercent: m.host.memPercent,
                            memUsedMb: m.host.memUsedMb,
                            netRxMb: Math.round(totalRx * 100) / 100,
                            netTxMb: Math.round(totalTx * 100) / 100,
                            ioReadMb: Math.round(totalIoRead * 100) / 100,
                            ioWriteMb: Math.round(totalIoWrite * 100) / 100,
                        };
                    }),
                );
            }

            if (logsRes.ok) {
                setLogs((await logsRes.json()).logs);
            }
        } catch (e) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 30_000);
        return () => clearInterval(interval);
    }, [fetchAll]);

    const filteredLogs = logs.filter((l) => levelFilter === 'all' || l.level === levelFilter);

    return (
        <main className="space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t('subtitle')}
                    </p>
                </div>
                <button
                    onClick={fetchAll}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    {t('refresh')}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-900/20">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                    <div>
                        <p className="font-medium text-red-700 dark:text-red-400">{t('loadError')}</p>
                        <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                    </div>
                </div>
            )}

            {/* ── Host overview ── */}
            {data?.host && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
                    <MetricCard
                        label={t('cards.cpu')}
                        value={`${data.host.cpuPercent}%`}
                        sub={t('cards.cpuSub')}
                        accent={data.host.cpuPercent > 80 ? 'red' : data.host.cpuPercent > 50 ? 'amber' : 'emerald'}
                        icon={Cpu}
                    />
                    <MetricCard
                        label={t('cards.memory')}
                        value={`${data.host.memUsedMb} MB`}
                        sub={t('cards.memorySub', { total: data.host.memTotalMb, percent: data.host.memPercent })}
                        accent={data.host.memPercent > 85 ? 'red' : data.host.memPercent > 65 ? 'amber' : 'blue'}
                        icon={MemoryStick}
                    />
                    <MetricCard
                        label={t('cards.uptime')}
                        value={formatUptime(data.host.uptime)}
                        sub={t('cards.uptimeSub')}
                        accent="violet"
                        icon={Server}
                    />
                    <MetricCard
                        label={t('cards.containers')}
                        value={String(data.containers.length)}
                        sub={t('cards.containersSub')}
                        accent="blue"
                        icon={Container}
                    />
                    <MetricCard
                        label={t('cards.volumes')}
                        value={String(data.docker?.volumeCount ?? '—')}
                        sub={t('cards.volumesSub')}
                        accent="slate"
                        icon={Database}
                    />
                    <MetricCard
                        label={t('cards.images')}
                        value={String(data.docker?.imageCount ?? '—')}
                        sub={data.docker ? `${(data.docker.imageSizeMb / 1024).toFixed(1)} GB` : ''}
                        accent="slate"
                        icon={ImageIcon}
                    />
                </div>
            )}

            {/* ── History Charts ── */}
            {history.length > 1 && (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <ChartCard title={t('charts.cpuMemory')} sub={t('charts.percentOverTime')}>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={history} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gCpu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gMem" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} unit="%" />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v ?? 0}%`]} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Area type="monotone" dataKey="cpuPercent" name={t('series.cpu')} stroke="#f59e0b" fill="url(#gCpu)" strokeWidth={1.5} dot={false} />
                                <Area type="monotone" dataKey="memPercent" name={t('series.memory')} stroke="#3b82f6" fill="url(#gMem)" strokeWidth={1.5} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title={t('charts.memoryUsage')} sub={t('charts.mbOverTime')}>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={history} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gMemMb" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit=" MB" />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v ?? 0} MB`]} />
                                <Area type="monotone" dataKey="memUsedMb" name={t('series.memory')} stroke="#8b5cf6" fill="url(#gMemMb)" strokeWidth={1.5} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title={t('charts.network')} sub={t('charts.cumulative')}>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={history} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gRx" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gTx" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit=" MB" />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v ?? 0} MB`]} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Area type="monotone" dataKey="netRxMb" name={t('series.rx')} stroke="#10b981" fill="url(#gRx)" strokeWidth={1.5} dot={false} />
                                <Area type="monotone" dataKey="netTxMb" name={t('series.tx')} stroke="#f43f5e" fill="url(#gTx)" strokeWidth={1.5} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title={t('charts.disk')} sub={t('charts.cumulative')}>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={history} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gRead" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gWrite" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit=" MB" />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v ?? 0} MB`]} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Area type="monotone" dataKey="ioReadMb" name={t('series.read')} stroke="#06b6d4" fill="url(#gRead)" strokeWidth={1.5} dot={false} />
                                <Area type="monotone" dataKey="ioWriteMb" name={t('series.write')} stroke="#f97316" fill="url(#gWrite)" strokeWidth={1.5} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            )}

            {/* ── Container table ── */}
            {data?.containers && data.containers.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-sm font-semibold text-foreground">{t('cards.containers')}</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-xs text-muted-foreground">
                                    <th className="px-5 py-3 text-left font-medium">{t('table.name')}</th>
                                    <th className="px-5 py-3 text-left font-medium">{t('table.status')}</th>
                                    <th className="px-5 py-3 text-right font-medium">{t('series.cpu')}</th>
                                    <th className="px-5 py-3 text-right font-medium">{t('series.memory')}</th>
                                    <th className="px-5 py-3 text-right font-medium">{t('table.memPercent')}</th>
                                    <th className="px-5 py-3 text-right font-medium">
                                        <ArrowDown className="inline h-3 w-3" /> {t('series.rx')}
                                    </th>
                                    <th className="px-5 py-3 text-right font-medium">
                                        <ArrowUp className="inline h-3 w-3" /> {t('series.tx')}
                                    </th>
                                    <th className="px-5 py-3 text-right font-medium">
                                        <HardDrive className="inline h-3 w-3" /> {t('series.read')}
                                    </th>
                                    <th className="px-5 py-3 text-right font-medium">
                                        <HardDrive className="inline h-3 w-3" /> {t('series.write')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {[...data.containers]
                                    .sort((a, b) => b.memUsageMb - a.memUsageMb)
                                    .map((c) => (
                                        <tr key={c.id} className="transition-colors hover:bg-muted/40">
                                            <td className="px-5 py-3">
                                                <span className="font-mono text-xs text-foreground">{c.name}</span>
                                                <span className="ml-2 text-xs text-muted-foreground">{c.id}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <StatusBadge status={c.status} />
                                            </td>
                                            <td className="px-5 py-3 text-right tabular-nums">
                                                <span className={c.cpuPercent > 80 ? 'text-red-500' : 'text-foreground'}>
                                                    {c.cpuPercent.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right tabular-nums text-foreground">
                                                {c.memUsageMb} MB
                                            </td>
                                            <td className="px-5 py-3 text-right tabular-nums">
                                                <MiniBar value={c.memPercent} />
                                            </td>
                                            <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                                                {c.netRxMb} MB
                                            </td>
                                            <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                                                {c.netTxMb} MB
                                            </td>
                                            <td className="px-5 py-3 text-right tabular-nums text-cyan-500/80">
                                                {c.ioReadMb ?? 0} MB
                                            </td>
                                            <td className="px-5 py-3 text-right tabular-nums text-orange-500/80">
                                                {c.ioWriteMb ?? 0} MB
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Worker Logs ── */}
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h2 className="text-sm font-semibold text-foreground">{t('logs.title')}</h2>
                    <div className="flex gap-1">
                        {(['all', 'error', 'warn', 'info'] as const).map((l) => (
                            <button
                                key={l}
                                onClick={() => setLevelFilter(l)}
                                className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${levelFilter === l
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="max-h-96 overflow-y-auto overflow-x-hidden font-mono text-xs">
                    {filteredLogs.map((log, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedLog(log)}
                            className={`group flex w-full flex-col gap-0.5 border-b border-border/50 px-5 py-2 text-left last:border-0 transition-colors hover:bg-muted/50
                                ${log.level === 'error' ? 'bg-red-500/5' : log.level === 'warn' ? 'bg-amber-500/5' : ''}`}
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="shrink-0 text-muted-foreground">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span className={`w-7 shrink-0 font-semibold uppercase
                                    ${log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-amber-500' : 'text-muted-foreground'}`}
                                >
                                    {log.level}
                                </span>
                                <span className="truncate text-foreground">{log.event}</span>
                            </div>
                            {(() => {
                                const extras = Object.entries(log).filter(
                                    ([k]) => !['timestamp', 'queues', 'level', 'event', 'service'].includes(k),
                                );
                                if (!extras.length) return null;
                                return (
                                    <div className="flex flex-col gap-0.5">
                                        {extras.map(([k, v]) => (
                                            <div key={k} className="truncate text-muted-foreground">
                                                <span className="text-blue-400">{k}</span>
                                                {'='}
                                                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </button>
                    ))}

                    {filteredLogs.length === 0 && (
                        <p className="px-5 py-6 text-center text-muted-foreground">{t('logs.empty')}</p>
                    )}
                </div>
            </div>

            {data && (
                <p className="text-right text-xs text-muted-foreground">
                    {t('collectedAt', { time: new Date(data.collectedAt).toLocaleTimeString() })}
                </p>
            )}

            <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        </main>
    );
}

// ─── Chart wrapper ────────────────────────────────────────────────────────────

const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 8,
    fontSize: 11,
    color: 'hsl(var(--foreground))',
};

function ChartCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
            {children}
        </div>
    );
}

// ─── Log detail modal ─────────────────────────────────────────────────────────

function LogDetailModal({ log, onClose }: { log: WorkerLog | null; onClose: () => void }) {
    const t = useTranslations('admin.observability.system');
    const [copied, setCopied] = useState(false);

    async function copyJson() {
        if (!log) return;
        try {
            await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard indisponivel (contexto sem HTTPS ou permissao negada).
            // Copiar log e conveniencia; falhar em silencio e melhor do que
            // interromper a tela de observabilidade com um erro.
        }
    }

    const extras = log
        ? Object.entries(log).filter(([k]) => !['timestamp', 'level', 'event', 'service', 'queues'].includes(k))
        : [];

    return (
        <Dialog open={!!log} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-2xl bg-background border-border">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${log?.level === 'error' ? 'bg-red-500/10 text-red-500'
                                    : log?.level === 'warn' ? 'bg-amber-500/10 text-amber-500'
                                        : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {log?.level}
                                </span>
                                <DialogTitle className="font-mono text-sm">{log?.event}</DialogTitle>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {log?.timestamp && new Date(log.timestamp).toLocaleString()}
                            </p>
                        </div>
                        <button
                            onClick={copyJson}
                            className="mt-3 flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                            {copied ? t('logs.copied') : t('logs.copy')}
                        </button>
                    </div>
                </DialogHeader>

                {extras.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">{t('logs.context')}</p>
                        <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full text-xs">
                                <tbody className="divide-y divide-border">
                                    {extras.map(([k, v]) => (
                                        <tr key={k} className="hover:bg-muted/30">
                                            <td className="whitespace-nowrap bg-muted/30 px-3 py-2 font-mono text-blue-400 align-top">{k}</td>
                                            <td className="break-all px-3 py-2 font-mono text-foreground">
                                                {typeof v === 'object'
                                                    ? <pre className="whitespace-pre-wrap">{JSON.stringify(v, null, 2)}</pre>
                                                    : String(v)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">{t('logs.raw')}</p>
                    <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs text-foreground">
                        {log && JSON.stringify(log, null, 2)}
                    </pre>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

type Accent = 'emerald' | 'red' | 'amber' | 'blue' | 'violet' | 'slate';

const ACCENT_CLASSES: Record<Accent, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
    red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400' },
    slate: { bg: 'bg-slate-100 dark:bg-slate-800/40', text: 'text-slate-600 dark:text-slate-400' },
};

function MetricCard({ label, value, sub, accent, icon: Icon }: {
    label: string; value: string; sub: string; accent: Accent; icon: React.ComponentType<{ className?: string }>;
}) {
    const { bg, text } = ACCENT_CLASSES[accent];
    return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
                    <Icon className={`h-4 w-4 ${text}`} />
                </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const isRunning = status === 'running';
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${isRunning
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-muted text-muted-foreground'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
            {status}
        </span>
    );
}

function MiniBar({ value }: { value: number }) {
    const color = value > 85 ? 'bg-red-500' : value > 65 ? 'bg-amber-400' : 'bg-emerald-500';
    return (
        <div className="flex items-center justify-end gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
            </div>
            <span className="w-8 text-right text-muted-foreground">{value}%</span>
        </div>
    );
}

function formatUptime(seconds: number) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}