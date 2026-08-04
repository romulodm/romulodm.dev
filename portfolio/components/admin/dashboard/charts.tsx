// components/admin/dashboard/charts.tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useChart, baseOptions, CHART_COLORS } from './useChart';
import { bucketLabel, monthLabel, fmtCompact, fmtCurrency } from './format';
import type { Bucket, EngagementPoint, AudiencePoint, MonthStat, TagPerformance } from './types';

// ─── Engajamento por data do evento

export function EngagementChart({ data, bucket }: { data: EngagementPoint[]; bucket: Bucket }) {
    const locale = useLocale();
    const t = useTranslations('admin.dashboard.charts');

    const ref = useChart<HTMLCanvasElement>((Chart, canvas, theme) => {
        const labels = data.map((d) => bucketLabel(d.bucket, bucket, locale));
        const ctx = canvas.getContext('2d');

        const likeFill = ctx?.createLinearGradient(0, 0, 0, 180);
        likeFill?.addColorStop(0, 'rgba(244,63,94,0.28)');
        likeFill?.addColorStop(1, 'rgba(244,63,94,0)');

        const commentFill = ctx?.createLinearGradient(0, 0, 0, 180);
        commentFill?.addColorStop(0, 'rgba(139,92,246,0.24)');
        commentFill?.addColorStop(1, 'rgba(139,92,246,0)');

        return new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: t('likes'),
                        data: data.map((d) => d.likes),
                        borderColor: '#f43f5e',
                        backgroundColor: likeFill ?? 'rgba(244,63,94,0.15)',
                        borderWidth: 2, fill: true, tension: 0.35,
                        pointRadius: 0, pointHoverRadius: 4, pointHoverBorderWidth: 2,
                    },
                    {
                        label: t('comments'),
                        data: data.map((d) => d.comments),
                        borderColor: '#8b5cf6',
                        backgroundColor: commentFill ?? 'rgba(139,92,246,0.12)',
                        borderWidth: 2, fill: true, tension: 0.35,
                        pointRadius: 0, pointHoverRadius: 4, pointHoverBorderWidth: 2,
                    },
                ],
            },
            options: {
                ...baseOptions(theme),
                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: { color: theme.tick, font: { size: 10 }, maxTicksLimit: 8, maxRotation: 0 },
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: theme.grid },
                        border: { display: false },
                        ticks: {
                            color: theme.tick, font: { size: 10 }, precision: 0, maxTicksLimit: 5,
                            callback: (v: number) => fmtCompact(v, locale),
                        },
                    },
                },
            },
        });
    }, [data, bucket, locale]);

    return (
        <div className="relative h-[200px] w-full">
            <canvas ref={ref} role="img" aria-label={t('engagementAria')} />
        </div>
    );
}

// ─── Audiência: novos usuários vs doações (eixo duplo)

export function AudienceChart({ data, bucket }: { data: AudiencePoint[]; bucket: Bucket }) {
    const locale = useLocale();
    const t = useTranslations('admin.dashboard.charts');

    const ref = useChart<HTMLCanvasElement>((Chart, canvas, theme) => new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.map((d) => bucketLabel(d.bucket, bucket, locale)),
            datasets: [
                {
                    label: t('newUsers'),
                    data: data.map((d) => d.users),
                    backgroundColor: '#3b82f6',
                    borderRadius: 4, barPercentage: 0.6, categoryPercentage: 0.7,
                    yAxisID: 'y',
                    order: 2,
                },
                {
                    label: t('donations'),
                    type: 'line',
                    data: data.map((d) => d.donationsBrl / 100),
                    borderColor: '#10b981',
                    backgroundColor: '#10b981',
                    borderWidth: 2, tension: 0.35,
                    pointRadius: 0, pointHoverRadius: 4,
                    yAxisID: 'y1',
                    order: 1,
                },
            ],
        },
        options: {
            ...baseOptions(theme),
            plugins: {
                ...baseOptions(theme).plugins,
                tooltip: {
                    ...baseOptions(theme).plugins.tooltip,
                    callbacks: {
                        label: (c: any) => c.dataset.yAxisID === 'y1'
                            ? ` ${c.dataset.label}: ${fmtCurrency(c.raw * 100, locale)}`
                            : ` ${c.dataset.label}: ${c.raw}`,
                    },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { color: theme.tick, font: { size: 10 }, maxTicksLimit: 8, maxRotation: 0 },
                },
                y: {
                    beginAtZero: true, position: 'left',
                    grid: { color: theme.grid }, border: { display: false },
                    ticks: { color: theme.tick, font: { size: 10 }, precision: 0, maxTicksLimit: 5 },
                },
                y1: {
                    beginAtZero: true, position: 'right',
                    grid: { display: false }, border: { display: false },
                    ticks: {
                        color: theme.tick, font: { size: 10 }, maxTicksLimit: 5,
                        callback: (v: number) => fmtCompact(v, locale),
                    },
                },
            },
        },
    }), [data, bucket, locale]);

    return (
        <div className="relative h-[200px] w-full">
            <canvas ref={ref} role="img" aria-label={t('audienceAria')} />
        </div>
    );
}

