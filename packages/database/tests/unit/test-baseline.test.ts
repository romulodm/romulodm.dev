import { describe, expect, it } from "vitest";

describe("database unit baseline", () => {
  it("runs with the shared unit setup", () => {
    expect(process.env.TEST_SUITE).toBe("unit");
  });
});
