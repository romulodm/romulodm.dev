/**
 * Deepest nesting level a comment can sit at. Top-level comments are depth 0,
 * so a thread holds at most MAX_COMMENT_DEPTH + 1 levels. A comment at this
 * depth cannot be replied to: CommentCard hides its Reply button and
 * POST /api/comments rejects the reply.
 *
 * Client-safe on purpose (no Prisma import) so CommentCard can read it.
 */
export const MAX_COMMENT_DEPTH = 3;

export function canReplyAtDepth(depth: number) {
  return depth < MAX_COMMENT_DEPTH;
}
