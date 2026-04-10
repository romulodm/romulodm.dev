import { describe, expect, it } from "vitest";

import { getIntegrationRuntime } from "../../../../testing/integration/runtime";

describe("queues integration baseline", () => {
  it("loads the shared integration bootstrap", () => {
    const runtime = getIntegrationRuntime("packages/queues");

    expect(runtime.surface).toBe("packages/queues");
    expect(runtime.suite).toBe("integration");
    expect(runtime.databaseUrl).toContain("postgres");
    expect(runtime.redisUrl).toContain("redis://");
  });
});
