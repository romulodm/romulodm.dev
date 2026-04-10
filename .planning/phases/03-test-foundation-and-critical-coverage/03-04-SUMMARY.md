## Summary

Wave 4 added narrow Playwright smoke coverage for the must-not-break browser paths in the active Next.js portfolio app.

## What Shipped

- Expanded `portfolio/playwright.config.ts` to run the app on a dedicated local test port with a managed Playwright web server.
- Upgraded `portfolio/tests/e2e/global.setup.ts` to seed a deterministic admin account for auth-critical browser checks.
- Replaced the placeholder browser baseline with real front-door coverage in `portfolio/tests/e2e/baseline.spec.ts`.
- Added `portfolio/tests/e2e/auth-admin.spec.ts` to cover:
  - unauthenticated admin access redirect behavior
  - authenticated admin dashboard access through a deterministic browser-level NextAuth sign-in flow
- Patched `portfolio/messages/pt.json` and `portfolio/messages/en.json` with the missing translation keys that were preventing the front door from rendering during E2E verification.

## Verification

- `npm run test:e2e` passed.
- `npm run test:phase3` passed, covering unit, integration, and E2E together.

## Notes

- The front door smoke test intentionally accepts the localized landing page selected by the browser (`/pt` or `/en`) instead of hardcoding a single locale.
- In this environment, browser verification required an explicit Playwright Chromium install and escalated execution because browser/server child processes are blocked by the default sandbox.
