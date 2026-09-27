# Coding Conventions

**Analysis Date:** 2026-09-25

Monorepo (npm workspaces): `portfolio/` (Next.js 16 App Router), `worker/` (BullMQ worker, runs via `tsx`), `packages/database`, `packages/queues`, `packages/templates`, `packages/web3`. Everything is TypeScript.

## Naming Patterns

**Files:**
- React components: PascalCase `.tsx` — `portfolio/components/comments/DeleteCommentModal.tsx`, `portfolio/components/navigation/Navbar.tsx`
- shadcn/Radix UI primitives: lowercase kebab — `portfolio/components/ui/button.tsx`, `portfolio/components/ui/dropdown-menu.tsx` (exception: `UserAvatar.tsx`)
- Library modules: kebab-case `.ts` — `portfolio/lib/api-errors.ts`, `portfolio/lib/rate-limit.ts`, `portfolio/lib/status-cache.ts`
- Hooks: mixed (`portfolio/hooks/use-mobile.ts`, `use-post-interactions.ts`, `useTurnstile.ts`). Use kebab-case `use-<name>.ts` for new hooks.
- Worker processors: `<domain>.worker.ts` in `worker/workers/` — `views.worker.ts`, `email.worker.ts`
- Next.js route files follow framework names: `route.ts`, `page.tsx`, `layout.tsx`, `actions.ts` (server actions), `error.tsx`, `not-found.tsx`
- Client halves of server pages: `<Name>Client.tsx` beside `page.tsx` — `portfolio/app/[locale]/newsletter/confirm/[token]/NewsletterConfirmClient.tsx`, `portfolio/components/blog/BlogListClient.tsx`
- Validation schemas: `schemas.ts` beside the consuming components — `portfolio/components/auth/schemas.ts`
- Component-local types: `types.ts` — `portfolio/components/profile/types.ts`

**Functions:**
- camelCase, verb-first: `requireAuth`, `requireAdmin`, `getRequestIp`, `rateLimit`, `parseJsonBodyWithMessages`, `flushViewsBuffer`, `scheduleViewsFlush`
- Response builders end in `Response`: `badRequestResponse`, `unauthorizedResponse`, `internalErrorResponse` (`portfolio/lib/api-errors.ts`)
- Worker lifecycle: `start<Name>Worker` / `schedule<Name>` (`worker/index.ts`)
- Factories: `create<Thing>` — `createQueue`, `createFailureTracker`, `createVoteSchema`
- Event handlers inside components: `handle<Event>` — `handleConfirm`
- Route handlers: exported uppercase HTTP verbs — `export async function PUT(request, props)`

**Variables:**
- camelCase for locals; SCREAMING_SNAKE_CASE for module constants and Redis keys/queue names: `WORKER_HEALTH_KEY`, `MAX_LOGS`, `QUEUE_NOTIFICATIONS`, `VIEWS_BUFFER_KEY`, `PROFILE_CACHE_TAG`, `AVATAR_SELECT`
- Module-private mutable singletons prefixed with `_`: `let _redis: Redis | null = null` (`worker/lib/worker-observability.ts`)
- Unused args/vars prefixed with `_` (enforced by lint `argsIgnorePattern: '^_'`)
- Translator is always `t`: `const t = useTranslations("commentsUi.deleteModal")` / `const t = await getApiTranslator(request)`

**Types:**
- PascalCase. Props interfaces: `<Component>Props` (`DeleteCommentModalProps`)
- Discriminated unions with `ok` boolean for result objects:
  ```typescript
  type RouteAuthResult =
    | { ok: true; session: Session; user: Session["user"] & { id: string; admin: boolean } }
    | { ok: false; status: 401 | 403; reason: "unauthorized" | "forbidden" };
  ```
  (`portfolio/lib/auth-helpers.ts`)
- String-literal unions instead of enums: `type LogLevel = "info" | "warn" | "error"`, `type ErrorCode = "invalid_request" | ...`
- Derive form types from Zod: `export type LoginValues = z.infer<typeof loginSchema>`
- Use `import type` for type-only imports: `import type { Queue } from "bullmq"`
- Both `interface` and `type` aliases appear; use `interface` for object shapes/props, `type` for unions and args objects.

## Code Style

