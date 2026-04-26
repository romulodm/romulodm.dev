export type TransactionalEmailJob =
    | { type: "CONFIRMATION"; email: string; confirmationUrl: string }
    | { type: "WELCOME"; email: string; unsubscribeUrl: string }
    | { type: "UNSUBSCRIBE_CONFIRM"; email: string; unsubscribeUrl: string }
    | { type: "PASSWORD_RESET"; email: string; code: string; expiresInMinutes?: number };

export interface CampaignEmailJob {
    campaignId: string;
    recipientId: string;
    trackingId: string;
    email: string;
    subject: string;
    content: string;
    unsubscribeUrl: string;
    trackingPixelUrl: string;
}

export type NotificationJob =
    | { type: "comment"; id: string; author: string; postTitle: string; postSlug: string }
    | { type: "daily-status" }
    | { type: "flush-views" }
    | { type: "retry-onchain" };

export type BackupJob =
    | { type: "create-backup"; requestedBy: string };