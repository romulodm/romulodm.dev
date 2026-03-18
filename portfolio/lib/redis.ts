// lib/redis.ts
import { Redis } from 'ioredis';

declare global {
    var _redis: Redis | undefined;
}

function createRedisClient() {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL não definida');

    const client = new Redis(url, {
        maxRetriesPerRequest: 3,
        enableOfflineQueue: true,
    });

    client.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message);
    });

    return client;
}

export const redis = global._redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
    global._redis = redis;
}