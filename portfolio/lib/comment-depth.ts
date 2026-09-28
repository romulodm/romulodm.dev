import { prisma } from "@romulo/database";

import { MAX_COMMENT_DEPTH } from "@/lib/comment-rules";

/**
 * Depth of a comment in its thread (0 for a top-level comment), found by
 * walking up the parent chain. The walk stops one step past
 * MAX_COMMENT_DEPTH, since callers only need to know whether the limit is
 * reached, so it costs at most MAX_COMMENT_DEPTH + 1 small queries.
 */
export async function getCommentDepth(commentId: string): Promise<number> {
  let depth = 0;
  let current = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { parentId: true },
  });

  while (current?.parentId && depth <= MAX_COMMENT_DEPTH) {
    depth += 1;
    current = await prisma.comment.findUnique({
      where: { id: current.parentId },
      select: { parentId: true },
    });
  }

  return depth;
}
