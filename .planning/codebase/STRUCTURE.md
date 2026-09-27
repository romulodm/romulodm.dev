# Codebase Structure

**Analysis Date:** 2026-09-25

## Directory Layout

```
romulodm.dev/
├── .github/workflows/      # CI (ci.yml), deploy (deploy.yml), security scans
├── .planning/              # GSD planning docs (PROJECT, ROADMAP, STATE, codebase/)
├── backup/                 # Postgres backup container (backup.sh + Dockerfile)
├── bot/                    # Python Telegram notification bridge (Render)
├── cron/                   # Ofelia scheduler config (config.ini)
├── nginx/                  # nginx.conf, templates/ per env, conf.d/ includes, scripts/
├── packages/               # Shared npm workspaces
│   ├── database/           # @romulo/database: Prisma schema, migrations, client, settlement
│   ├── queues/             # @romulo/queues: BullMQ queue/job contracts + helpers
│   ├── templates/          # @romulo/templates: email HTML templates
│   └── web3/               # @romulo/web3: on-chain config, price, encryption
├── portfolio/              # Next.js 16 app (UI + API + admin)
│   ├── app/                # App Router
│   │   ├── [locale]/       # All pages (pt/en)
│   │   ├── api/            # Route Handlers (no locale prefix)
│   │   └── feed.xml/       # Root RSS route
│   ├── components/         # React components by feature
│   ├── content/legal/      # Legal markdown per locale + config.ts
│   ├── data/               # Static content (resume, timeline, papers)
│   ├── hooks/              # Client hooks
│   ├── i18n/               # next-intl routing/request/navigation
│   ├── lib/                # Server/shared logic
│   ├── messages/           # UI translations (en.json, pt.json)
│   ├── public/             # Static assets
│   ├── scripts/            # One-off maintenance scripts
│   ├── styles/             # Extra CSS (apoiase.css)
│   ├── tests/              # unit/, integration/, e2e/ (Playwright)
│   ├── types/              # Ambient .d.ts (next-auth, ethereum, r3f)
│   ├── proxy.ts            # next-intl middleware
│   └── instrumentation.ts  # Sentry registration
├── scripts/                # Repo-level scripts (rate-limit check, Spotify auth)
├── search/                 # Go search service (api/, engine/, main.go)
├── testing/                # Shared Vitest config/aliases/setup/stubs
├── worker/                 # BullMQ worker runtime
│   ├── lib/                # email providers, alerts, redis, sentry, observability
│   ├── workers/            # one *.worker.ts per concern
│   ├── scripts/            # ga4-check.ts
│   └── tests/              # unit/, integration/
├── docker-compose.dev.yml          # Local stack
├── docker-compose.dev.nginx.yml    # Local stack with nginx
├── docker-compose.prod.yml         # Production stack (GHCR images)
├── eslint.config.mjs               # Monorepo ESLint flat config
├── vitest.config.ts                # Unit tests (all workspaces)
├── vitest.config.integration.ts    # Integration tests
└── package.json                    # Workspaces + orchestration scripts
```

## Directory Purposes

