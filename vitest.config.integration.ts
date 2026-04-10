import { defineConfig } from "vitest/config";

import { vitestAlias, workspaceRoot } from "./testing/vitest.shared";

export default defineConfig({
  resolve: {
    alias: vitestAlias,
  },
  test: {
    root: workspaceRoot,
    name: "integration",
    environment: "node",
    fileParallelism: false,
    maxWorkers: 1,
    include: [
      "portfolio/tests/integration/**/*.test.ts",
      "worker/tests/integration/**/*.test.ts",
      "packages/database/tests/integration/**/*.test.ts",
      "packages/queues/tests/integration/**/*.test.ts",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "frontend/**",
    ],
    setupFiles: ["./testing/setupTests.integration.ts"],
    passWithNoTests: false,
    testTimeout: 15000,
  },
});
