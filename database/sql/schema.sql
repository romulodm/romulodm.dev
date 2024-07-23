DROP TABLE IF EXISTS "comments_replies_likes" CASCADE;
DROP TABLE IF EXISTS "comments_likes" CASCADE;
DROP TABLE IF EXISTS "comments_reply" CASCADE;
DROP TABLE IF EXISTS "comments" CASCADE;
DROP TABLE IF EXISTS "likes" CASCADE;
DROP TABLE IF EXISTS "posts" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

CREATE TABLE "users" (
  "id" serial PRIMARY KEY,
  "sub" varchar NOT NULL UNIQUE,
  "email" varchar UNIQUE NOT NULL,
  "email_verified" bool NOT NULL DEFAULT false,
  "picture" varchar NOT NULL,
  "name" varchar NOT NULL,
  "surname" varchar NOT NULL DEFAULT '',
  "full_name" varchar NOT NULL DEFAULT '',
  "newsletter" bool NOT NULL DEFAULT false,
  "admin" bool NOT NULL DEFAULT false,
  "active" bool NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "posts" (
  "id" serial PRIMARY KEY,
  "slug" varchar UNIQUE NOT NULL,
  "link" varchar NOT NULL,
  "views_count" int DEFAULT 0,
  "likes_count" int DEFAULT 0,
  "comments_count" int DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "likes" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT (now()),
  "user_id" serial,
  "post_id" serial
);

CREATE TABLE "comments" (
  "id" serial PRIMARY KEY,
  "content" varchar NOT NULL,
  "replies_count" int DEFAULT 0,
  "likes_count" int DEFAULT 0,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp,
  "user_id" serial,
  "post_id" serial
);

CREATE TABLE "comments_reply" (
  "id" serial PRIMARY KEY,
  "content" varchar NOT NULL,
  "likes_count" int DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now()),
  "user_id" serial,
  "post_id" serial,
  "comment_id" serial
);

CREATE TABLE "comments_likes" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "user_id" serial,
  "comment_id" serial
);

CREATE TABLE "comments_replies_likes" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "user_id" serial,
  "comment_reply_id" serial
);

CREATE INDEX ON "users" ("email");

CREATE INDEX ON "likes" ("post_id");

CREATE UNIQUE INDEX ON "likes" ("post_id", "user_id");

CREATE INDEX ON "comments" ("post_id");

CREATE INDEX ON "comments" ("post_id", "user_id");

CREATE INDEX ON "comments_reply" ("comment_id");

CREATE INDEX ON "comments_reply" ("comment_id", "user_id");

CREATE INDEX ON "comments_likes" ("comment_id");

CREATE UNIQUE INDEX ON "comments_likes" ("user_id", "comment_id");

CREATE INDEX ON "comments_replies_likes" ("comment_reply_id");

CREATE UNIQUE INDEX ON "comments_replies_likes" ("user_id", "comment_reply_id");

ALTER TABLE "likes" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "likes" ADD FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE;

ALTER TABLE "comments" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "comments" ADD FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE;

ALTER TABLE "comments_reply" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "comments_reply" ADD FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE;

ALTER TABLE "comments_reply" ADD FOREIGN KEY ("comment_id") REFERENCES "comments" ("id") ON DELETE CASCADE;

ALTER TABLE "comments_likes" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "comments_likes" ADD FOREIGN KEY ("comment_id") REFERENCES "comments" ("id") ON DELETE CASCADE;

ALTER TABLE "comments_replies_likes" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "comments_replies_likes" ADD FOREIGN KEY ("comment_reply_id") REFERENCES "comments_reply" ("id") ON DELETE CASCADE;
