'use client';

import { useEffect, useState, useTransition } from 'react';
import {
    Activity,
    Database,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    HardDrive,
    Save,
    Globe,
} from 'lucide-react';
import { SearchDialog } from '@/components/blog/SearchDialog';

interface SnapshotInfo {
    path: string;
    size_bytes: number;
    last_saved_at: string;
    volume: string;
}

interface SearchStatus {
    health: { status: string };
    stats: {
        handler_docs: number;
        uptime_seconds: number;
        languages: Record<string, number>;
        snapshot_path: string;
        snapshot: SnapshotInfo | null;
    };
    fetchedAt: string;
    error?: string;
    details?: string;
}

export default function AdminSearchPage() {
    const [data, setData] = useState<SearchStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [reindexing, startReindex] = useTransition();
    const [reindexResult, setReindexResult] = useState<{ ok: boolean; message: string } | null>(null);

    async function fetchStatus() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/observability/search');
            setData(await res.json());
        } finally {
            setLoading(false);
        }
    }

    function handleReindex() {
        startReindex(async () => {
            setReindexResult(null);
            const res = await fetch('/api/admin/observability/search', { method: 'POST' });
            const json = await res.json();
            setReindexResult({
                ok: !!json.ok,
                message: json.ok
                    ? `Reindex complete — ${json.indexed} documents indexed`
                    : (json.error ?? 'Unknown error'),
            });
            setTimeout(fetchStatus, 1500);
        });
    }

    useEffect(() => { fetchStatus(); }, []);

    const isHealthy = data?.health?.status === 'ok';

    return (
        <main className="space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Search Service</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Status and controls for the Go search microservice
                    </p>
                </div>
                <div className="flex gap-2">
                    <SearchDialog />
                    <button
                        onClick={fetchStatus}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>

                    <button
                        onClick={handleReindex}
                        disabled={reindexing}
                        className="bg-primary/80 hover:bg-primary/90 dark:bg-primary/20 dark:hover:bg-primary/30 flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-black dark:text-white transition-colors"
                    >
                        <Database className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {reindexing ? 'Reindexing…' : 'Reindex now'}
                    </button>
                </div>
            </div>

            {/* Reindex feedback */}
            {reindexResult && (
                <div className={`rounded-lg border px-4 py-3 text-sm ${reindexResult.ok
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                    {reindexResult.message}
                </div>
            )}

            {/* Error state */}
            {data?.error ? (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-900/20">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                    <div>
                        <p className="font-medium text-red-700 dark:text-red-400">Service unreachable</p>
                        {data.details && (
                            <p className="mt-0.5 text-sm text-red-600 dark:text-red-300">{data.details}</p>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Stat cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {/* Status */}
                        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="mb-3 flex items-start justify-between">
                                <p className="text-xs font-medium text-muted-foreground">Status</p>
                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isHealthy ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
                                    }`}>
                                    {isHealthy
                                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                </div>
                            </div>
                            <p className="text-2xl font-bold capitalize text-foreground">
                                {data?.health?.status ?? '—'}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">current health</p>
                        </div>

                        {/* Indexed documents */}
                        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="mb-3 flex items-start justify-between">
                                <p className="text-xs font-medium text-muted-foreground">Indexed documents</p>
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                    <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-foreground">
                                {data?.stats?.handler_docs?.toLocaleString() ?? '—'}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">across all locales</p>
                        </div>

                        {/* Uptime */}
                        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="mb-3 flex items-start justify-between">
                                <p className="text-xs font-medium text-muted-foreground">Uptime</p>
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
                                    <Activity className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-foreground">
                                {data?.stats?.uptime_seconds != null
                                    ? formatUptime(data.stats.uptime_seconds)
                                    : '—'}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">since last restart</p>
                        </div>

                        {/* Snapshot size */}
                        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="mb-3 flex items-start justify-between">
                                <p className="text-xs font-medium text-muted-foreground">Snapshot size</p>
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                    <HardDrive className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-foreground">
                                {data?.stats?.snapshot?.size_bytes != null
                                    ? formatBytes(data.stats.snapshot.size_bytes)
                                    : '—'}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">on disk</p>
                        </div>
                    </div>

                    {/* Language breakdown */}
                    {data?.stats?.languages && Object.keys(data.stats.languages).length > 0 && (
                        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <h2 className="text-sm font-semibold text-foreground">Documents by locale</h2>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                {Object.entries(data.stats.languages).map(([lang, count]) => (
                                    <div key={lang} className="flex items-center gap-2">
                                        <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-bold text-foreground">
                                            {lang.toUpperCase()}
                                        </span>
                                        <span className="text-sm text-muted-foreground">{count} docs</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Snapshot persistence */}
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <Save className="h-4 w-4 text-muted-foreground" />
                            <h2 className="text-sm font-semibold text-foreground">Snapshot persistence</h2>
                        </div>
                        {data?.stats?.snapshot ? (
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 font-mono text-xs text-foreground">
                                        <HardDrive className="h-3 w-3" />
                                        {data.stats.snapshot.volume}
                                    </span>
                                    <span className="font-mono text-xs text-muted-foreground">
                                        {data.stats.snapshot.path}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Last saved {formatTimeAgo(data.stats.snapshot.last_saved_at)}
                                    {' · '}
                                    {formatBytes(data.stats.snapshot.size_bytes)}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No snapshot yet — will be created after the first reindex.
                            </p>
                        )}
                    </div>
                </>
            )}

            {data && !data.error && (
                <p className="text-right text-xs text-muted-foreground">
                    Fetched at {new Date(data.fetchedAt).toLocaleTimeString()}
                </p>
            )}
        </main>
    );
}

function formatUptime(seconds: number) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function formatTimeAgo(isoString: string) {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
}