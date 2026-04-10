import { defineConfig } from "vitest/config";

import { vitestAlias, workspaceRoot } from "./testing/vitest.shared";

export default defineConfig({
  resolve: {
    alias: vitestAlias,
  },
  test: {
    root: workspaceRoot,
    name: "unit",
    environment: "node",
    environmentMatchGlobs: [["**/*.dom.test.ts?(x)", "jsdom"]],
    include: [
      "portfolio/**/*.test.ts",
      "portfolio/**/*.test.tsx",
      "worker/**/*.test.ts",
      "packages/database/**/*.test.ts",
      "packages/queues/**/*.test.ts",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/tests/integration/**",
      "**/tests/e2e/**",
      "frontend/**",
    ],
    setupFiles: ["./testing/setupTests.unit.ts"],
    passWithNoTests: false,
  },
});
