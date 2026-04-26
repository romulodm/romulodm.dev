import type { JobsOptions, QueueOptions } from "bullmq";

export const defaultJobOptions: QueueOptions["defaultJobOptions"] = {
    attempts: 5,
    backoff: { type: "exponential", delay: 2_000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
};

export const transactionalEmailJobOptions: JobsOptions = {
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
    priority: 1,
};

export const campaignEmailJobOptions: JobsOptions = {
    attempts: 3,
    backoff: { type: "exponential", delay: 30_000 },
    removeOnComplete: { count: 2_000 },
    removeOnFail: { age: 7 * 24 * 3600, count: 500 },
};

export const notificationJobOptions: JobsOptions = {
    attempts: 3,
    backoff: { type: "exponential", delay: 2_000 },
    removeOnComplete: { age: 24 * 3600, count: 1_000 },
    removeOnFail: { age: 7 * 24 * 3600 },
};

export const backupJobOptions: JobsOptions = {
    attempts: 2,
    backoff: { type: "fixed", delay: 10_000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { age: 7 * 24 * 3600 },
};