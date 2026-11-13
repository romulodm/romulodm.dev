// app/api/github/stars/route.ts
// Public route, no authentication: a repository's star count is public.

import { NextResponse } from 'next/server';

/**
 * The footer's Star button used to call api.github.com straight from the
 * browser. Unauthenticated, that API allows 60 requests per hour per IP, so
 * shared addresses (offices, carriers, the PageSpeed Insights runners) got a
 * 403 that was logged to the console on every page, and each visitor paid for
 * a cross-origin request to show one number.
 *
 * The server asks once, with the token when there is one, and the CDN keeps
 * the answer for an hour. The repository is fixed on purpose: taking it from
 * the query string would turn this into an open proxy for GitHub's API.
 */
const REPO = 'romulodm/romulodm.dev';

export const revalidate = 3600;

export async function GET() {
    const token = process.env.NEXT_GITHUB_TOKEN;

    try {
        const response = await fetch(`https://api.github.com/repos/${REPO}`, {
            headers: {
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            next: { revalidate: 3600 },
            signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new Error(`GitHub repo lookup failed: ${response.status}`);

        const data = (await response.json()) as { stargazers_count?: unknown };
        if (typeof data.stargazers_count !== 'number') throw new Error('GitHub repo lookup: no stargazers_count');

        return NextResponse.json(
            { stars: data.stargazers_count },
            { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' } },
        );
    } catch (error) {
        console.error('[github-stars]', error instanceof Error ? error.message : error);
        return NextResponse.json(null, { status: 503 });
    }
}