**`portfolio/app/[locale]/`:**
- Purpose: every user-facing page, localized
- Contains: `page.tsx` (async Server Component), `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, colocated client components, `actions.ts` (server actions)
- Key routes: `page.tsx` (home), `blog/`, `blog/[slug]/`, `comments/[id]/`, `profile/[username]/`, `wall/`, `support/` (donations), `newsletter/` (+ `confirm/[token]`, `unsubscribe/[token]`), `resume/`, `status/`, `legal/` (`privacy-policy/`, `terms/`), `feed.xml/route.ts`, `admin/`
- Admin: `admin/layout.tsx` (guard + `AdminSidebar`), `admin/posts/`, `admin/newsletter/` (campaigns, templates), `admin/donations/` (+ `crypto/`), `admin/contact/`, `admin/suspicious-comments/`, `admin/banned-users/`, `admin/observability/` (backups, search, system)

**`portfolio/app/api/`:**
- Purpose: JSON HTTP API and webhooks
- Contains: `route.ts` files that export HTTP-method functions
- Groups: `admin/*` (analytics, contact, dashboard, newsletter, observability, resync, suspicious-comments, users), `auth/*` (`[...nextauth]`, `register`, `forgot-password`), `comments/*`, `contact/`, `donations/*` (eth, onchain, pix, stripe, ranking; tests in `donations/__tests__/`), `newsletter/*`, `posts/*` (public, random, `[id]/like`, `[id]/view`), `presence/`, `prices/`, `profile/` (+ `avatar/`), `search/`, `status/`, `telegram/webhook/`, `uploads/presign/`, `wall/` (+ `[id]/`)

**`portfolio/components/`:**
- Purpose: React components grouped by feature
- Feature folders: `admin/` (`crypto/`, `dashboard/`, `donations/`, `observability/`), `auth/`, `blog/` (+ `carousel/`), `comments/`, `editor/`, `icons/`, `lanyard/`, `legal/`, `modals/`, `navigation/`, `newsletter/`, `observability/`, `profile/` (+ `tabs/`), `resume/`, `sections/` (home page: `bento/`, `contact/`, `hero/`, `posts/`, `presence/`, `projects/`, `terminal/`, `vision/`), `seo/`, `support/`, `wall/` (`cards/`, `ui/`)
- Primitives: `ui/` (shadcn-style `button.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `input.tsx`, `select.tsx`, `tooltip.tsx`, `UserAvatar.tsx`)
- Top-level shared: `Footer.tsx`, `CookieBanner.tsx`, `ToastProvider.tsx`, `GoogleAnalytics.tsx`, `Logo.tsx`, `AnimatedSection.tsx`, `FAQ.tsx`

**`portfolio/lib/`:**
- Purpose: server logic and shared utilities (flat files + subfolders by domain)
- Key files: `auth.ts`, `auth-helpers.ts`, `api-errors.ts`, `api-validation.ts`, `api-intl.ts`, `rate-limit.ts`, `redis.ts`, `s3.ts`, `search.ts`, `search-sync.ts`, `views.ts`, `views-internal.ts`, `seo.ts`, `locales.ts`, `cache-tags.ts`, `utils.ts`, `markdown.ts`, `feed-xml.ts`, `turnstile.ts`
- Subfolders: `backups/`, `moderation/` (`providers/`, `data/`), `newsletter/`, `payments/`, `presence/`, `queues/`
- Unit tests colocated as `*.test.ts` (e.g. `rate-limit.test.ts`, `utils.test.ts`)

**`packages/database/`:**
- Purpose: single source for the DB schema and client
- Key files: `prisma/schema.prisma`, `prisma/migrations/<timestamp>_<name>/`, `index.ts` (singleton `prisma` + re-export of `@prisma/client`), `settlement.ts`
- Models: User, PasswordResetToken, Post, PostTranslation, PostLike, PostTag, SuspiciousComment, Comment, CommentVote, NewsletterSubscriber, Campaign, CampaignRecipient, CampaignPost, Donation, OnChainDonation, WebhookEvent, WallMessage, ContactMessage

**`packages/queues/`:**
- Key files: `index.ts` (barrel), `src/constants.ts`, `src/types.ts`, `src/options.ts`, `src/ids.ts`, `src/factory.ts`, `src/scheduling.ts`, `src/config.ts`

**`worker/`:**
- Key files: `index.ts` (bootstrap + shutdown), `env.ts`, `workers/email.worker.ts`, `workers/notification.worker.ts`, `workers/views.worker.ts`, `workers/search.worker.ts`, `workers/metrics.worker.ts`, `workers/backup.worker.ts`, `workers/onchain.worker.ts`, `workers/donations.worker.ts`, `workers/game.worker.ts` (not wired into `index.ts`), `lib/email/email.service.ts`, `lib/email/providers/*.provider.ts`, `lib/worker-observability.ts`, `lib/alerts.ts`, `lib/telegram.ts`, `lib/whatsapp.ts`

**`search/`:**
- Key files: `main.go`, `api/handler.go` (routes), `api/snapshot.go` (disk persistence), `engine/engine.go`, `engine/index.go`, `engine/trie.go`, `engine/bktree.go`, `engine/vector.go`, `engine/preprocessor.go`, `engine/highlight.go`

**`testing/`:**
- Key files: `vitest.shared.ts` (aliases `@`, `@romulo/database`, `@romulo/queues`, `server-only` stub), `setupTests.unit.ts`, `setupTests.integration.ts`, `integration/fixtures.ts`, `integration/runtime.ts`, `stubs/server-only.ts`

## Key File Locations

**Entry Points:**
- `portfolio/app/[locale]/layout.tsx`: real root layout (html/body, providers, i18n)
- `portfolio/app/providers.tsx`: client providers (Session, AuthModal, Parallax)
- `portfolio/proxy.ts`: locale middleware
- `portfolio/instrumentation.ts`, `portfolio/instrumentation-client.ts`: Sentry
- `worker/index.ts`: worker bootstrap
- `search/main.go`: search server
- `bot/main.py`: Telegram bridge

**Configuration:**
- `package.json` (root): workspaces and `ci`/`test:*`/`build:*` scripts
- `portfolio/next.config.js`: standalone output, image hosts, next-intl + Sentry wrappers; loads the root `.env`
- `portfolio/tsconfig.json` (`@/*` → `portfolio/*`), `portfolio/tsconfig.build.json`
- `portfolio/tailwind.config.ts`, `portfolio/postcss.config.js`, `portfolio/app/[locale]/globals.css`
- `portfolio/playwright.config.ts`
- `eslint.config.mjs`, `vitest.config.ts`, `vitest.config.integration.ts`
- `docker-compose.{dev,dev.nginx,prod}.yml`, `portfolio/Dockerfile`, `worker/Dockerfile`, `search/Dockerfile`, `backup/Dockerfile`
- `.env`, `.env.production`, `t.env` present at the root (environment configuration; never read or commit contents)

**Core Logic:**
- `portfolio/lib/auth.ts`, `portfolio/lib/auth-helpers.ts`: authentication and authorization
- `portfolio/lib/moderation/index.ts`: comment moderation pipeline
- `portfolio/lib/payments/`: Stripe, AbacatePay, webhook idempotency
- `packages/database/settlement.ts`: donation state transitions
- `portfolio/lib/search-sync.ts`: DB → search index mirroring
- `portfolio/lib/views-internal.ts`: view dedupe + Redis buffer

**Testing:**
- `portfolio/tests/{unit,integration,e2e}/`, `portfolio/lib/*.test.ts`, `portfolio/app/api/donations/__tests__/`, `portfolio/app/sitemap.test.ts`
- `worker/tests/{unit,integration}/`, `packages/database/tests/{unit,integration}/`, `packages/queues/tests/{unit,integration}/`

## Naming Conventions

**Files:**
- Next.js reserved names: `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx`
- Client companions of pages: `PascalCaseClient.tsx` (`EditPostClient.tsx`, `NewsletterConfirmClient.tsx`) or `page-client.tsx`
- Server actions: `actions.ts` next to the page
- React components: `PascalCase.tsx` (`PostCard.tsx`, `CommentsSection.tsx`); shadcn primitives in `components/ui/` are lowercase (`button.tsx`, `dropdown-menu.tsx`)
- Lib modules: `kebab-case.ts` (`auth-helpers.ts`, `rate-limit.ts`, `search-sync.ts`)
- Role suffixes: `*.queue.ts` (portfolio producers), `*.worker.ts` (worker consumers), `*.provider.ts` (email providers), `*.service.ts` (`newsletter.service.ts`, `email.service.ts`), `*.template.ts` (email templates)
- Hooks: `use-kebab.ts(x)` or `useCamel.ts` (mixed: `use-mobile.ts`, `useTurnstile.ts`); prefer `use-kebab-case.ts` for new hooks
- Tests: `*.test.ts` (Vitest), `*.spec.ts` (Playwright e2e)
- Prisma migrations: `YYYYMMDDHHMMSS_snake_case_description/`

**Directories:**
- Route segments: lowercase kebab (`suspicious-comments`, `banned-users`, `privacy-policy`), dynamic `[param]`, catch-all `[...nextauth]`
- Component folders: lowercase feature names (`blog`, `comments`, `wall`)

## Where to Add New Code

**New public page:**
- Primary code: `portfolio/app/[locale]/<route>/page.tsx` (async Server Component; call `setRequestLocale(locale)`, `generateMetadata` using `buildPageMetadata` from `portfolio/lib/seo.ts`)
- Interactive parts: `portfolio/components/<feature>/<Name>.tsx` with `"use client"`
- Strings: add keys to both `portfolio/messages/en.json` and `portfolio/messages/pt.json`
- Tests: `portfolio/tests/e2e/*.spec.ts` for flows

**New admin page:**
- `portfolio/app/[locale]/admin/<route>/page.tsx` (guarded by `admin/layout.tsx`); add a link in `portfolio/components/admin/AdminSidebar.tsx`; UI in `portfolio/components/admin/<area>/`

**New API endpoint:**
- `portfolio/app/api/<resource>/route.ts` (admin-only: `portfolio/app/api/admin/<resource>/route.ts`)
- Follow the sequence: `getApiTranslator(req)` → `requireAuth`/`requireAdmin` → `rateLimit` → zod via `parseJsonBodyWithMessages` → Prisma → responses from `portfolio/lib/api-errors.ts`
- Localized error strings go in `portfolio/messages/*.json`
- Tests: `portfolio/tests/integration/api/` or colocated `__tests__/`

**New database model/field:**
- Edit `packages/database/prisma/schema.prisma`, create a migration in `packages/database/prisma/migrations/`, run `npm run build:database`
- Shared domain logic that both app and worker use goes in `packages/database/` (like `settlement.ts`) and gets exported from `packages/database/index.ts`

**New background job:**
- Contract: add the job type to `packages/queues/src/types.ts`, the queue/job name to `packages/queues/src/constants.ts`, options to `src/options.ts`
- Producer: `portfolio/lib/queues/<name>.queue.ts` with a lazy singleton queue
- Consumer: `worker/workers/<name>.worker.ts` exporting `startXWorker(redis)` and/or `scheduleX(redis)`; wire it into `worker/index.ts` (start, `attachLogger`, monitoring queue, shutdown `close()`)
- Tests: `worker/tests/integration/<name>.worker.test.ts`

**New email template:**
- `packages/templates/src/templates/<name>.template.ts`, exported from `packages/templates/src/index.ts`, with strings in `src/i18n.ts`

**New moderation check:**
- `portfolio/lib/moderation/providers/<name>.ts` implementing the provider interface in `types.ts`, registered in the `providers` array in `portfolio/lib/moderation/index.ts`

**Utilities:**
- Shared helpers: `portfolio/lib/utils.ts` (`cn`, etc.) or a new `portfolio/lib/<kebab-name>.ts`; mark server-only modules with `import 'server-only'`
- Cache tag constants: `portfolio/lib/cache-tags.ts` (never inside `"use server"` files)
- Client hooks: `portfolio/hooks/`
- UI primitives: `portfolio/components/ui/`

**Static content:**
- Resume: `portfolio/data/resume/{en,pt}.ts`; timeline: `portfolio/data/timeline/{en,pt}.jsx`; legal: `portfolio/content/legal/<doc>.<locale>.md`; images: `portfolio/public/`

## Special Directories

**`packages/*/dist/`:**
- Purpose: compiled package output
- Generated: Yes (`npm run ci:packages`)
- Committed: No (build artifacts)

**`packages/database/prisma/migrations/`:**
- Purpose: Prisma SQL migrations, applied by the `migrate` container in production
- Generated: Yes (by `prisma migrate dev`), then edited by hand when needed
- Committed: Yes

**`portfolio/.next/`:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No

**`portfolio/public/`:**
- Purpose: static assets (`logos/`, `images/`, `hero/`, `flags/`, `resumes/`, `maplibre/` worker copied by `scripts/copy-maplibre-worker.mjs`)
- Generated: Partially
- Committed: Yes (all rights reserved per `LICENSE-CONTENT.md`)

**`.planning/`:**
- Purpose: GSD planning artifacts
- Generated: By GSD commands
- Committed: Yes

**`.qodo/`:**
- Purpose: Qodo agent/workflow config (empty `agents/`, `workflows/`)
- Generated: Tooling
- Committed: No (untracked)

**Root `*.tar` files (`minio-images.tar`, `romulodm-images.tar`):**
- Purpose: exported Docker images (large binaries, ~900 MB)
- Generated: Yes
- Committed: No (untracked, and not in `.gitignore` either; add them before an accidental `git add .`)

**`docs/`:**
- Referenced by `README.md` (`docs/DEPLOY.md`) but not present in the tree

---

*Structure analysis: 2026-09-25*
