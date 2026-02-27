import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

const VIEW_COOLDOWN_MINUTES = 5; // Delay entre contagens

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id;
    const { userId, sessionId } = await req.json(); // sessionId gerado no client

    const identifier = userId || sessionId;

    if (!identifier) {
        return NextResponse.json({ error: 'identifier required' }, { status: 400 });
    }

    // Chave única para rate limiting
    const viewKey = `view:${id}:${identifier}`;

    // Verificar se já visualizou recentemente
    const lastView = await redis.get(viewKey);

    if (lastView) {
        return NextResponse.json({
            counted: false,
            message: 'View already counted recently'
        });
    }

    // Marcar view com TTL
    await redis.setex(
        viewKey,
        VIEW_COOLDOWN_MINUTES * 60,
        Date.now().toString()
    );

    // Incrementar view no banco (pode ser feito async em background)
    await prisma.post.update({
        where: { id: id },
        data: { views: { increment: 1 } },
    });

    return NextResponse.json({ counted: true });
}