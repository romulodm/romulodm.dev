import { describe, expect, it } from "vitest";

import { formatCount } from "./format-number";

describe("formatCount", () => {
  it("returns small numbers without suffixes", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(999)).toBe("999");
  });

  it("formats thousands with a short k suffix", () => {
    expect(formatCount(1_000)).toBe("1k");
    expect(formatCount(1_500)).toBe("1.5k");
    expect(formatCount(9_999)).toBe("9k");
    expect(formatCount(25_000)).toBe("25k");
  });

  it("formats millions with a short M suffix", () => {
    expect(formatCount(1_000_000)).toBe("1M");
    expect(formatCount(1_500_000)).toBe("1.5M");
    expect(formatCount(12_300_000)).toBe("12M");
  });
});
