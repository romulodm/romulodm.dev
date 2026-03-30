import { Redis } from "ioredis";

export const redis = new Redis(process.env.REDIS_URL_WORKER ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
});