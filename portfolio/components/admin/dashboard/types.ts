// components/admin/dashboard/types.ts

export type Period = '7d' | '30d' | '90d' | '12m';
export type Bucket = 'day' | 'week' | 'month';
export type Severity = 'critical' | 'warning' | 'info';

export interface Delta {
    current: number;
    previous: number;
    growth: number | null;
}

export interface MonthStat {
    month: string;
    views: number;
    posts: number;
    comments: number;
    likes: number;
}

export interface EngagementPoint {
    bucket: string;
    likes: number;
    comments: number;
}

export interface AudiencePoint {
    bucket: string;
    users: number;
    donationsBrl: number;
}

export interface TopPost {
    id: string;
    slug: string;
    title: string;
    views: number;
    likes: number;
    commentsCount: number;
    publishedAt: string | null;
    readingTime: number;
    engagementRate: number;
    locales: string[];
    tag: string | null;
}

export interface TagPerformance {
    tag: string;
    posts: number;
    views: number;
    likes: number;
    comments: number;
    avgViews: number;
}

export interface Alert {
    id: string;
    kind: string;
    severity: Severity;
    count: number;
    meta?: Record<string, string | number | null>;
    href: string | null;
}

export interface RecentComment {
    id: string;
    excerpt: string;
    score: number;
    createdAt: string;
    edited: boolean;
    author: { id: string; username: string; image: string | null; banned: boolean };
    postSlug: string;
    postTitle: string;
}

export interface Donation {
    id: string;
    name: string | null;
    amount: number;
    currency: string;
    coffees: number;
    provider: string;
    createdAt: string;
    isPrivate: boolean;
    message?: string | null;
}

export interface DashboardData {
    collectedAt: string;
    period: Period;
    window: { days: number; currentStart: string; previousStart: string };
    bucket: Bucket;

    overview: {
        totalRaisedBrl: number;
        totalSupporters: number;
        avgTicketBrl: number;
        totalViews: number;
        totalLikes: number;
        totalComments: number;
        totalPosts: number;
        totalCommentsAll: number;
    };

    deltas: {
        users: Delta;
        likes: Delta;
        comments: Delta;
        posts: Delta;
        donations: {
            current: { count: number; amountBrl: number };
            previous: { count: number; amountBrl: number };
            countGrowth: number | null;
            amountGrowth: number | null;
        };
        subscribers: {
            gained: number;
            lost: number;
            net: number;
            previousNet: number;
            growth: number | null;
            churnRate: number;
        };
    };

    funnel: {
        views: number;
        likes: number;
        comments: number;
        likeRate: number;
        commentRate: number;
        commentPerLike: number;
    };

    contentHealth: {
        publishedTotal: number;
        translationCoverage: { pt: number; en: number; ptPercent: number; enPercent: number };
        untranslatedPosts: number;
        orphanPosts: number;
        avgReadingTime: number;
        avgViewsPerPost: number;
        publishVelocity: { current: number; previous: number; growth: number | null; perWeek: number };
    };

    alerts: Alert[];

    newsletter: {
        total: number;
        confirmed: number;
        pending: number;
        unsubscribed: number;
        confirmationRate: number;
        globalOpenRate: number;
        campaignsSent: number;
        scheduledCampaigns: number;
        lastCampaign: {
            id: string;
            subject: string;
            sentAt: string;
            sentCount: number;
            openCount: number;
            failedCount: number;
            openRate: number | null;
        } | null;
    };

    moderation: {
        suspiciousUnreviewed: number;
        suspicious72h: number;
        bannedUsers: number;
        recentBans: { id: string; username: string; bannedAt: string | null; banReason: string | null }[];
        recentComments: RecentComment[];
    };

    health: {
        unverifiedUsers: number;
        stalePendingDonations: {
            id: string; name: string | null; amount: number;
            currency: string; provider: string; createdAt: string;
        }[];
        failingCampaigns: {
            id: string; subject: string; sentAt: string | null;
            sentCount: number; failedCount: number; failRate: number;
        }[];
    };

    donations: {
        recent: Donation[];
        top: Donation[];
        providerMix: { provider: string; count: number; amount: number }[];
        repeatDonors: number;
    };

    drafts: { id: string; slug: string; title: string; locales: string[]; updatedAt: string }[];

    highlight: {
        id: string; slug: string; title: string; views: number;
        likes: number; commentsCount: number; publishedAt: string | null;
    } | null;

    charts: {
        monthly: MonthStat[];
        engagement: EngagementPoint[];
        audience: AudiencePoint[];
        topPosts: TopPost[];
        tagPerformance: TagPerformance[];
    };
}
