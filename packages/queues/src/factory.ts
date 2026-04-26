import { Queue, type QueueOptions } from "bullmq";
import type { Redis } from "ioredis";
import { defaultJobOptions } from "./options";

export function createQueue<T>(
    name: string,
    connection: Redis,
    opts?: Partial<QueueOptions>,
): Queue<T> {
    return new Queue<T>(name, {
        connection,
        defaultJobOptions,
        ...opts,
    });
}