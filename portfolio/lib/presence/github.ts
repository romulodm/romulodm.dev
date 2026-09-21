import 'server-only';

import { cached } from '@/lib/status-cache';

/**
 * Public commit activity across every repository, not just this one.
 *
 * The events API used to carry commit messages in the push payload, which was
 * the usual way to build this. GitHub removed that field in 2025, so the only
 * endpoint that still answers "the latest public commit by this user, anywhere"
 * is the commit search. It also answers the weekly count for free, in
 * `total_count`, with no pagination.
 *
 * Search is rate limited far more tightly than the rest of the API (30
 * requests/minute authenticated, 10 unauthenticated), which is why the result
 * is cached for ten minutes and both queries share one refresh.
 */

const SEARCH = 'https://api.github.com/search/commits';
const GRAPHQL = 'https://api.github.com/graphql';
const USER = 'romulodm';

/**
 * `is:public` is not decoration: commit search returns everything the token can
 * see, and NEXT_GITHUB_TOKEN can see private repositories. Without this
 * qualifier a private repository's name and commit message would end up on the
 * home page of a public site.
 *
 * It applies to the latest commit only. The weekly count is a single number
 * with no repository name and no message attached, so it covers private work
 * too — otherwise a week spent inside a private repository would read as a week
 * of doing nothing.
 */
const PUBLIC_ONLY = 'is:public';

const WINDOW_DAYS = 7;

export type CommitActivity = {
    latest: {
        message: string;
        url: string;
        /** owner/repo, as shown under the message. */
        repository: string;
        date: string;
    } | null;
    /** Commits authored in the last WINDOW_DAYS days, public and private. */
    countLastWeek: number;
    windowDays: number;
};

type SearchResponse = {
    total_count: number;
    items: {
        html_url: string;
        commit: { message: string; author: { date: string } };
        repository: { full_name: string };
    }[];
};

async function search(query: string): Promise<SearchResponse> {
    const token = process.env.NEXT_GITHUB_TOKEN;

    const response = await fetch(
        `${SEARCH}?q=${encodeURIComponent(query)}&sort=author-date&order=desc&per_page=1`,
        {
            headers: {
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: 'no-store',
            signal: AbortSignal.timeout(8000),
        },
    );

    if (!response.ok) {
        throw new Error(`GitHub commit search failed: ${response.status}`);
    }

    return (await response.json()) as SearchResponse;
}

function isoDaysAgo(days: number): string {
    return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Commits in the window, taken from the same place the profile graph is drawn
 * from.
 *
 * The commit search cannot answer this well. It only indexes the default
 * branch, skips forks, takes minutes to index a fresh push, and only reaches
 * private repositories when the token carries the right scope — which is how a
 * day with three squares on the graph showed up here as two commits.
 * `contributionsCollection` is that graph: `totalCommitContributions` is the
 * visible part and `restrictedContributionsCount` is the private work the graph
 * shows anonymously, so the sum is the number on the profile.
 *
 * It needs a token owned by this user with `read:user` (classic) or read access
 * to the profile (fine-grained): private counts are only ever returned to their
 * owner. Without that this throws and the caller falls back to the search count.
 */
async function countContributions(fromIso: string, toIso: string): Promise<number> {
    const token = process.env.NEXT_GITHUB_TOKEN;
    if (!token) throw new Error('NEXT_GITHUB_TOKEN is not set');

    const response = await fetch(GRAPHQL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: `query($login:String!,$from:DateTime!,$to:DateTime!){
                user(login:$login){
                    contributionsCollection(from:$from,to:$to){
                        totalCommitContributions
                        restrictedContributionsCount
                    }
                }
            }`,
            variables: { login: USER, from: fromIso, to: toIso },
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error(`GitHub GraphQL failed: ${response.status}`);

    const payload = (await response.json()) as {
        data?: {
            user?: {
                contributionsCollection?: {
                    totalCommitContributions: number;
                    restrictedContributionsCount: number;
                };
            };
        };
        errors?: { message: string }[];
    };

    // GraphQL answers 200 with an `errors` array; without this check a bad
    // scope would read as zero commits.
    if (payload.errors?.length) throw new Error(`GitHub GraphQL: ${payload.errors[0].message}`);

    const collection = payload.data?.user?.contributionsCollection;
    if (!collection) throw new Error('GitHub GraphQL returned no contributions');

    return collection.totalCommitContributions + collection.restrictedContributionsCount;
}

async function read(): Promise<CommitActivity> {
    const [latest, week] = await Promise.all([
        search(`author:${USER} ${PUBLIC_ONLY}`),
        // Fallback only, for when the GraphQL query below cannot run. It
        // undercounts, but a low number beats an empty cell.
        search(`author:${USER} author-date:>=${isoDaysAgo(WINDOW_DAYS)}`).catch(() => null),
    ]);

    const countLastWeek = await countContributions(
        new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString(),
        new Date().toISOString(),
    ).catch((error: Error) => {
        console.warn('[github] contributions query failed, using search count:', error.message);
        return week?.total_count ?? 0;
    });

    const item = latest.items?.[0];

    return {
        latest: item
            ? {
                  // Only the summary line: commit bodies can be paragraphs long
                  // and the card is a single line.
                  message: item.commit.message.split('\n')[0],
                  url: item.html_url,
                  repository: item.repository.full_name,
                  date: item.commit.author.date,
              }
            : null,
        countLastWeek,
        windowDays: WINDOW_DAYS,
    };
}

export async function getCommitActivity(): Promise<CommitActivity> {
    const { data } = await cached<CommitActivity>(
        { key: 'presence:github', ttlSeconds: 600, staleSeconds: 3600 },
        read,
    );
    return data;
}
