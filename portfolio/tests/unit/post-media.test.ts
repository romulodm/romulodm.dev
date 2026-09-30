import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  covers: [] as Array<{ coverImageUrl: string | null }>,
  translations: [] as Array<{ contentMarkdown: string }>,
  campaigns: [] as Array<{ content: string }>,
  sentCampaigns: 0,
}));

const storage = vi.hoisted(() => ({
  keys: [] as string[],
  deleted: [] as string[],
}));

vi.mock("@romulo/database", () => ({
  prisma: {
    post: { findMany: vi.fn(async () => db.covers) },
    postTranslation: { findMany: vi.fn(async () => db.translations) },
    campaign: {
      findMany: vi.fn(async () => db.campaigns),
      count: vi.fn(async () => db.sentCampaigns),
    },
  },
}));

// Keep the pure helpers (id validation, prefix, cover detection) real and
// replace only the calls that reach MinIO.
vi.mock("@/lib/s3", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/s3")>()),
  listPostMediaKeys: vi.fn(async () => storage.keys),
  deleteMediaObjects: vi.fn(async (keys: string[]) => {
    storage.deleted.push(...keys);
  }),
}));

import { sweepUnusedPostMedia } from "@/lib/post-media";

const POST_ID = "cmunjkeizzhtxc3o254x4wkkx";
const key = (name: string) => `posts/${POST_ID}/${name}`;
const localUrl = (name: string) => `http://localhost:9000/portfolio-blog/${key(name)}`;
const prodUrl = (name: string) => `https://romulodm.dev/media/${key(name)}`;

beforeEach(() => {
  db.covers = [];
  db.translations = [];
  db.campaigns = [];
  db.sentCampaigns = 0;
  storage.keys = [];
  storage.deleted = [];
});

describe("sweepUnusedPostMedia", () => {
  it("deletes images that neither the cover nor any translation uses", async () => {
    storage.keys = [key("cover-aaa.png"), key("cover-old.png"), key("bbb.png"), key("gone.png")];
    db.covers = [{ coverImageUrl: localUrl("cover-aaa.png") }];
    db.translations = [{ contentMarkdown: `Intro\n\n![diagram](${localUrl("bbb.png")})` }];

    const deleted = await sweepUnusedPostMedia(POST_ID);

    expect(deleted.sort()).toEqual([key("cover-old.png"), key("gone.png")]);
    expect(storage.deleted.sort()).toEqual(deleted.sort());
  });

  it("keeps an image used by only one of the translations", async () => {
    storage.keys = [key("pt-only.png")];
    db.translations = [
      { contentMarkdown: `![a](${localUrl("pt-only.png")})` },
      { contentMarkdown: "English version without the image" },
    ];

    expect(await sweepUnusedPostMedia(POST_ID)).toEqual([]);
  });

  it("matches the key regardless of host or how the image is embedded", async () => {
    storage.keys = [key("html.png"), key("ref.png")];
    db.translations = [
      {
        contentMarkdown: [
          `<img src="${prodUrl("html.png")}" width="400">`,
          "![chart][1]",
          `[1]: ${prodUrl("ref.png")}`,
        ].join("\n"),
      },
    ];

    expect(await sweepUnusedPostMedia(POST_ID)).toEqual([]);
  });

  it("keeps images referenced from stored campaign HTML", async () => {
    storage.keys = [key("in-email.png")];
    db.campaigns = [{ content: `<img src="${localUrl("in-email.png")}">` }];

    expect(await sweepUnusedPostMedia(POST_ID)).toEqual([]);
  });

  it("keeps replaced covers once the post went out in a newsletter", async () => {
    storage.keys = [key("cover-current.png"), key("cover-sent.png"), key("stray.png")];
    db.covers = [{ coverImageUrl: localUrl("cover-current.png") }];
    db.sentCampaigns = 1;

    // Inline images still go: emails only carry the cover.
    expect(await sweepUnusedPostMedia(POST_ID)).toEqual([key("stray.png")]);
  });

  it("does not touch storage for an invalid id", async () => {
    storage.keys = [key("x.png")];

    expect(await sweepUnusedPostMedia("../etc")).toEqual([]);
    expect(storage.deleted).toEqual([]);
  });
});
