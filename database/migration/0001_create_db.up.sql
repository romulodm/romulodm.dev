CREATE TABLE "users" (
  "id" int PRIMARY KEY,
  "sub" varchar UNIQUE NOT NULL,
  "email" varchar UNIQUE NOT NULL,
  "email_verified" bool NOT NULL,
  "picture" varchar NOT NULL,
  "name" varchar NOT NULL,
  "full_name" varchar NOT NULL,
  "admin" bool DEFAULT false,
  "active" bool DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "posts" (
  "id" int PRIMARY KEY,
  "slug" varchar UNIQUE NOT NULL,
  "link" varchar,
  "views_count" int DEFAULT 0,
  "likes_count" int DEFAULT 0,
  "comments_count" int DEFAULT 0,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "likes" (
  "id" int PRIMARY KEY,
  "created_at" timestamp DEFAULT (now()),
  "user_id" int,
  "post_id" int
);

CREATE TABLE "comments" (
  "id" int PRIMARY KEY,
  "content" varchar,
  "replies_count" int DEFAULT 0,
  "likes_count" int DEFAULT 0,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp,
  "user_id" int,
  "post_id" int
);

CREATE TABLE "comments_reply" (
  "id" int PRIMARY KEY,
  "content" varchar,
  "likes_count" int DEFAULT 0,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp,
  "user_id" int,
  "post_id" int,
  "comment_id" int
);

CREATE TABLE "comments_likes" (
  "id" int PRIMARY KEY,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "user_id" int,
  "comment_id" int
);

CREATE TABLE "comments_replies_likes" (
  "id" int PRIMARY KEY,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "user_id" int,
  "comment_reply_id" int
);

CREATE INDEX ON "users" ("email");

CREATE INDEX ON "likes" ("post_id");

CREATE INDEX ON "likes" ("post_id", "user_id");

CREATE INDEX ON "comments" ("post_id");

CREATE INDEX ON "comments" ("post_id", "user_id");

CREATE INDEX ON "comments_reply" ("comment_id");

CREATE INDEX ON "comments_reply" ("comment_id", "user_id");

CREATE INDEX ON "comments_likes" ("comment_id");

CREATE INDEX ON "comments_likes" ("user_id", "comment_id");

CREATE INDEX ON "comments_replies_likes" ("comment_reply_id");

CREATE INDEX ON "comments_replies_likes" ("user_id", "comment_reply_id");

ALTER TABLE "likes" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "likes" ADD FOREIGN KEY ("post_id") REFERENCES "posts" ("id");

ALTER TABLE "comments" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "comments" ADD FOREIGN KEY ("post_id") REFERENCES "posts" ("id");

ALTER TABLE "comments_reply" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "comments_reply" ADD FOREIGN KEY ("post_id") REFERENCES "posts" ("id");

ALTER TABLE "comments_reply" ADD FOREIGN KEY ("comment_id") REFERENCES "comments" ("id");

ALTER TABLE "comments_likes" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "comments_likes" ADD FOREIGN KEY ("comment_id") REFERENCES "comments" ("id");

ALTER TABLE "comments_replies_likes" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "comments_replies_likes" ADD FOREIGN KEY ("comment_reply_id") REFERENCES "comments_reply" ("id");
