import { describe, expect, it } from "vitest";

import { getIntegrationRuntime } from "../../../../testing/integration/runtime";

describe("database integration baseline", () => {
  it("loads the shared integration bootstrap", () => {
    const runtime = getIntegrationRuntime("packages/database");

    expect(runtime.surface).toBe("packages/database");
    expect(runtime.suite).toBe("integration");
    expect(runtime.databaseUrl).toContain("postgres://");
    expect(runtime.redisUrl).toContain("redis://");
  });
});
