-- name: GetUserById :one
SELECT * FROM users
WHERE id = $1 LIMIT 1;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 LIMIT 1;

-- name: GetUserBySub :one
SELECT * FROM users
WHERE sub = $1 LIMIT 1;

-- name: GetAllUsers :many
SELECT * FROM users LIMIT $1 OFFSET $2;

-- name: CreateUser :one
INSERT INTO users (email, sub, email_verified, name, full_name, picture)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateAdminById :exec
UPDATE users
SET admin = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateToAdminByEmail :exec
UPDATE users
SET admin = $2, updated_at = NOW()
WHERE email = $1
RETURNING *;

-- name: UpdateToAdminBySub :exec
UPDATE users
SET admin = $2, updated_at = NOW()
WHERE sub = $1
RETURNING *;

-- name: DeactivateUserById :exec
UPDATE users
SET active = false, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeactivateUserByEmail :exec
UPDATE users
SET active = false, updated_at = NOW()
WHERE email = $1
RETURNING *;

-- name: DeactivateUserBySub :exec
UPDATE users
SET active = false, updated_at = NOW()
WHERE sub = $1
RETURNING *;


-- name: ActivateUserById :exec
UPDATE users
SET active = true, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: ActivateUserByEmail :exec
UPDATE users
SET active = true, updated_at = NOW()
WHERE email = $1
RETURNING *;

-- name: ActivateUserBySub :exec
UPDATE users
SET active = true, updated_at = NOW()
WHERE sub = $1
RETURNING *;

-- name: UpdateUserById :exec
UPDATE users
SET name = $2, full_name = $3, picture = $4, email_verified = $5, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateUserByEmail :exec
UPDATE users
SET name = $2, full_name = $3, picture = $4, updated_at = NOW()
WHERE email = $1
RETURNING *;

-- name: UpdateUserBySub :exec
UPDATE users
SET name = $2, full_name = $3, picture = $4, updated_at = NOW()
WHERE sub = $1
RETURNING *;

-- name: DeleteUserById :exec
DELETE FROM users WHERE id = $1;

-- name: DeleteUserByEmail :exec
DELETE FROM users WHERE email = $1;

-- name: DeleteUserBySub :exec
DELETE FROM users WHERE sub = $1;


-- name: ActivateNewsletterUserById :exec
UPDATE users
SET newsletter = true, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: ActivateNewsletterUserByEmail :exec
UPDATE users
SET newsletter = true, updated_at = NOW()
WHERE email = $1
RETURNING *;

-- name: ActivateNewsletterUserBySub :exec
UPDATE users
SET newsletter = true, updated_at = NOW()
WHERE sub = $1
RETURNING *;


-- name: DeactivateNewsletterUserById :exec
UPDATE users
SET newsletter = false, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeactivateNewsletterUserByEmail :exec
UPDATE users
SET newsletter = false, updated_at = NOW()
WHERE email = $1
RETURNING *;

-- name: DeactivateNewsletterUserBySub :exec
UPDATE users
SET newsletter = false, updated_at = NOW()
WHERE sub = $1
RETURNING *;