"use server";

import { prisma } from "@romulo/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLocale } from "next-intl/server";

import { AVATAR_SELECT } from "@/lib/avatar";
import { getCommentDepth } from "@/lib/comment-depth";
import { queryPostComments } from "@/lib/comments-query";

export type SortOrder = "score" | "newest" | "oldest";

/**
 * Server action behind sorting, "load more" and the refresh after posting.
 * Same query as the public list rendered into the cached post page (see
 * lib/comments-query.ts), plus the visitor's own vote on each comment, which is
 * why it reads the session and why it cannot run during that page's render.
 */
export async function listPostComments({
    postId,
    cursor = null,
    sort = "score",
}: {
    postId: string;
    cursor?: string | null;
    sort?: SortOrder;
}) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    return queryPostComments({ postId, cursor, sort, userId });
}

export async function getCommentById(id: string) {
    const [session, locale] = await Promise.all([
        getServerSession(authOptions),
        getLocale(),
    ]);
    const userId = session?.user?.id ?? null;

    const comment = await prisma.comment.findUnique({
        where: { id },
        include: {
            author: { select: { id: true, ...AVATAR_SELECT } },
            votes: { select: { userId: true, value: true } },
            post: {
                select: {
                    id: true,
                    slug: true,
                    translations: {
                        where: { locale },
                        select: { title: true },
                        take: 1,
                    },
                },
            },
            parent: {
                include: {
                    author: { select: { id: true, ...AVATAR_SELECT } },
                    votes: { select: { userId: true, value: true } },
                },
            },
            replies: {
                orderBy: [{ score: "desc" as const }, { createdAt: "asc" as const }],
                include: {
                    author: { select: { id: true, ...AVATAR_SELECT } },
                    votes: { select: { userId: true, value: true } },
                    replies: {
                        orderBy: [{ score: "desc" as const }, { createdAt: "asc" as const }],
                        include: {
                            author: { select: { id: true, ...AVATAR_SELECT } },
                            votes: { select: { userId: true, value: true } },
                        },
                    },
                },
            },
        },
    });

    if (!comment) return null;

    function attachVote(c: any): any {
        const userVote = userId
            ? (c.votes?.find((v: any) => v.userId === userId)?.value ?? 0)
            : 0;
        return {
            ...c,
            userVote,
            votes: undefined,
            replies: c.replies?.map(attachVote) ?? [],
        };
    }

    const result = attachVote(comment);
    if (result.parent) result.parent = attachVote(result.parent);

    const depth = comment.parentId ? await getCommentDepth(comment.id) : 0;

    return {
        ...result,
        depth,
        post: {
            id: result.post.id,
            slug: result.post.slug,
            title: result.post.translations[0]?.title ?? "",
        },
    };
}
