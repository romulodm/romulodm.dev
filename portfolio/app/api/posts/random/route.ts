// app/api/posts/random/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    // Conta posts publicados
    const count = await prisma.post.count({
        where: { status: 'PUBLISHED', publishedAt: { not: null } },
    });

    if (count === 0) {
        return NextResponse.json({ error: 'No posts' }, { status: 404 });
    }

    // Offset aleatório
    const skip = Math.floor(Math.random() * count);

    const post = await prisma.post.findFirst({
        where: { status: 'PUBLISHED', publishedAt: { not: null } },
        skip,
        select: { slug: true },
    });

    if (!post) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ slug: post.slug });
}