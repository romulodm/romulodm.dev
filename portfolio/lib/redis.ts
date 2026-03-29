// lib/redis.ts
import Redis from 'ioredis'

declare global {
    var _redis: Redis | undefined
    var _redisBullMQ: Redis | undefined
}

function createClient(bullmq = false) {
    const url = process.env.REDIS_URL
    if (!url) throw new Error('REDIS_URL não definida')

    const client = new Redis(url, {
        maxRetriesPerRequest: bullmq ? null : 3,
        enableOfflineQueue: true,
    })

    client.on('error', (err) =>
        console.error(`[Redis${bullmq ? ':bullmq' : ''}] ${err.message}`)
    )

    return client
}

// Conexão geral (cache, sessões, etc)
export const redis = global._redis ?? createClient()
if (process.env.NODE_ENV !== 'production') global._redis = redis

// Conexão dedicada ao BullMQ (maxRetriesPerRequest: null obrigatório)
export const redisBullMQ = global._redisBullMQ ?? createClient(true)
if (process.env.NODE_ENV !== 'production') global._redisBullMQ = redisBullMQ