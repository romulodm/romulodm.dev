// app/api/posts/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@romulo/database";

export type PostSortOption = 'newest' | 'oldest' | 'most_liked' | 'most_viewed';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const sort = (searchParams.get('sort') as PostSortOption) ?? 'newest';
    const cursor = searchParams.get('cursor');
    const tag = searchParams.get('tag');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '9'), 30);

    const orderByMap: Record<PostSortOption, object> = {
        newest: { publishedAt: 'desc' },
        oldest: { publishedAt: 'asc' },
        most_liked: { likes: 'desc' },
        most_viewed: { views: 'desc' },
    };

    const where = {
        status: 'PUBLISHED' as const,
        publishedAt: { not: null },
        ...(tag ? { postTags: { some: { tag: tag.toLowerCase() } } } : {}),
    };

    const posts = await prisma.post.findMany({
        where,
        orderBy: orderByMap[sort],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            coverImageUrl: true,
            publishedAt: true,
            likes: true,
            views: true,
            commentsCount: true,
            postTags: { select: { tag: true } },
        },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ items, nextCursor, hasMore });
}