// ─── Histórico mensal: views com posts publicados no eixo secundário
export function MonthlyChart({ data }: { data: MonthStat[] }) {
    const locale = useLocale();
    const t = useTranslations('admin.dashboard.charts');

    const ref = useChart<HTMLCanvasElement>((Chart, canvas, theme) => new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.map((d) => monthLabel(d.month, locale)),
            datasets: [
                {
                    label: t('views'),
                    data: data.map((d) => d.views),
                    backgroundColor: '#3b82f6',
                    borderRadius: 4, barPercentage: 0.65, categoryPercentage: 0.8,
                    yAxisID: 'y',
                    order: 2,
                },
                {
                    // Views e comentários em escalas iguais escondiam os comentários;
                    // volume de posts no eixo direito conta a história melhor.
                    label: t('postsPublished'),
                    type: 'line',
                    data: data.map((d) => d.posts),
                    borderColor: '#f59e0b',
                    backgroundColor: '#f59e0b',
                    borderWidth: 2, borderDash: [4, 3], tension: 0.3,
                    pointRadius: 2, pointHoverRadius: 4,
                    yAxisID: 'y1',
                    order: 1,
                },
            ],
        },
        options: {
            ...baseOptions(theme),
            scales: {
                x: {
                    grid: { display: false }, border: { display: false },
                    ticks: { color: theme.tick, font: { size: 10 }, maxRotation: 0 },
                },
                y: {
                    beginAtZero: true, position: 'left',
                    grid: { color: theme.grid }, border: { display: false },
                    ticks: {
                        color: theme.tick, font: { size: 10 }, maxTicksLimit: 5,
                        callback: (v: number) => fmtCompact(v, locale),
                    },
                },
                y1: {
                    beginAtZero: true, position: 'right',
                    grid: { display: false }, border: { display: false },
                    ticks: { color: theme.tick, font: { size: 10 }, precision: 0, maxTicksLimit: 4 },
                },
            },
        },
    }), [data, locale]);

    return (
        <div className="relative h-[220px] w-full">
            <canvas ref={ref} role="img" aria-label={t('monthlyAria')} />
        </div>
    );
}

// ─── Distribuição por tag 
export function TagDonut({ data }: { data: TagPerformance[] }) {
    const locale = useLocale();
    const t = useTranslations('admin.dashboard.charts');

    const ref = useChart<HTMLCanvasElement>((Chart, canvas, theme) => new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: data.map((d) => d.tag),
            datasets: [{
                data: data.map((d) => d.views),
                backgroundColor: CHART_COLORS,
                borderWidth: 0,
                hoverOffset: 6,
            }],
        },
        options: {
            ...baseOptions(theme),
            cutout: '70%',
            plugins: {
                ...baseOptions(theme).plugins,
                tooltip: {
                    ...baseOptions(theme).plugins.tooltip,
                    callbacks: {
                        label: (c: any) => ` ${c.label}: ${fmtCompact(c.raw, locale)} ${t('views').toLowerCase()}`,
                    },
                },
            },
        },
    }), [data, locale]);

    return (
        <div className="relative h-[150px] w-[150px] shrink-0">
            <canvas ref={ref} role="img" aria-label={t('tagAria')} />
        </div>
    );
}
