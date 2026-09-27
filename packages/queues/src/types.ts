export type TransactionalEmailJob =
    | {
        type: "CONFIRMATION";
        email: string;
        confirmationUrl: string;
        displayName: string;
        locale: string;
    }
    | {
        type: "WELCOME";
        email: string;
        unsubscribeUrl: string;
        displayName: string;
        locale: string;
    }
    | {
        type: "UNSUBSCRIBE_CONFIRM";
        email: string;
        unsubscribeUrl: string;
        displayName: string;
        locale: string;
    }
    | {
        type: "PASSWORD_RESET";
        email: string;
        code: string;
        expiresInMinutes?: number;
        displayName: string;
        locale: string;
    };

export interface CampaignEmailJob {
    campaignType: "POST_BASED" | "CUSTOM" | "DIGEST";
    postId: string | null;
    postIds?: string[];
    campaignId: string;
    recipientId: string;
    trackingId: string;
    email: string;
    subject: string;
    content: string;
    unsubscribeUrl: string;
    trackingPixelUrl: string;
    displayName: string;
    locale: string;
}

export type NotificationJob =
    | { type: "comment"; id: string; author: string; postTitle: string; postSlug: string }
    | { type: "daily-status" }
    | { type: "flush-views" }
    | { type: "retry-onchain" }
    | { type: "reconcile-donations" }
    | { type: "audit-donations" }
    | {
        type: "contact";
        id: string;
        name: string;
        topic: string;
        preview: string;
    }
    | { type: "contact-flood"; max: number; windowMinutes: number }
    | { type: "retry-transactional-email" };

export type BackupJob =
    | { type: "create-backup"; requestedBy: string };