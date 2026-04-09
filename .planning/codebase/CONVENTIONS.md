# Coding Conventions

**Analysis Date:** 2026-04-08

## Naming Patterns

**Files:**
- PascalCase for many React components, especially UI/feature components such as `portfolio/components/auth/LoginForm.tsx`
- kebab-case or descriptive lower-case for utilities and server helpers such as `portfolio/lib/auth-helpers.ts`, `portfolio/lib/newsletter/newsletter.service.ts`, `worker/workers/email.worker.ts`
- Next.js route handlers always use `route.ts`

**Functions:**
- camelCase for functions throughout the repo
- Async functions do not use a special prefix; names describe intent (`dispatchCampaign`, `confirmSubscription`, `scheduleDailyStatus`)
- HTTP handlers use exported uppercase verb names (`GET`, `POST`, etc.) per Next.js convention

**Variables:**
- camelCase for locals and module-scoped values
- UPPER_SNAKE_CASE for queue names and other constants such as `QUEUE_TRANSACTIONAL`, `WINDOW_MS`, `MAX_REQUESTS`
- No underscore-prefixed privacy convention observed

**Types:**
- Interfaces and type aliases use PascalCase (`CampaignEmailJob`, `PresignedUploadResult`, `ModerationResult`)
- Prisma enums use PascalCase enum names and UPPER_CASE values

## Code Style

**Formatting:**
- Semicolons are common in TypeScript-heavy areas (`portfolio/`, `worker/`, `packages/`)
- Quotes are mixed across the repo: older/legacy areas often use single quotes, newer Next/worker files frequently use double quotes
- Indentation is mixed: many TS files use 2 spaces, while some shared package files use 4 spaces
- There is no obvious single formatter config checked in at the root

**Linting:**
- `frontend/` has explicit ESLint config in `frontend/.eslintrc.cjs`
- `portfolio/package.json` exposes `next lint`
- There is no repo-wide lint orchestration script at the root

## Import Organization

**Order:**
1. External packages
2. Shared/internal aliases such as `@/` and `@romulo/...`
3. Relative imports

**Grouping:**
- Blank lines between groups are common
- Imports are usually organized for readability, but strict alphabetical ordering is not consistently enforced

**Path Aliases:**
- `@/*` maps to `portfolio/*`
- `@romulo/database` and `@romulo/queues` are consumed as workspace packages from both app and worker

## Error Handling

**Patterns:**
- Route handlers usually return JSON error responses rather than throwing for expected failures
- Worker jobs throw on processing failure so BullMQ retries/backoff can handle transient issues
- Manual validation/guard clauses are heavily used at the top of request handlers

**Error Types:**
- Plain `Error` objects are the norm
- Custom error classes are not a prevailing pattern
- Errors are often logged inline right before returning/throwing

## Logging

**Framework:**
- `console.log`, `console.warn`, and `console.error`
- No structured logger or log abstraction was found

**Patterns:**
- Logging is common at service boundaries, queue startup, and worker execution
- Several files log operational milestones and debug details directly, especially under `worker/`
- New code should preserve useful operational logs but avoid leaking secrets or noisy payloads

## Comments

**When to Comment:**
- Comments often explain intent or recent bug fixes, especially in business logic flows
- Some comments are in Portuguese and describe processing steps in detail
- Inline “section divider” comments are common in newsletter, worker, and moderation code

**JSDoc/TSDoc:**
- Rare overall; most functions rely on TypeScript types and descriptive naming

**TODO Comments:**
- Very few actionable first-party TODO markers were found outside dependencies
- Existing comments are more explanatory than backlog-oriented

## Function Design

**Size:**
- Small helpers coexist with longer route handlers/service modules
- Complex request handlers frequently keep validation, data access, and orchestration in one file

**Parameters:**
- Small positional parameter lists are common
- Object parameters are used when payloads become richer, especially around worker jobs and templates

**Return Values:**
- Guard-clause early returns are common in route handlers
- Service functions often return small status objects such as `{ status: "confirmed" }`

## Module Design

**Exports:**
- Named exports are preferred in server/shared code
- React components are generally default or named exports depending on file age; there is no single rigid rule
- Shared packages expose minimal public APIs from `index.ts`

**Barrel Files:**
- Used sparingly, mainly for workspace packages
- Most feature directories import concrete files directly

## Practical Guidance

- Match the style of the area you are editing rather than forcing repo-wide normalization.
- In `portfolio/` and `worker/`, prefer TypeScript with explicit types at integration boundaries.
- Preserve existing alias usage (`@/`, `@romulo/...`) instead of replacing with long relative paths.
- Keep route-level validation close to the handler unless a domain helper already exists.
- Treat the Vite `frontend/` app as legacy style; avoid importing its patterns into the main Next.js app unless necessary.

---
*Convention analysis: 2026-04-08*
*Update when patterns change*
