-- Add columns (authorId nullable first)
ALTER TABLE "Post"
  ADD COLUMN "authorId" TEXT,
  ADD COLUMN "readingTime" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "summary" VARCHAR(500);

ALTER TABLE "User"
  ADD COLUMN "about" VARCHAR(1000),
  ADD COLUMN "githubUrl" TEXT,
  ADD COLUMN "linkedinUrl" TEXT;

-- Backfill authorId for existing posts (prefer admin, else oldest user)
UPDATE "Post"
SET "authorId" = (
  SELECT "id" FROM "User"
  WHERE "admin" = TRUE
  ORDER BY "createdAt" ASC
  LIMIT 1
)
WHERE "authorId" IS NULL;

UPDATE "Post"
SET "authorId" = (
  SELECT "id" FROM "User"
  ORDER BY "createdAt" ASC
  LIMIT 1
)
WHERE "authorId" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "Post"
  ALTER COLUMN "authorId" SET NOT NULL;

-- FK
ALTER TABLE "Post"
  ADD CONSTRAINT "Post_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");