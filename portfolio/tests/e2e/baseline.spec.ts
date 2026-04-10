import { expect, test } from "@playwright/test";

test("portfolio e2e baseline is configured", async ({}, testInfo) => {
  expect(process.env.PLAYWRIGHT_TEST_BASE_URL).toBeTruthy();
  expect(testInfo.project.use.baseURL).toBeTruthy();
  expect(String(testInfo.project.use.baseURL)).toContain("127.0.0.1");
});