**Formatting:**
- No Prettier/Biome/EditorConfig configured. Formatting is manual and inconsistent across files.
- Quotes: double quotes dominate (~243 files with double-quoted imports vs ~173 single). Use double quotes and semicolons for new code; when editing an existing file, match that file's style (e.g. `portfolio/lib/utils.ts` and `portfolio/app/sitemap.test.ts` use single quotes and no semicolons).
- Indentation: 2 spaces in most files; some files use 4 (`portfolio/lib/auth-helpers.ts`, `portfolio/hooks/auth-guard.tsx`, `portfolio/app/[locale]/profile/[username]/actions.ts`, `packages/queues/tests/unit/scheduling.test.ts`). Match the file being edited.
- Trailing commas in multi-line argument lists and objects.
- Line endings: LF enforced via `.gitattributes` (`* text=auto eol=lf`).
- ~59 source files start with a UTF-8 BOM (e.g. `portfolio/app/api/comments/[id]/vote/route.ts`, `portfolio/components/comments/DeleteCommentModal.tsx`). Do not add BOMs to new files.

**Linting:**
- ESLint 9 flat config at repo root: `eslint.config.mjs`. Run `npm run lint` / `npm run lint:fix` from root.
- Base: `@eslint/js` recommended + `typescript-eslint` recommended; `@next/eslint-plugin-next` recommended + core-web-vitals for `portfolio/**`.
- Errors: `unused-imports/no-unused-imports`, `react-hooks/rules-of-hooks`.
- Warnings (tolerated debt): `@typescript-eslint/no-explicit-any`, `unused-imports/no-unused-vars`, `react-hooks/exhaustive-deps`, `@next/next/no-img-element`, `@typescript-eslint/no-empty-object-type`, `@typescript-eslint/ban-ts-comment` (`@ts-expect-error` allowed with description).
- Off: `@typescript-eslint/no-non-null-assertion`, `@next/next/no-html-link-for-pages` (App Router; still use `next/link` for internal routes).
- `no-control-regex` disabled only for `portfolio/lib/api-validation.ts` and `portfolio/lib/**/sanitize*.ts`.
- `no-explicit-any` off in `**/*.test.{ts,tsx}` and `**/tests/**`.
- TypeScript: `strict: true` but `noImplicitAny: false` in `portfolio/tsconfig.json`. Typecheck with `npm run typecheck` (portfolio + worker, `tsc --noEmit`).

## Import Organization

**Order (observed in well-kept files like `portfolio/app/api/comments/[id]/vote/route.ts`, `worker/index.ts`):**
1. Side-effect imports first when required (`import "./env"; import "./lib/sentry";` in `worker/index.ts`)
2. External packages (`next/server`, `zod`, `bullmq`, `lucide-react`)
3. Internal workspace packages (`@romulo/database`, `@romulo/queues`)
4. App aliases (`@/lib/...`, `@/components/...`)
5. Relative imports (`./sentry`, `../../lib/redis`)

Separate groups with a blank line. Many older files do not group; follow the order above for new code.

**Path Aliases:**
- `@/*` -> `portfolio/*` (`portfolio/tsconfig.json`; mirrored in `testing/vitest.shared.ts`)
- `@romulo/queues` -> `packages/queues/index.ts` (source, not dist)
- `@romulo/database`, `@romulo/templates`, `@romulo/web3` resolve as workspace packages (build them with `npm run ci:packages`)
- `worker/` has no alias; use relative imports.

## Error Handling

**API routes (`portfolio/app/api/**/route.ts`) — use this exact shape:**
```typescript
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const t = await getApiTranslator(request);
  const params = await props.params;
  const auth = await requireAuth();
  if (!auth.ok) return unauthorizedResponse(t("common.unauthorized"));

  try {
    if (await rateLimit(`comments:vote:${auth.user.id}:${getRequestIp(request)}`, 30, 60)) {
      return rateLimitResponse(t("comments.rateLimited"));
    }
    const body = await parseJsonBodyWithMessages(request, createSchema(t), {
      invalidBodyMessage: t("common.invalidBody"),
      fallbackMessage: t("common.invalidRequest"),
    });
    // ... prisma work ...
    return NextResponse.json({ ... });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error, t("common.invalidRequest"));
    }
    return internalErrorResponse("comments-vote", error, t("common.internalError"));
  }
}
```
- Always return errors through helpers in `portfolio/lib/api-errors.ts`. Payload shape is `{ error, message, code }`.
- Auth gates: `requireAuth`, `requireAdmin`, `requireOwnerOrAdmin` from `portfolio/lib/auth-helpers.ts` return a result union — branch on `auth.ok`, never throw.
- Body validation: Zod schema + `parseJsonBodyWithMessages` (`portfolio/lib/api-validation.ts`), which throws `RequestValidationError`. Sanitize free text with `sanitizePlainText` / `sanitizeMultilineText` / `optionalPlainText`.
- The first argument of `internalErrorResponse` / `logApiError` is a kebab-case context tag (`"comments-vote"`); it becomes the Sentry tag and fingerprint.
- Error messages are localized via `getApiTranslator` (`portfolio/lib/api-intl.ts`); defaults in helpers are Portuguese.

