// app/api/posts/public/route.ts
import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from 'next/server';
import { Prisma, prisma } from "@romulo/database";

export type PostSortOption = 'newest' | 'oldest' | 'most_liked' | 'most_viewed';

const PUBLIC_POSTS_REVALIDATE_SECONDS = 300;

function getOrderBy(sort: PostSortOption): Prisma.PostOrderByWithRelationInput[] {
    switch (sort) {
        case 'oldest':
            return [{ publishedAt: 'asc' }, { id: 'asc' }];
        case 'most_liked':
            return [{ likes: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }];
        case 'most_viewed':
            return [{ views: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }];
        case 'newest':
        default:
            return [{ publishedAt: 'desc' }, { id: 'desc' }];
    }
}

const getCachedPublicPosts = unstable_cache(
    async (
        sort: PostSortOption,
        cursor: string | null,
        tag: string | null,
        limit: number,
        locale: string,
    ) => {
        const where = {
            status: 'PUBLISHED' as const,
            publishedAt: { not: null },
            ...(tag ? { postTags: { some: { tag } } } : {}),
        };

        const rawPosts = await prisma.post.findMany({
            where,
            orderBy: getOrderBy(sort),
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            select: {
                id: true,
                slug: true,
                readingTime: true,
                coverImageUrl: true,
                publishedAt: true,
                likes: true,
                views: true,
                commentsCount: true,
                postTags: { select: { tag: true } },
                author: { select: { username: true, image: true } },
                translations: {
                    orderBy: { locale: 'asc' },
                    select: {
                        locale: true,
                        title: true,
                        excerpt: true,
                        summary: true,
                    },
                },
            },
        });

        const hasMore = rawPosts.length > limit;
        const sliced = hasMore ? rawPosts.slice(0, limit) : rawPosts;

        const items = sliced.flatMap(({ translations, ...post }) => {
            const translation =
                translations.find((t) => t.locale === locale) ?? translations[0];
            if (!translation) return [];
            const { locale: _translationLocale, ...content } = translation;
            return [{ ...post, ...content }];
        });

        return {
            items,
            nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
            hasMore,
        };
    },
    ["public-posts-route"],
    { revalidate: PUBLIC_POSTS_REVALIDATE_SECONDS },
);

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const sort = (searchParams.get('sort') as PostSortOption) ?? 'newest';
    const cursor = searchParams.get('cursor');
    const tag = searchParams.get('tag');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '9', 10), 30);
    const locale = searchParams.get('locale') ?? 'pt-BR';

    const payload = await getCachedPublicPosts(sort, cursor, tag, limit, locale);

    return NextResponse.json(payload);
}
