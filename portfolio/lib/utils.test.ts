import { describe, expect, it, vi } from "vitest";

import {
  cn,
  decryptLanyardData,
  encryptLanyardData,
  formatDistanceToNow,
} from "./utils";

describe("formatDistanceToNow", () => {
  it("formats recent dates as relative strings", () => {
    const now = new Date("2026-04-09T22:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    expect(formatDistanceToNow(new Date("2026-04-09T21:59:40.000Z"))).toBe("just now");
    expect(formatDistanceToNow(new Date("2026-04-09T21:30:00.000Z"))).toBe("30m ago");
    expect(formatDistanceToNow(new Date("2026-04-09T19:00:00.000Z"))).toBe("3h ago");
    expect(formatDistanceToNow(new Date("2026-04-05T22:00:00.000Z"))).toBe("4d ago");

    vi.useRealTimers();
  });

  it("falls back to a locale date string for older dates", () => {
    const now = new Date("2026-04-09T22:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    expect(formatDistanceToNow(new Date("2026-02-01T00:00:00.000Z"))).toBe(
      new Date("2026-02-01T00:00:00.000Z").toLocaleDateString(),
    );

    vi.useRealTimers();
  });
});

describe("cn", () => {
  it("merges truthy class values and tailwind conflicts", () => {
    expect(cn("px-2", undefined, "px-4", false, "font-bold")).toBe("px-4 font-bold");
  });
});

describe("lanyard obfuscation", () => {
  it("round-trips usernames and variants", () => {
    const encrypted = encryptLanyardData("romulo-dev", "dark");

    expect(encrypted).not.toContain("romulo-dev");
    expect(decryptLanyardData(encrypted)).toEqual({
      username: "romulo-dev",
      variant: "dark",
    });
  });

  it("supports unicode usernames", () => {
    const encrypted = encryptLanyardData("romulo🚀", "light");

    expect(decryptLanyardData(encrypted)).toEqual({
      username: "romulo🚀",
      variant: "light",
    });
  });

  it("rejects malformed payloads", () => {
    expect(decryptLanyardData("")).toBeNull();
    expect(decryptLanyardData("not-valid")).toBeNull();
  });
});
