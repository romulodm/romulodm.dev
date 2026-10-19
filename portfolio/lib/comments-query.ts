import "server-only";

import { prisma } from "@romulo/database";

import { AVATAR_SELECT } from "@/lib/avatar";
import type { SortOrder } from "@/lib/comments";

/**
 * Comment list query shared by the `listPostComments` server action
 * (lib/comments.ts) and the post page.
 *
 * It lives outside lib/comments.ts on purpose: every async function exported
 * from a "use server" module becomes a public server action, and
 * `getPublicPostComments` takes no session check because it does not need one.
 * Keeping it here keeps it a plain server function.
 */

const PAGE_SIZE = 20;

// Nested include helper — 4 levels deep
const replyInclude = (depth: number): any => {
    if (depth === 0) return undefined;
    return {
        replies: {
            orderBy: [{ score: "desc" as const }, { createdAt: "asc" as const }],
            include: {
                author: { select: { id: true, ...AVATAR_SELECT } },
                votes: { select: { userId: true, value: true } },
                ...(depth > 1 ? replyInclude(depth - 1) : {}),
            },
        },
    };
};

export async function queryPostComments({
    postId,
    cursor,
    sort,
    userId,
}: {
    postId: string;
    cursor: string | null;
    sort: SortOrder;
    /** Whose votes to mark in `userVote`; null marks none. */
    userId: string | null;
}) {
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
            author: { select: { id: true, ...AVATAR_SELECT } },
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

/**
 * First page of a post's comments as anyone sees them: default sort, no vote
 * marked. Reads no cookie, so the post page can render it and stay static.
 * The client then swaps in the same page with the visitor's votes
 * (CommentsSection).
 */
export function getPublicPostComments(postId: string) {
    return queryPostComments({ postId, cursor: null, sort: "score", userId: null });
}
