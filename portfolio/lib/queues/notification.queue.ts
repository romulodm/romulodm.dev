// lib/queues/notification.queue.ts
import { Queue } from 'bullmq'
import { redisBullMQ } from '@/lib/redis'

export const notificationQueue = new Queue('notifications', {
    connection: redisBullMQ,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 24 * 3600, count: 1000 },
        removeOnFail: { age: 7 * 24 * 3600 },
    },
})

export type NotificationJob =
    | { type: 'comment'; author: string; postTitle: string; postSlug: string }
    | { type: 'daily-status' }