// src/lib/redis.ts
import IORedis from "ioredis";

function createConnection(): IORedis {
  return new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
  });
}

/** Shared Redis connection reused across all workers in this process */
export const redis = createConnection();
