import { describe, expect, it } from "vitest";

import { getIntegrationRuntime } from "../../../testing/integration/runtime";

describe("portfolio integration baseline", () => {
  it("loads the shared integration bootstrap", () => {
    const runtime = getIntegrationRuntime("portfolio");

    expect(runtime.surface).toBe("portfolio");
    expect(runtime.suite).toBe("integration");
    expect(runtime.databaseUrl).toContain("postgres");
    expect(runtime.redisUrl).toContain("redis://");
  });
});
