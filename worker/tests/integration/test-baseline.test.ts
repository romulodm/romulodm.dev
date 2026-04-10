import { describe, expect, it } from "vitest";

import { getIntegrationRuntime } from "../../../testing/integration/runtime";

describe("worker integration baseline", () => {
  it("loads the shared integration bootstrap", () => {
    const runtime = getIntegrationRuntime("worker");

    expect(runtime.surface).toBe("worker");
    expect(runtime.suite).toBe("integration");
    expect(runtime.databaseUrl).toContain("postgres://");
    expect(runtime.redisUrl).toContain("redis://");
  });
});