**Client components:**
- Wrap async actions in `try/catch` and surface failures with `react-toastify`: `toast.error(t("errors.delete"))`. Empty `catch {}` without binding is allowed.

**Worker:**
- Use `logWorkerError` / `recordQueueFailure` / `captureWorkerException` from `worker/lib/worker-observability.ts` and `worker/lib/sentry.ts`. Normalize unknown errors with `error instanceof Error ? error.message : String(error)`.

## Logging

**Framework:** `console` + Sentry (`@sentry/nextjs` in portfolio, `@sentry/node` in worker)

**Patterns:**
- Portfolio server errors: `logApiError(context, error, metadata?)` — logs `console.error("[context]", ...)` and captures in Sentry with tag `api_context`.
- Worker: structured events via `logWorkerEvent("info", "worker.starting")` (dot-namespaced event names, persisted to Redis ring buffer `worker:logs:recent`).
- Avoid new `console.log` in app code (61 existing occurrences are debt). `no-console` is only explicitly off for scripts, configs and `testing/**`.

## Comments

**When to Comment:**
- Explain *why*, not what. Comments are frequently long rationale blocks describing the bug or constraint that motivated the code (see `eslint.config.mjs`, `vitest.config.ts`, `testing/stubs/server-only.ts`, `portfolio/lib/rate-limit.test.ts`).
- Language: Portuguese is predominant in comments and test names (often without accents); English also appears (`worker/index.ts`, `.github/workflows/ci.yml`). Either is acceptable; stay consistent within a file.
- Section dividers with box-drawing rule lines are a house style (52 files):
  ```typescript
  // ── Exports públicos ──────────────────────────────────────────────────────────
  ```
- TODO/FIXME comments are essentially absent (1 occurrence); do not leave TODOs — fix or document rationale.

**JSDoc/TSDoc:**
- Used sparingly, as `/** ... */` above exported helpers or constants for intent (`/** Call once in main() to enable log persistence to Redis. */`). No `@param`/`@returns` tagging convention.
- Test files often open with a `/** ... */` block listing the scenarios covered (`portfolio/app/api/donations/__tests__/pix-webhook.test.ts`).

## Function Design

**Size:** Keep helpers small and single-purpose (`portfolio/lib/api-errors.ts`, `portfolio/lib/auth-helpers.ts`). Route handlers are linear: translate -> auth -> rate-limit -> validate -> DB -> respond.

**Parameters:**
- Use an args object with defaults for 3+ optional params: `listUserComments({ userId, take = 10, cursor = null }: ListUserCommentsArgs)`.
- Positional params with default values for short helpers: `badRequestResponse(message = "...", code = "invalid_request")`.
- Inject dependencies (Redis, queues) as parameters for testability: `flushViewsBuffer(redis)`, `scheduleViewsFlush(redis)`, `registerRepeatable(queue, ...)`.

**Return Values:**
- Result unions (`{ ok: true, ... } | { ok: false, ... }`) for expected failures; throw only for validation (`RequestValidationError`) or truly exceptional errors.
- Return `null` for "not found / unavailable" from data helpers (e.g. `getNpmWeeklyDownloads` resolves `null` on non-200).
- Early returns for guards (`if (!open) return null;`, `if (!auth.ok) return auth;`).

## Module Design

**Exports:**
- Prefer named exports for components, hooks and lib functions (`export function DeleteCommentModal`, `export function useAuthGuard`). ~40 of 154 components use `export default`; Next.js `page.tsx`/`layout.tsx` must default-export.
- Mark client components with `"use client";` on line 1; server actions files with `"use server";`. Server-only modules import `"server-only"` (`portfolio/lib/views-internal.ts`, `portfolio/lib/visitor.ts`, `portfolio/lib/status-cache.ts`).
- Cached server reads use `unstable_cache` with tags from `portfolio/lib/cache-tags.ts`.
- i18n: all user-facing strings go through `next-intl` (`useTranslations` in client, `getTranslations`/`getApiTranslator` on server). Add keys to both `portfolio/messages/en.json` and `portfolio/messages/pt.json` (kept line-for-line in sync).
- Styling: Tailwind classes composed with `cn()` from `portfolio/lib/utils.ts` (`clsx` + `tailwind-merge`); variants via `class-variance-authority` in `portfolio/components/ui/`.

**Barrel Files:**
- Only in workspace packages: `packages/queues/index.ts` re-exports `./src/*` with `export * from`. Do not create barrels inside `portfolio/`; import modules directly.

---

*Convention analysis: 2026-09-25*
