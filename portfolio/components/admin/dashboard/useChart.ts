// components/admin/dashboard/useChart.ts
'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';

let loader: Promise<any> | null = null;

function loadChartJs(): Promise<any> {
    if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
    const existing = (window as any).Chart;
    if (existing) return Promise.resolve(existing);
    if (loader) return loader;

    loader = new Promise((resolve, reject) => {
        const prior = document.querySelector<HTMLScriptElement>(`script[src="${CDN}"]`);
        const script = prior ?? document.createElement('script');
        script.addEventListener('load', () => resolve((window as any).Chart));
        script.addEventListener('error', () => reject(new Error('Chart.js failed to load')));
        if (!prior) {
            script.src = CDN;
            script.async = true;
            document.head.appendChild(script);
        }
    });
    return loader;
}

/** Paleta derivada do tema resolvido do next-themes, não de prefers-color-scheme. */
export interface ChartTheme {
    isDark: boolean;
    grid: string;
    tick: string;
    tooltipBg: string;
    tooltipText: string;
    tooltipBorder: string;
}

export function chartTheme(isDark: boolean): ChartTheme {
    return {
        isDark,
        grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        tick: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
        tooltipBg: isDark ? 'rgba(20,20,22,0.95)' : 'rgba(255,255,255,0.98)',
        tooltipText: isDark ? '#e7e7e9' : '#18181b',
        tooltipBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    };
}

export const CHART_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

/**
 * Monta/remonta um gráfico Chart.js. Recria quando os dados ou o tema mudam,
 * garantindo que o toggle claro/escuro recolora os eixos.
 */
export function useChart<T extends HTMLCanvasElement>(
    build: (Chart: any, canvas: T, theme: ChartTheme) => any,
    deps: unknown[],
) {
    const canvasRef = useRef<T>(null);
    const instance = useRef<any>(null);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        let cancelled = false;
        const isDark = resolvedTheme === 'dark';

        loadChartJs()
            .then((Chart) => {
                if (cancelled || !canvasRef.current) return;
                if (instance.current) {
                    instance.current.destroy();
                    instance.current = null;
                }
                instance.current = build(Chart, canvasRef.current, chartTheme(isDark));
            })
            .catch(() => { /* gráfico degrada para área vazia */ });

        return () => {
            cancelled = true;
            if (instance.current) {
                instance.current.destroy();
                instance.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, resolvedTheme]);

    return canvasRef;
}

/** Opções compartilhadas: tooltip consistente, sem legenda nativa. */
export function baseOptions(theme: ChartTheme) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: theme.tooltipBg,
                titleColor: theme.tooltipText,
                bodyColor: theme.tooltipText,
                borderColor: theme.tooltipBorder,
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                displayColors: true,
                boxWidth: 8,
                boxHeight: 8,
                usePointStyle: true,
            },
        },
    };
}
