"use server";

import { prisma } from "@romulo/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type SortOrder = "score" | "newest" | "oldest";

const PAGE_SIZE = 20;

// Nested include helper — 4 levels deep
const replyInclude = (depth: number): any => {
    if (depth === 0) return undefined;
    return {
        replies: {
            orderBy: [{ score: "desc" as const }, { createdAt: "asc" as const }],
            include: {
                author: { select: { id: true, username: true, image: true } },
                votes: { select: { userId: true, value: true } },
                ...(depth > 1 ? replyInclude(depth - 1) : {}),
            },
        },
    };
};

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

    const orderBy =
        sort === "score"
            ? [{ score: "desc" as const }, { createdAt: "desc" as const }]
            : sort === "newest"
                ? [{ createdAt: "desc" as const }]
                : [{ createdAt: "asc" as const }];

    const comments = await prisma.comment.findMany({
        where: { postId, parentId: null },
        orderBy,
        take: PAGE_SIZE + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
            author: { select: { id: true, username: true, image: true } },
            votes: { select: { userId: true, value: true } },
            ...replyInclude(4),
        },
    });

    const hasMore = comments.length > PAGE_SIZE;
    const items = hasMore ? comments.slice(0, PAGE_SIZE) : comments;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Attach userVote to each comment recursively
    function attachVote(comment: any): any {
        const userVote = userId
            ? (comment.votes?.find((v: any) => v.userId === userId)?.value ?? 0)
            : 0;
        return {
            ...comment,
            userVote,
            votes: undefined, // strip raw votes from client payload
            replies: comment.replies?.map(attachVote) ?? [],
        };
    }

    return {
        items: items.map(attachVote),
        nextCursor,
    };
}

export async function getCommentById(id: string) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    const comment = await prisma.comment.findUnique({
        where: { id },
        include: {
            author: { select: { id: true, username: true, image: true } },
            votes: { select: { userId: true, value: true } },
            post: { select: { id: true, slug: true, title: true } },
            parent: {
                include: {
                    author: { select: { id: true, username: true, image: true } },
                    votes: { select: { userId: true, value: true } },
                },
            },
            replies: {
                orderBy: [{ score: "desc" as const }, { createdAt: "asc" as const }],
                include: {
                    author: { select: { id: true, username: true, image: true } },
                    votes: { select: { userId: true, value: true } },
                    replies: {
                        orderBy: [{ score: "desc" as const }, { createdAt: "asc" as const }],
                        include: {
                            author: { select: { id: true, username: true, image: true } },
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
    return result;
}
