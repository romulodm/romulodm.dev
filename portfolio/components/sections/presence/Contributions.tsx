'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import ContributionHeatmap, {
    type ContributionDay,
    type HeatmapLabels,
} from '@/components/ui/contribution-heatmap';

/**
 * A year of GitHub contributions, the top half of the blog call-out card
 * (see ActivityCallout.tsx).
 *
 * Fetched client-side for the same reason as the "Agora" strip: the home page
 * is statically rendered with a five-minute revalidate, and an upstream fetch
 * during that render would either freeze the calendar into the build or make
 * the whole page dynamic.
 *
 * Nothing renders until real data arrives, and nothing renders if it never
 * does: the card then is just the blog call-out, as it was before the heat map
 * joined it. A missing calendar is not something the visitor caused or can
 * fix, so there is no error copy either.
 */

type Calendar = { total: number; days: ContributionDay[] };

/** The heat map formats numbers and dates with Intl, which wants a region. */
const INTL_LOCALE: Record<string, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };

export default function Contributions() {
    const t = useTranslations('home.contributions');
    const locale = useLocale();
    const [calendar, setCalendar] = useState<Calendar | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        fetch('/api/presence/contributions', { signal: controller.signal })
            .then((response) => (response.ok ? (response.json() as Promise<Calendar | null>) : null))
            .then((payload) => {
                if (payload?.days?.length) setCalendar(payload);
            })
            .catch(() => {
                // Offline or aborted on unmount: the heat map simply stays out.
            });

        return () => controller.abort();
    }, []);

    // Plural rules live in the messages (ICU), so Portuguese gets
    // "contribuição/contribuições" instead of an English `unit + "s"`.
    const labels = useMemo<HeatmapLabels>(
        () => ({
            unit: (count) => t('unit', { count }),
            amount: (count) => t('amount', { count }),
            onDate: (date) => t('onDate', { date }),
            days: (count) => t('days', { count }),
            yearTotal: t('yearTotal'),
            busiestDay: t('busiestDay'),
            longestStreak: t('longestStreak'),
            currentStreak: t('currentStreak'),
            chart: (amount, range) => t('chart', { amount, range }),
            less: t('less'),
            more: t('more'),
            levels: t.raw('levels') as HeatmapLabels['levels'],
        }),
        [t],
    );

    if (!calendar) return null;

    return (
        <div
            aria-label={t('section')}
            role="group"
            // The page background, as the heat map had before it joined the
            // card; the blog call-out below keeps the card colour. The card's
            // overflow-hidden rounds these corners to match its border.
            className="border-b border-[#e5e7eb] bg-background p-5 sm:p-7 dark:border-[#2f3031]"
        >
            <ContributionHeatmap
                data={calendar.days}
                locale={INTL_LOCALE[locale] ?? 'en-US'}
                labels={labels}
            />
        </div>
    );
}
