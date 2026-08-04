// components/admin/dashboard/format.ts

import type { Bucket } from './types';

const LOCALE_TAG: Record<string, string> = { pt: 'pt-BR', en: 'en-US' };

export function localeTag(locale: string) {
    return LOCALE_TAG[locale] ?? 'en-US';
}

/** Centavos → moeda. Valores em BRL são armazenados em centavos. */
export function fmtCurrency(cents: number, locale: string) {
    const tag = localeTag(locale);
    const currency = locale === 'pt' ? 'BRL' : 'BRL';
    return new Intl.NumberFormat(tag, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(cents / 100);
}

export function fmtAmount(amount: number, currency: string, locale: string) {
    if (currency === 'ETH') return `${(amount / 1e18).toFixed(4)} ETH`;
    return fmtCurrency(amount, locale);
}

export function fmtNumber(value: number, locale: string) {
    return new Intl.NumberFormat(localeTag(locale)).format(value);
}

/** 89200 → "89.2K". Para KPIs onde o dígito exato não importa. */
export function fmtCompact(value: number, locale: string) {
    if (Math.abs(value) < 1000) return fmtNumber(value, locale);
    return new Intl.NumberFormat(localeTag(locale), {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}

export function fmtPercent(value: number, locale: string) {
    return `${new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: 1 }).format(value)}%`;
}

/**
 * Distância relativa com granularidade adaptativa — "agora", "12min",
 * "5h", "3d", "2sem". Evita o "0d atrás" para tudo que é recente.
 */
export function timeAgo(iso: string, locale: string): string {
    const rtf = new Intl.RelativeTimeFormat(localeTag(locale), { numeric: 'auto', style: 'short' });
    const diffMs = Date.now() - new Date(iso).getTime();
    const min = Math.round(diffMs / 60000);

    if (min < 1) return locale === 'pt' ? 'agora' : 'just now';
    if (min < 60) return rtf.format(-min, 'minute');

    const hours = Math.round(min / 60);
    if (hours < 24) return rtf.format(-hours, 'hour');

    const days = Math.round(hours / 24);
    if (days < 7) return rtf.format(-days, 'day');

    const weeks = Math.round(days / 7);
    if (weeks < 5) return rtf.format(-weeks, 'week');

    const months = Math.round(days / 30);
    if (months < 12) return rtf.format(-months, 'month');

    return rtf.format(-Math.round(days / 365), 'year');
}

export function fmtDateTime(iso: string, locale: string) {
    return new Date(iso).toLocaleString(localeTag(locale), {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
}

export function fmtTime(iso: string, locale: string) {
    return new Date(iso).toLocaleTimeString(localeTag(locale), {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
}

/** Rótulo curto do eixo X conforme a granularidade da série. */
export function bucketLabel(iso: string, bucket: Bucket, locale: string): string {
    const d = new Date(iso);
    const tag = localeTag(locale);
    if (bucket === 'month') return d.toLocaleDateString(tag, { month: 'short', timeZone: 'UTC' });
    if (bucket === 'week') return d.toLocaleDateString(tag, { day: '2-digit', month: 'short', timeZone: 'UTC' });
    return d.toLocaleDateString(tag, { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}

export function monthLabel(month: string, locale: string) {
    return new Date(`${month}-01T00:00:00Z`).toLocaleDateString(localeTag(locale), {
        month: 'short', timeZone: 'UTC',
    });
}
