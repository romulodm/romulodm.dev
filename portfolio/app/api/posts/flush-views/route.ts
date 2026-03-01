import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);
const BATCH_KEY = 'views:batch';

/**
 * GET /api/posts/flush-views
 * Chamado pelo cron job Vercel a cada 5 minutos.
 * Faz o flush de todas as visualizações pendentes no Redis para o banco.
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batch = await redis.hgetall(BATCH_KEY);

    if (!batch || Object.keys(batch).length === 0) {
        return NextResponse.json({ flushed: 0, message: 'Nothing to flush' });
    }

    // Deletar o hash ANTES de processar para evitar double-count
    await redis.del(BATCH_KEY);

    const entries = Object.entries(batch)
        .map(([postId, countStr]) => ({ postId, count: parseInt(countStr, 10) }))
        .filter((e) => e.count > 0);

    // Atualizar todos em paralelo (cada update é atômico no banco)
    await Promise.all(
        entries.map(({ postId, count }) =>
            prisma.post.update({
                where: { id: postId },
                data: { views: { increment: count } },
            })
        )
    );

    console.log(`[flush-views] Flushed ${entries.length} posts`);

    return NextResponse.json({
        flushed: entries.length,
        details: entries,
    });
}