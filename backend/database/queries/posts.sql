-- name: CreatePost :one
INSERT INTO posts (slug, link)
VALUES ($1, $2)
RETURNING *;

-- name: GetPostById :one
SELECT * FROM posts
WHERE id = $1 LIMIT 1;

-- name: GetPostBySlug :one
SELECT * FROM posts
WHERE slug = $1 LIMIT 1;

-- name: GetAllPosts :many
SELECT * FROM posts LIMIT $1 OFFSET $2;

-- name: IncrementPostViews :exec
UPDATE posts
SET views_count = views_count + 1
WHERE id = $1;

-- name: IncrementPostLikes :exec
UPDATE posts
SET likes_count = likes_count + 1
WHERE id = $1;

-- name: DecrementPostLikes :exec
UPDATE posts
SET likes_count = likes_count - 1
WHERE id = $1 AND likes_count > 0;

-- name: IncrementPostComments :exec
UPDATE posts
SET comments_count = comments_count + 1
WHERE id = $1;

-- name: DecrementPostComments :exec
UPDATE posts
SET comments_count = comments_count - 1
WHERE id = $1 AND comments_count > 0;

-- name: UpdateSlugById :exec
UPDATE posts
SET slug = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateLinkById :exec
UPDATE posts
SET link = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeletePost :exec
DELETE FROM posts WHERE id = $1;