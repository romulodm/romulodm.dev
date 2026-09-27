// app/api/presence/route.ts
// Public route, no authentication: everything it returns is already public
// (what is playing, public commits, a status Romulo chose to publish, and a
// visitor count with no breakdown).

import { NextResponse } from 'next/server';

import { getCommitActivity } from '@/lib/presence/github';
import { getNowPlaying } from '@/lib/presence/spotify';
import { getStatus } from '@/lib/presence/status';
import { getActiveVisitors } from '@/lib/presence/visitors';

export const dynamic = 'force-dynamic';

/**
 * Each source fails on its own.
 *
 * Four independent third parties feed this card strip, and any of them can be
 * down, rate limited or missing an env var. `Promise.all` would turn one
 * missing Spotify token into an empty strip, so every source is settled
 * separately and a failure becomes `null` — the cell hides itself and the other
 * three keep working. The failure is logged, because a card that quietly stops
 * updating is otherwise invisible.
 */
async function settle<T>(name: string, promise: Promise<T>): Promise<T | null> {
    try {
        return await promise;
    } catch (error) {
        console.error(`[presence] ${name}:`, error instanceof Error ? error.message : error);
        return null;
    }
}

export async function GET() {
    const [status, music, commits, visitors] = await Promise.all([
        settle('status', getStatus()),
        settle('spotify', getNowPlaying()),
        settle('github', getCommitActivity()),
        settle('ga4', getActiveVisitors()),
    ]);

    return NextResponse.json(
        // `now` is the server clock at the moment of the answer. The page
        // subtracts it from its own clock to correct the skew before ageing
        // the Spotify reading — a browser running a few minutes off would
        // otherwise show a progress bar at the wrong place, or at the end.
        { now: new Date().toISOString(), status, music, commits, visitors },
        {
            headers: {
                // The upstream calls are already cached in-process; this only
                // stops a proxy from serving a minute-old body as if it were new.
                'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=120',
            },
        },
    );
}
