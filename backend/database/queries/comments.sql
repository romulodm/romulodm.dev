-- name: CreateComment :one
INSERT INTO comments (content, user_id, post_id, created_at)
VALUES ($1, $2, $3, NOW())
RETURNING *;

-- name: GetAllCommentsByPostId :many
SELECT * FROM comments
WHERE post_id = $1;

-- name: IncrementCommentLikes :exec
UPDATE comments
SET likes_count = likes_count + 1
WHERE id = $1;

-- name: DecrementCommentLikes :exec
UPDATE comments
SET likes_count = likes_count - 1
WHERE id = $1;

-- name: CreateCommentLike :one
INSERT INTO comments_likes (user_id, comment_id, created_at)
VALUES ($1, $2, NOW())
RETURNING *;

-- name: GetCommentLikesByCommentId :many
SELECT * FROM comments_likes
WHERE comment_id = $1;

-- name: GetCommentLikesByUserId :one
SELECT * FROM comments_likes
WHERE user_id = $1;

-- name: DeleteCommentLike :exec
DELETE FROM comments_likes
WHERE id = $1
RETURNING *;

-- name: GetCommentsByPostId :many
SELECT * FROM comments
WHERE post_id = $1;

-- name: GetCommentsByUserId :many
SELECT * FROM comments
WHERE user_id = $1;

-- name: GetCommentsByPostAndUserId :many
SELECT * FROM comments
WHERE post_id = $1 AND user_id = $2;

-- name: UpdateComment :exec
UPDATE comments
SET content = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteComment :exec
DELETE FROM comments
WHERE id = $1
RETURNING *;

-- name: CreateCommentReply :one
INSERT INTO comments_reply (content, user_id, post_id, comment_id, created_at)
VALUES ($1, $2, $3, $4, NOW())
RETURNING *;

-- name: IncrementCommentReplyLikes :exec
UPDATE comments_reply
SET likes_count = likes_count + 1
WHERE id = $1;

-- name: DecrementCommentReplyLikes :exec
UPDATE comments_reply
SET likes_count = likes_count - 1
WHERE id = $1;

-- name: CreateCommentReplyLike :one
INSERT INTO comments_replies_likes (user_id, comment_reply_id, created_at)
VALUES ($1, $2, NOW())
RETURNING *;

-- name: GetCommentReplyLikesByReplyId :many
SELECT * FROM comments_replies_likes
WHERE comment_reply_id = $1;

-- name: GetCommentReplyLikesByUserId :many
SELECT * FROM comments_replies_likes
WHERE user_id = $1;

-- name: DeleteCommentReplyLike :exec
DELETE FROM comments_replies_likes
WHERE id = $1
RETURNING *;

-- name: GetCommentRepliesById :many
SELECT * FROM comments_reply
WHERE id = $1
LIMIT 1;

-- name: GetCommentRepliesByCommentId :many
SELECT * FROM comments_reply
WHERE comment_id = $1;

-- name: UpdateCommentReply :exec
UPDATE comments_reply
SET content = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteCommentReply :exec
DELETE FROM comments_reply
WHERE id = $1
RETURNING *;

