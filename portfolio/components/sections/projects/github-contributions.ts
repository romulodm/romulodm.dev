const GITHUB_TOKEN = process.env.NEXT_GITHUB_TOKEN;
const GRAPHQL_URL = 'https://api.github.com/graphql';

const headers: HeadersInit = {
  'Content-Type': 'application/json',
  ...(GITHUB_TOKEN && { Authorization: `Bearer ${GITHUB_TOKEN}` }),
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContributionDay {
  date: string;
  contributionCount: number;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface GitHubContributionData {
  username: string;
  avatarUrl: string;
  totalContributions: number;
  yearTotal: number;
  weeks: ContributionWeek[];
  followers: number;
  totalForks: number;
  totalStars: number;
}

// ─── GraphQL Query ────────────────────────────────────────────────────────────

const CONTRIBUTIONS_QUERY = `
  query($username: String!) {
    user(login: $username) {
      avatarUrl
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
        restrictedContributionsCount
      }
      repositoriesContributedTo(first: 1) {
        totalCount
      }
      followers {
        totalCount
      }
      repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC) {
        nodes {
          forkCount
          stargazerCount
        }
      }
    }
  }
`;

// ─── Fetcher ──────────────────────────────────────────────────────────────────

export async function getGitHubContributions(
  username: string
): Promise<GitHubContributionData> {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: CONTRIBUTIONS_QUERY,
      variables: { username },
    }),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL API error: ${response.status}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(`GitHub GraphQL error: ${json.errors[0]?.message}`);
  }

  const user = json.data.user;
  const calendar = user.contributionsCollection.contributionCalendar;

  const totalForks: number = user.repositories.nodes.reduce(
    (acc: number, repo: { forkCount: number }) => acc + repo.forkCount,
    0
  );

  const totalStars: number = user.repositories.nodes.reduce(
    (acc: number, repo: { stargazerCount: number }) => acc + repo.stargazerCount,
    0
  );

  // yearTotal: soma dos últimos 52 weeks completas
  const yearTotal = calendar.weeks
    .flatMap((w: ContributionWeek) => w.contributionDays)
    .reduce((acc: number, d: ContributionDay) => acc + d.contributionCount, 0);

  return {
    username,
    avatarUrl: user.avatarUrl,
    totalContributions: calendar.totalContributions,
    yearTotal,
    weeks: calendar.weeks,
    followers: user.followers.totalCount,
    totalForks,
    totalStars,
  };
}