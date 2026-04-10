import { expect, test, type Page } from "@playwright/test";

const adminEmail =
  process.env.PLAYWRIGHT_ADMIN_EMAIL ?? "phase3-e2e-admin@example.com";
const adminPassword =
  process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "Phase3E2E!234";

async function signInAsAdmin(page: Page) {
  const csrfToken = await page.evaluate(async () => {
    const response = await fetch("/api/auth/csrf");
    const body = await response.json();
    return body.csrfToken as string;
  });

  await page.evaluate(
    async ({ csrfToken, email, password }) => {
      const payload = new URLSearchParams({
        csrfToken,
        email,
        password,
        callbackUrl: "/pt/admin",
        json: "true",
      });

      await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
      });
    },
    { csrfToken, email: adminEmail, password: adminPassword },
  );
}

test("unauthenticated admin access redirects back to the front door", async ({
  page,
}) => {
  await page.goto("/pt/admin", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/pt$/);
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
});

test("admin can sign in from the app shell and reach the dashboard", async ({
  page,
}) => {
  await page.goto("/pt", { waitUntil: "domcontentloaded" });
  await signInAsAdmin(page);
  await page.goto("/pt/admin", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/pt\/admin$/);
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("romulodm.dev")).toBeVisible();
});
