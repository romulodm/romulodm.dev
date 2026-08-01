import { createHash } from "node:crypto";
import {
    DAILY_STATUS_JOB_NAME,
    FLUSH_VIEWS_JOB_NAME,
    RETRY_ONCHAIN_JOB_NAME,
    RECONCILE_DONATIONS_JOB_NAME,
    AUDIT_DONATIONS_JOB_NAME,
} from "./constants";
import type {
    TransactionalEmailJob,
    CampaignEmailJob,
    NotificationJob,
    BackupJob,
} from "./types";

function stableHash(parts: Array<string | number | undefined | null>): string {
    return createHash("sha256")
        .update(parts.map((p) => String(p ?? "")).join("|"))
        .digest("hex")
        .slice(0, 24);
}

export function buildTransactionalJobId(job: TransactionalEmailJob): string {
    switch (job.type) {
        case "CONFIRMATION":
            return `txn:confirmation:${stableHash([job.email, job.confirmationUrl])}`;
        case "WELCOME":
            return `txn:welcome:${stableHash([job.email, job.unsubscribeUrl])}`;
        case "UNSUBSCRIBE_CONFIRM":
            return `txn:unsubscribe:${stableHash([job.email, job.unsubscribeUrl])}`;
        case "PASSWORD_RESET":
            return `txn:password-reset:${stableHash([job.email, job.code])}`;
        default:
            return `txn:unknown:${stableHash([JSON.stringify(job)])}`;
    }
}

export function buildCampaignJobId(job: CampaignEmailJob): string {
    return `campaign:${job.campaignId}:${job.recipientId}`;
}

export function buildNotificationJobId(job: NotificationJob): string {
    switch (job.type) {
        case "comment":
            return `notification:comment:${job.id}`;
        case "daily-status":
            return `notification:${DAILY_STATUS_JOB_NAME}`;
        case "flush-views":
            return `notification:${FLUSH_VIEWS_JOB_NAME}`;
        case "retry-onchain":                              // ← novo
            return `notification:${RETRY_ONCHAIN_JOB_NAME}`;
        case "reconcile-donations":
            return `notification:${RECONCILE_DONATIONS_JOB_NAME}`;
        case "audit-donations":
            return `notification:${AUDIT_DONATIONS_JOB_NAME}`;
        default:
            return `notification:${stableHash([JSON.stringify(job)])}`;
    }
}

export function buildBackupJobId(job: BackupJob): string {
    return `backup-${job.type}-${Date.now()}-${stableHash([job.requestedBy])}`;
}

export function buildEmailMessageId(scope: string, identity: string): string {
    return `<${scope}.${stableHash([identity])}@worker.romulodm.local>`;
}