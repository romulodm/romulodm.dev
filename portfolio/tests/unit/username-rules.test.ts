import { describe, expect, it } from "vitest";

import { checkUsername, normalizeUsernameInput } from "@/lib/username-rules";

describe("normalizeUsernameInput", () => {
  it("drops a leading @, surrounding spaces and case", () => {
    expect(normalizeUsernameInput("  @Ana_Silva ")).toBe("ana_silva");
  });
});

describe("checkUsername", () => {
  it.each(["ana", "ana_silva", "dev-2026", "a".repeat(24)])("accepts %s", (value) => {
    expect(checkUsername(value)).toBeNull();
  });

  it.each([
    ["too short", "ab"],
    ["too long", "a".repeat(25)],
    ["uppercase", "Ana"],
    ["space", "ana silva"],
    // A dot would make the proxy treat /profile/<name> as a static file.
    ["dot", "ana.silva"],
    ["accent", "joão"],
    ["e-mail", "ana@example.com"],
  ])("rejects %s", (_label, value) => {
    expect(checkUsername(value)).toBe("format");
  });

  it("flags reserved names separately from format errors", () => {
    expect(checkUsername("admin")).toBe("reserved");
  });
});
