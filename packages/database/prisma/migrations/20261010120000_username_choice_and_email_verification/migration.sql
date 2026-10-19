-- Two account rules arrive together:
--
--  1. Users choose their own username. OAuth sign-up used to derive it from
--     the provider name or, when there was none, from the e-mail local part,
--     which published part of the address on every comment and profile URL.
--  2. EMAIL_PASSWORD accounts must confirm their address before commenting or
--     posting on the wall.

ALTER TABLE "User" ADD COLUMN "usernameChosenAt" TIMESTAMP(3);

CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");

ALTER TABLE "EmailVerificationToken"
    ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing username counts as chosen, except the ones that
-- reproduce the e-mail local part. Those owners get the "choose a username"
-- prompt on their next visit. Two derivations existed:
--
--  - OAuth (lib/username.ts): lowercase, everything outside [a-z0-9] removed,
--    cut to 24 chars, with a numeric suffix on collisions ("fulano", "fulano2");
--  - password sign-up without a username: the raw local part, cut to 24 chars.
--
-- The normalized local part only contains [a-z0-9], so concatenating it into
-- the regular expression cannot inject metacharacters.
UPDATE "User" u
SET "usernameChosenAt" = u."createdAt"
WHERE lower(u."username") <> lower(left(split_part(u."email", '@', 1), 24))
  AND NOT (
    left(regexp_replace(lower(split_part(u."email", '@', 1)), '[^a-z0-9]+', '', 'g'), 24) <> ''
    AND u."username" ~ (
      '^' || left(regexp_replace(lower(split_part(u."email", '@', 1)), '[^a-z0-9]+', '', 'g'), 24) || '[0-9]*$'
    )
  );
