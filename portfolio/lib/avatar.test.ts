import { SEEDICON_STYLES } from "seedicon";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_AVATAR_STYLE,
  avatarPayloadSchema,
  avatarSeedSchema,
  avatarStyleSchema,
  toAvatarStyle,
  usesSeedicon,
} from "./avatar";
import { getNpmWeeklyDownloads } from "@/components/sections/projects/data";

describe("avatarStyleSchema", () => {
  it("accepts every style the package actually ships", () => {
    for (const style of SEEDICON_STYLES) {
      expect(avatarStyleSchema.safeParse(style).success).toBe(true);
    }
  });

  // `ring` still resolves inside seedicon for backwards compatibility, but it
  // is deliberately outside SEEDICON_STYLES — so it must not be selectable.
  it("rejects the legacy ring style", () => {
    expect(avatarStyleSchema.safeParse("ring").success).toBe(false);
  });

  it("rejects made-up style names", () => {
    expect(avatarStyleSchema.safeParse("nope").success).toBe(false);
    expect(avatarStyleSchema.safeParse("").success).toBe(false);
    expect(avatarStyleSchema.safeParse("PIXELS").success).toBe(false);
  });
});

describe("avatarSeedSchema", () => {
  it("accepts a generated UUID", () => {
    expect(avatarSeedSchema.safeParse(crypto.randomUUID()).success).toBe(true);
  });

  it("rejects anything that is not a UUID", () => {
    expect(avatarSeedSchema.safeParse("").success).toBe(false);
    expect(avatarSeedSchema.safeParse("romulo").success).toBe(false);
    // A cuid, which is what every other id in the schema looks like.
    expect(avatarSeedSchema.safeParse("clw3k2h9x0000abcd1234efgh").success).toBe(false);
  });
});

describe("avatarPayloadSchema", () => {
  it("accepts a well-formed payload", () => {
    const result = avatarPayloadSchema.safeParse({
      seed: crypto.randomUUID(),
      style: "truchet",
      source: "SEEDICON",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown source", () => {
    const result = avatarPayloadSchema.safeParse({
      seed: crypto.randomUUID(),
      style: "truchet",
      source: "GRAVATAR",
    });
    expect(result.success).toBe(false);
  });
});

describe("toAvatarStyle", () => {
  it("passes supported styles through", () => {
    expect(toAvatarStyle("heraldry")).toBe("heraldry");
  });

  // Guards rows written before a style was removed from a future seedicon
  // release: the avatar falls back instead of failing to render.
  it("falls back to the default for unknown values", () => {
    expect(toAvatarStyle("ring")).toBe(DEFAULT_AVATAR_STYLE);
    expect(toAvatarStyle("")).toBe(DEFAULT_AVATAR_STYLE);
  });
});

describe("usesSeedicon", () => {
  it("renders the provider photo when that is the choice", () => {
    expect(usesSeedicon({ image: "https://x/y.png", avatarSource: "PROVIDER" })).toBe(false);
  });

  it("renders the seedicon when that is the choice", () => {
    expect(usesSeedicon({ image: "https://x/y.png", avatarSource: "SEEDICON" })).toBe(true);
  });

  // A PROVIDER row with no photo would otherwise render nothing at all.
  it("falls back to the seedicon when PROVIDER has no photo", () => {
    expect(usesSeedicon({ image: null, avatarSource: "PROVIDER" })).toBe(true);
  });
});

describe("getNpmWeeklyDownloads", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the download count", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ downloads: 448, package: "seedicon" }),
      }),
    );
    await expect(getNpmWeeklyDownloads("seedicon")).resolves.toBe(448);
  });

  // The projects section must survive the npm API being unavailable: a null
  // just makes the card show forks again.
  it("returns null on a non-200 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(getNpmWeeklyDownloads("seedicon")).resolves.toBeNull();
  });

  it("returns null when the payload has no numeric downloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ error: "not found" }) }),
    );
    await expect(getNpmWeeklyDownloads("nope")).resolves.toBeNull();
  });

  it("returns null when the response is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError("Unexpected token <");
        },
      }),
    );
    await expect(getNpmWeeklyDownloads("seedicon")).resolves.toBeNull();
  });

  it("returns null when fetch itself rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    await expect(getNpmWeeklyDownloads("seedicon")).resolves.toBeNull();
  });
});
