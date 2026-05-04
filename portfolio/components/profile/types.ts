// components/profile/types.ts

export type Profile = {
    id: string;
    username: string;
    email: string;
    banned: boolean;
    image: string | null;
    createdAt: string | Date;
    githubUrl: string | null;
    linkedinUrl: string | null;
    provider: string;
    _count: { comments: number };
};

export type NewsletterSub = {
    isConfirmed: boolean;
    subscribedAt: string | null;
    preferredLocale: string;
    unsubscribedAt: string | null;
} | null;

export type LinkedDonation = {
    id: string;
    coffees: number;
    amount: number;
    currency: string;
    message: string | null;
    isPrivate: boolean;
    createdAt: Date;
    provider: string;
};

export type WallMessageItem = {
    id: string;
    message: string;
    theme: number;
    createdAt: Date;
};

export type CommentItem = {
    id: string;
    bodyMd: string;
    createdAt: Date;
    post: { slug: string; translations: { title: string }[] };
    parent?: { id: string; bodyMd: string; author: { username: string } } | null;
};

export type Tab =
    | "profile"
    | "comments"
    | "wall"
    | "newsletter"
    | "settings"
    | "donations";