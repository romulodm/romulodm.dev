import 'server-only';

import { cached } from '@/lib/status-cache';

/**
 * The contribution calendar from the GitHub profile, one entry per day for the
 * last year, as drawn by the heat map in the blog call-out card.
 *
 * `contributionCalendar` is the profile graph itself, so the numbers match
 * what github.com/romulodm shows: commits, pull requests, issues and reviews,
 * plus private work counted anonymously when the profile is set to include it.
 * Private counts are only returned to their owner, which is why this needs
 * NEXT_GITHUB_TOKEN to belong to this user (the same requirement as the weekly
 * count in ./github.ts). Without a token this throws and the section stays
 * hidden: an empty year would read as a year of doing nothing.
 *
 * The calendar moves once a day at most for any one cell, so an hour of cache
 * is plenty, and GraphQL charges one point per query against 5,000 an hour.
 */

const GRAPHQL = 'https://api.github.com/graphql';
const USER = 'romulodm';

export type ContributionCalendar = {
    total: number;
    /** Oldest first, every day of the range, zeros included. */
    days: { date: string; count: number }[];
};

type CalendarResponse = {
    data?: {
        user?: {
            contributionsCollection?: {
                contributionCalendar?: {
                    totalContributions: number;
                    weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
                };
            };
        };
    };
    errors?: { message: string }[];
};

async function read(): Promise<ContributionCalendar> {
    const token = process.env.NEXT_GITHUB_TOKEN;
    if (!token) throw new Error('NEXT_GITHUB_TOKEN is not set');

    // No `from`/`to`: the default range is the year ending today, which is
    // exactly the window the profile graph and the component show.
    const response = await fetch(GRAPHQL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: `query($login:String!){
                user(login:$login){
                    contributionsCollection{
                        contributionCalendar{
                            totalContributions
                            weeks{ contributionDays{ date contributionCount } }
                        }
                    }
                }
            }`,
            variables: { login: USER },
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error(`GitHub GraphQL failed: ${response.status}`);

    const payload = (await response.json()) as CalendarResponse;

    // GraphQL answers 200 with an `errors` array; without this check a bad
    // scope would cache an empty year for an hour.
    if (payload.errors?.length) throw new Error(`GitHub GraphQL: ${payload.errors[0].message}`);

    const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar;
    if (!calendar) throw new Error('GitHub GraphQL returned no contribution calendar');

    return {
        total: calendar.totalContributions,
        days: calendar.weeks.flatMap((week) =>
            week.contributionDays.map((day) => ({ date: day.date, count: day.contributionCount })),
        ),
    };
}

export async function getContributionCalendar(): Promise<ContributionCalendar> {
    const { data } = await cached<ContributionCalendar>(
        { key: 'presence:github:calendar:v1', ttlSeconds: 3600, staleSeconds: 6 * 3600 },
        read,
    );
    return data;
}
