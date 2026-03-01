// app/api/posts/[id]/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis'

const VIEW_COOLDOWN_SECONDS = 30 * 60; // 30 min por usuário/sessão
const BATCH_FLUSH_THRESHOLD = 50;       // Flush ao atingir N views pendentes
const BATCH_KEY = 'views:batch';        // Hash Redis { postId -> pendingCount }

/**
 * Estratégia escalável:
 * 1. Rate-limit por identifier (userId ou sessionId) com TTL no Redis
 * 2. Acumular incrementos no Redis (hash) em vez de bater no banco a cada request
 * 3. Fazer flush para o banco quando atingir threshold OU via cron job externo
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const postId = params.id;

    let identifier: string;
    try {
        const body = await req.json();
        identifier = body.userId || body.sessionId;
    } catch {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    if (!identifier) {
        return NextResponse.json({ error: 'identifier required' }, { status: 400 });
    }

    // 1. Rate-limit: verificar se esse identifier já visualizou recentemente
    const cooldownKey = `view:cooldown:${postId}:${identifier}`;
    const alreadySeen = await redis.exists(cooldownKey);

    if (alreadySeen) {
        return NextResponse.json({ counted: false, reason: 'cooldown' });
    }

    // 2. Marcar cooldown
    await redis.setex(cooldownKey, VIEW_COOLDOWN_SECONDS, '1');

    // 3. Incrementar contador pendente no Redis (buffer)
    const pendingForPost = await redis.hincrby(BATCH_KEY, postId, 1);

    // 4. Flush imediato se atingiu o threshold (ou pode fazer via cron)
    if (pendingForPost >= BATCH_FLUSH_THRESHOLD) {
        await flushViewsForPost(postId);
    }

    return NextResponse.json({ counted: true });
}

/**
 * Flush das views pendentes para o banco para um post específico.
 * Chamado threshold-based aqui, mas também pode ser chamado por um cron job
 * que processa todos os posts pendentes periodicamente.
 */
async function flushViewsForPost(postId: string) {
    // GETDEL atômico: pega e remove o valor do hash de uma vez
    // Usamos pipeline para atomicidade: HGET + HDEL
    const pipeline = redis.pipeline();
    pipeline.hget(BATCH_KEY, postId);
    pipeline.hdel(BATCH_KEY, postId);
    const results = await pipeline.exec();

    const countStr = results?.[0]?.[1] as string | null;
    const count = parseInt(countStr || '0', 10);

    if (count > 0) {
        await prisma.post.update({
            where: { id: postId },
            data: { views: { increment: count } },
        });
    }
}

/**
 * GET: Endpoint chamado por cron job (ex: Vercel Cron, GitHub Actions)
 * para fazer flush de TODOS os posts com views pendentes.
 * Proteja com CRON_SECRET em produção.
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Pegar todos os postIds com views pendentes
    const batch = await redis.hgetall(BATCH_KEY);
    if (!batch || Object.keys(batch).length === 0) {
        return NextResponse.json({ flushed: 0 });
    }

    // Deletar o hash antes de processar (evita double-count em race condition)
    await redis.del(BATCH_KEY);

    // Atualizar em paralelo com transaction por post
    const updates = Object.entries(batch).map(([postId, countStr]) => {
        const count = parseInt(countStr, 10);
        if (count <= 0) return Promise.resolve();
        return prisma.post.update({
            where: { id: postId },
            data: { views: { increment: count } },
        });
    });

    await Promise.all(updates);

    return NextResponse.json({ flushed: Object.keys(batch).length });
}