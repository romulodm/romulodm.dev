import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  timeout: 30000,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  globalSetup: "./tests/e2e/global.setup.ts",
});
