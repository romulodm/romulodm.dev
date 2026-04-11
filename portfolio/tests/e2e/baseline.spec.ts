import { expect, test } from "@playwright/test";

test("portfolio front door redirects into the localized landing page", async ({
  page,
}, testInfo) => {
  expect(process.env.PLAYWRIGHT_TEST_BASE_URL).toBeTruthy();
  expect(testInfo.project.use.baseURL).toBeTruthy();
  expect(String(testInfo.project.use.baseURL)).toContain("127.0.0.1");

  await page.goto("/", { waitUntil: "networkidle" });

  await page.waitForURL(/\/(pt|en)$/, { timeout: 20000 });
  await expect(page).toHaveURL(/\/(pt|en)$/);
  await expect(page.getByRole("link", { name: "~/romulodm" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Works with everything." }).first()).toBeVisible();
});
