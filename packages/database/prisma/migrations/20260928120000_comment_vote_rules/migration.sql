-- Comment voting rules (see portfolio/app/api/comments/[id]/vote/route.ts):
-- authors cannot vote on their own comments and a score never goes below 0.

-- Drop self-votes cast before the rule existed.
DELETE FROM "CommentVote" v
USING "Comment" c
WHERE v."commentId" = c."id"
  AND v."userId" = c."authorId";

-- Recompute every score from the remaining votes, clamped at 0.
UPDATE "Comment" c
SET "score" = GREATEST(
  0,
  COALESCE((SELECT SUM(v."value") FROM "CommentVote" v WHERE v."commentId" = c."id"), 0)
);
