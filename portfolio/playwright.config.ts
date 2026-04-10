import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:3100";

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
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      ...process.env,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "phase-3-e2e-secret",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "phase-3-google-client-id",
      GOOGLE_CLIENT_SECRET:
        process.env.GOOGLE_CLIENT_SECRET ?? "phase-3-google-client-secret",
      NEXT_PUBLIC_APP_URL:
        process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3100",
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "romulodm.dev",
    },
  },
});
