// components/admin/dashboard/AlertsPanel.tsx
'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
    ShieldCheck, AlertOctagon, AlertTriangle, Info, ChevronRight,
} from 'lucide-react';
import { Panel } from './primitives';
import type { Alert, Severity } from './types';

const SEVERITY_STYLE: Record<Severity, { icon: React.ComponentType<{ className?: string }>; dot: string; text: string; bg: string }> = {
    critical: {
        icon: AlertOctagon,
        dot: 'bg-red-500',
        text: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-500/5 hover:bg-red-500/10',
    },
    warning: {
        icon: AlertTriangle,
        dot: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-500',
        bg: 'bg-amber-500/5 hover:bg-amber-500/10',
    },
    info: {
        icon: Info,
        dot: 'bg-sky-500',
        text: 'text-sky-600 dark:text-sky-400',
        bg: 'hover:bg-muted/50',
    },
};

/**
 * Consolida tudo que exige ação numa fila única ordenada por severidade.
 * Substitui os cards isolados de "suspeitos", "pending >24h" etc., que
 * ocupavam espaço mesmo valendo zero.
 */
export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
    const t = useTranslations('admin.dashboard.alerts');

    const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
    const warningCount = alerts.filter((a) => a.severity === 'warning').length;

    const subtitle = alerts.length === 0
        ? t('allClearSubtitle')
        : t('summary', { critical: criticalCount, warning: warningCount });

    return (
        <Panel
            title={t('title')}
            subtitle={subtitle}
            icon={alerts.length === 0 ? ShieldCheck : AlertTriangle}
            flush
            className="h-full"
        >
            {alerts.length === 0 ? (
                <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 px-5 pb-5 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{t('allClear')}</p>
                    <p className="max-w-[240px] text-xs text-muted-foreground">{t('allClearHint')}</p>
                </div>
            ) : (
                <ul className="divide-y divide-border border-t border-border">
                    {alerts.map((alert) => {
                        const style = SEVERITY_STYLE[alert.severity];
                        const Icon = style.icon;

                        const label = t(`kinds.${alert.kind}.label`, { count: alert.count });
                        const hint = t(`kinds.${alert.kind}.hint`, {
                            count: alert.count,
                            ...(alert.meta ?? {}),
                        });

                        const inner = (
                            <div className={`flex items-start gap-3 px-5 py-3 transition-colors ${style.bg}`}>
                                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.text}`} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground">{label}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
                                </div>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${style.text} bg-current/10`}>
                                    {alert.count}
                                </span>
                                {alert.href && (
                                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                                )}
                            </div>
                        );

                        return (
                            <li key={alert.id}>
                                {alert.href
                                    ? <Link href={alert.href} className="block">{inner}</Link>
                                    : inner}
                            </li>
                        );
                    })}
                </ul>
            )}
        </Panel>
    );
}
