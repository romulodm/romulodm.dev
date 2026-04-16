import 'server-only'
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

export function getRedis(): Redis {
    if (!global._redis) global._redis = createClient()
    return global._redis
}

export function getRedisBullMQ(): Redis {
    if (!global._redisBullMQ) global._redisBullMQ = createClient(true)
    return global._redisBullMQ
}