-- name: CreateLike :one
INSERT INTO likes (user_id, post_id, created_at)
VALUES ($1, $2, NOW())
RETURNING *;

-- name: GetLikesById :many
SELECT * FROM likes
WHERE id = $1
LIMIT 1;

-- name: GetLikesByPostId :many
SELECT * FROM likes
WHERE post_id = $1;

-- name: GetLikesByUserId :many
SELECT * FROM likes
WHERE user_id = $1;

-- name: DeleteLike :exec
DELETE FROM likes
WHERE id = $1
RETURNING *;
