"use server";

import { prisma } from "@romulo/database";
import { getLocale } from "next-intl/server";
import { unstable_cache } from "next/cache";

export const getProfileByUsername = unstable_cache(
    async (username: string) => {
        return prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                email: true,
                image: true,
                createdAt: true,
                banned: true,
                _count: { select: { comments: true } },
            },
        });
    },
    ["profile-by-username"],
    { revalidate: 60 }
);

type ListUserCommentsArgs = {
    userId: string;
    take?: number;
    cursor?: { createdAt: string; id: string } | null;
};

export async function listUserComments({ userId, take = 10, cursor = null }: ListUserCommentsArgs) {
    const locale = await getLocale();

    const comments = await prisma.comment.findMany({
        where: { authorId: userId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: take + 1,
        ...(cursor
            ? {
                skip: 1,
                cursor: { id: cursor.id },
            }
            : {}),
        select: {
            id: true,
            bodyMd: true,
            createdAt: true,
            post: {
                select: {
                    slug: true,
                    translations: {
                        where: { locale },
                        select: { title: true },
                        take: 1,
                    },
                },
            },
            parent: {
                select: {
                    id: true,
                    bodyMd: true,
                    author: { select: { username: true } },
                },
            },
        },
    });

    const hasMore = comments.length > take;
    const items = hasMore ? comments.slice(0, take) : comments;

    const nextCursor = hasMore
        ? {
            id: items[items.length - 1].id,
            createdAt: items[items.length - 1].createdAt.toISOString(),
        }
        : null;

    return { items, nextCursor };
}
