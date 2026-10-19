// app/api/presence/contributions/route.ts
// Public route, no authentication: the contribution calendar is already public
// on the GitHub profile, and private work only appears as anonymous counts.

import { NextResponse } from 'next/server';

import { getContributionCalendar } from '@/lib/presence/contributions';

export const dynamic = 'force-dynamic';

/**
 * Kept apart from /api/presence on purpose. That route is polled every minute
 * by the "Agora" strip and answers in a few hundred bytes; this one is a year
 * of days (~10 KB) that changes hourly at most, and is only fetched once, by
 * the heat map in the blog call-out card further down the page.
 *
 * A failure answers 503 with no body to render: the section hides itself
 * rather than drawing an empty year (see lib/presence/contributions.ts).
 */
export async function GET() {
    try {
        const calendar = await getContributionCalendar();
        return NextResponse.json(calendar, {
            headers: {
                'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
            },
        });
    } catch (error) {
        console.error('[contributions]', error instanceof Error ? error.message : error);
        return NextResponse.json(null, { status: 503 });
    }
}
