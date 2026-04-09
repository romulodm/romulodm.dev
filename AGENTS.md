<!-- GSD:project-start source:PROJECT.md -->
## Project

**romulodm.dev Production Hardening**

This is a brownfield hardening project for an existing personal monorepo that powers a public portfolio, supporting services, and background jobs. The goal is to make the repository safe to open-source and the system safe to deploy to production, without rewriting the architecture.

The monorepo already contains a primary Next.js portfolio app, a separate worker service for async flows, shared Prisma and queue packages, and a legacy Vite frontend still in-tree. This work focuses on closing the highest-risk security, testing, and scalability gaps first so the system can handle real traffic with confidence.

**Core Value:** Safe public deployment of the existing monorepo, with the public portfolio staying up, the worker never failing silently, and admin/auth control remaining reliable.

### Constraints

- **Architecture**: Keep the existing architecture intact — this is a hardening effort, not a rewrite
- **Priority Order**: Security before scalability — public safety and secret handling come first
- **Verification**: All changes must be incremental and testable — every improvement should reduce risk without creating blind spots
- **Operations**: Single-operator system — observability and safe defaults matter more because there is no separate operations team watching the system
- **Public Exposure**: Repository will be open-source — code, config patterns, and tracked files must be safe for public visibility
- **Production Baseline**: "Done" means safe to publish and deploy with the highest-risk gaps closed first, not absolute completeness
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.x - Main application code in `portfolio/`, `worker/`, and `packages/`
- TSX/React - UI code in `portfolio/components/`, `portfolio/app/`, and the legacy `frontend/src/`
- JavaScript - Next/Vite config files such as `portfolio/next.config.js`, `frontend/vite.config.js`, and Docker helper scripts
- SQL (via Prisma migrations) - Schema evolution in `packages/database/prisma/migrations/`
- YAML - Container orchestration in `docker-compose.yml` and `docker-compose.dev.yml`
## Runtime
- Node.js 20.x style toolchain - implied by `next@14`, modern AWS SDK packages, Prisma 5, and TypeScript configs
- Browser runtime - Next.js App Router pages under `portfolio/app/` and the separate Vite React app under `frontend/`
- Dockerized local services - PostgreSQL, Redis, MinIO, Umami, WAHA, and the app/worker containers from the compose files
- npm workspaces - root `package.json` declares `packages/*`, `portfolio`, and `worker`
- Lockfiles: root `package-lock.json` plus per-package lockfiles in `frontend/`, `portfolio/`, and `worker/`
## Frameworks
- Next.js 14.2 (`portfolio/package.json`) - Primary full-stack web app using App Router and route handlers
- React 18 - UI layer for both `portfolio` and the legacy `frontend`
- NextAuth 4 - Authentication in `portfolio/lib/auth.ts` and `portfolio/app/api/auth/[...nextauth]/`
- Prisma 5 - ORM/data access through `packages/database/`
- BullMQ 5 + ioredis 5 - Queueing and worker orchestration in `packages/queues/`, `portfolio/lib/queues/`, and `worker/workers/`
- Vite 4 - Bundler for the older `frontend/` app
- No first-party test runner is configured in checked-in manifests
- Puppeteer is present as a dev dependency in `portfolio/package.json`, but there are no committed browser tests or runner config files
- TypeScript compiler - builds `worker/` and both shared packages
- tsx - local worker/dev scripts and maintenance scripts
- Tailwind CSS - styling in both `portfolio/` and `frontend/`
- ESLint - configured in `frontend/.eslintrc.cjs`; `portfolio` uses `next lint` via the Next.js toolchain
## Key Dependencies
- `next` - Full-stack React runtime and server route handling in `portfolio/`
- `@romulo/database` - Shared Prisma client consumed by the app and worker
- `@romulo/queues` - Shared Redis/BullMQ queue primitives used across app and worker
- `next-auth` - Credentials and Google OAuth auth flows
- `openai` - AI-powered moderation/translation features in `portfolio/lib/moderation/` and `portfolio/lib/translate.ts`
- `stripe` and `@stripe/react-stripe-js` - Card donation flow
- `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` - MinIO/S3-compatible upload flow
- `ioredis` - Redis connectivity for queues and counters
- `bullmq` - Background jobs for email, notifications, and views flushing
- `nodemailer` and `@aws-sdk/client-ses` - SMTP/SES email delivery in `worker/lib/email/`
- `bcryptjs` - Password hashing for credentials auth
- `next-intl` - Locale-aware routing and content handling
## Configuration
- Environment variables drive nearly everything; `.env` files exist at the repo root and inside apps/packages
- Critical variables include `DATABASE_URL`, Redis connection info, NextAuth secrets, Google OAuth creds, Stripe secrets, MinIO/S3 settings, WAHA credentials, Umami creds, and email provider settings
- `portfolio/next.config.js` loads the parent `.env` explicitly and configures remote image hosts from env values
- Root workspace manifest: `package.json`
- App configs: `portfolio/tsconfig.json`, `portfolio/next.config.js`, `portfolio/tailwind.config.ts`
- Worker/shared package configs: `worker/tsconfig.json`, `packages/database/tsconfig.json`, `packages/queues/tsconfig.json`
- Infra configs: `docker-compose.yml`, `docker-compose.dev.yml`, `nginx/default.conf`
## Platform Requirements
- Windows/macOS/Linux should all work if Node/npm and Docker are available
- Docker is effectively part of local development for Postgres, Redis, MinIO, Umami, WAHA, and Mailcatcher
- Prisma schema generation and migrations depend on PostgreSQL availability
- `portfolio/` is configured for standalone Next.js output in Docker
- `worker/` is a separate long-running Node process/container
- Reverse proxy assumptions live in `nginx/default.conf`
- External service credentials are required for production-grade features (Stripe, Google OAuth, OpenAI, Safe Browsing, email delivery, Umami, WAHA, MinIO)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- PascalCase for many React components, especially UI/feature components such as `portfolio/components/auth/LoginForm.tsx`
- kebab-case or descriptive lower-case for utilities and server helpers such as `portfolio/lib/auth-helpers.ts`, `portfolio/lib/newsletter/newsletter.service.ts`, `worker/workers/email.worker.ts`
- Next.js route handlers always use `route.ts`
- camelCase for functions throughout the repo
- Async functions do not use a special prefix; names describe intent (`dispatchCampaign`, `confirmSubscription`, `scheduleDailyStatus`)
- HTTP handlers use exported uppercase verb names (`GET`, `POST`, etc.) per Next.js convention
- camelCase for locals and module-scoped values
- UPPER_SNAKE_CASE for queue names and other constants such as `QUEUE_TRANSACTIONAL`, `WINDOW_MS`, `MAX_REQUESTS`
- No underscore-prefixed privacy convention observed
- Interfaces and type aliases use PascalCase (`CampaignEmailJob`, `PresignedUploadResult`, `ModerationResult`)
- Prisma enums use PascalCase enum names and UPPER_CASE values
## Code Style
- Semicolons are common in TypeScript-heavy areas (`portfolio/`, `worker/`, `packages/`)
- Quotes are mixed across the repo: older/legacy areas often use single quotes, newer Next/worker files frequently use double quotes
- Indentation is mixed: many TS files use 2 spaces, while some shared package files use 4 spaces
- There is no obvious single formatter config checked in at the root
- `frontend/` has explicit ESLint config in `frontend/.eslintrc.cjs`
- `portfolio/package.json` exposes `next lint`
- There is no repo-wide lint orchestration script at the root
## Import Organization
- Blank lines between groups are common
- Imports are usually organized for readability, but strict alphabetical ordering is not consistently enforced
- `@/*` maps to `portfolio/*`
- `@romulo/database` and `@romulo/queues` are consumed as workspace packages from both app and worker
## Error Handling
- Route handlers usually return JSON error responses rather than throwing for expected failures
- Worker jobs throw on processing failure so BullMQ retries/backoff can handle transient issues
- Manual validation/guard clauses are heavily used at the top of request handlers
- Plain `Error` objects are the norm
- Custom error classes are not a prevailing pattern
- Errors are often logged inline right before returning/throwing
## Logging
- `console.log`, `console.warn`, and `console.error`
- No structured logger or log abstraction was found
- Logging is common at service boundaries, queue startup, and worker execution
- Several files log operational milestones and debug details directly, especially under `worker/`
- New code should preserve useful operational logs but avoid leaking secrets or noisy payloads
## Comments
- Comments often explain intent or recent bug fixes, especially in business logic flows
- Some comments are in Portuguese and describe processing steps in detail
- Inline “section divider” comments are common in newsletter, worker, and moderation code
- Rare overall; most functions rely on TypeScript types and descriptive naming
- Very few actionable first-party TODO markers were found outside dependencies
- Existing comments are more explanatory than backlog-oriented
## Function Design
- Small helpers coexist with longer route handlers/service modules
- Complex request handlers frequently keep validation, data access, and orchestration in one file
- Small positional parameter lists are common
- Object parameters are used when payloads become richer, especially around worker jobs and templates
- Guard-clause early returns are common in route handlers
- Service functions often return small status objects such as `{ status: "confirmed" }`
## Module Design
- Named exports are preferred in server/shared code
- React components are generally default or named exports depending on file age; there is no single rigid rule
- Shared packages expose minimal public APIs from `index.ts`
- Used sparingly, mainly for workspace packages
- Most feature directories import concrete files directly
## Practical Guidance
- Match the style of the area you are editing rather than forcing repo-wide normalization.
- In `portfolio/` and `worker/`, prefer TypeScript with explicit types at integration boundaries.
- Preserve existing alias usage (`@/`, `@romulo/...`) instead of replacing with long relative paths.
- Keep route-level validation close to the handler unless a domain helper already exists.
- Treat the Vite `frontend/` app as legacy style; avoid importing its patterns into the main Next.js app unless necessary.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Monorepo with npm workspaces centered on `portfolio/`, `worker/`, and `packages/*`
- Server-rendered UI and JSON APIs coexist in the same Next.js app under `portfolio/app/`
- Background processing is event-driven through Redis/BullMQ queues
- Legacy Vite frontend remains in-tree as an older standalone frontend implementation
## Layers
- Purpose: Render pages, client components, forms, admin screens, and localized routes
- Contains: `portfolio/app/[locale]/`, `portfolio/components/`, `portfolio/hooks/`, `portfolio/messages/`
- Depends on: auth helpers, server routes, shared formatting/util modules
- Used by: end users and admins in the browser
- Purpose: Accept user/admin requests, validate auth, orchestrate domain operations, and return JSON
- Contains: `portfolio/app/api/**/route.ts`
- Depends on: Prisma, auth/session helpers, moderation, queue producers, payment/storage helpers
- Used by: client components, admin tools, third-party webhook senders
- Purpose: Encapsulate reusable business logic outside individual route handlers
- Contains: `portfolio/lib/auth.ts`, `portfolio/lib/newsletter/newsletter.service.ts`, `portfolio/lib/moderation/`, `portfolio/lib/payments/`, `portfolio/lib/views.ts`, `portfolio/lib/translate.ts`
- Depends on: Prisma, external SDKs, queue adapters, env config
- Used by: route handlers, server components, and worker jobs
- Purpose: Centralize persistence models and shared clients
- Contains: `packages/database/index.ts`, `packages/database/prisma/schema.prisma`, `portfolio/lib/prisma.ts`
- Depends on: Prisma client generation and PostgreSQL
- Used by: app routes, services, and worker jobs
- Purpose: Handle deferred email delivery, notification fan-out, scheduled jobs, and view counter flushing
- Contains: `packages/queues/lib/*.ts`, `portfolio/lib/queues/*.ts`, `worker/index.ts`, `worker/workers/*.ts`
- Depends on: Redis, BullMQ, Prisma, external providers (email, WAHA, Umami)
- Used by: the app when enqueuing work and the worker when consuming jobs
- Purpose: Provide local/prod execution environment and reverse proxying
- Contains: `docker-compose*.yml`, `nginx/default.conf`, `portfolio/Dockerfile`, `worker/Dockerfile`
- Depends on: Docker images and environment variables
- Used by: local development and container deployments
## Data Flow
- Durable state lives in PostgreSQL via Prisma
- Ephemeral async state lives in Redis/BullMQ
- Some request throttling is currently process-local in-memory (`portfolio/app/api/comments/route.ts`)
- Browser state is mostly handled through React state/client components rather than a global state library
## Key Abstractions
- Purpose: API boundary objects for each domain capability
- Examples: `portfolio/app/api/comments/route.ts`, `portfolio/app/api/posts/route.ts`, `portfolio/app/api/donations/stripe/create-intent/route.ts`
- Pattern: Next.js App Router `GET`/`POST`/`PATCH`/`DELETE` exports
- Purpose: Reusable domain logic outside handlers
- Examples: `portfolio/lib/newsletter/newsletter.service.ts`, `portfolio/lib/moderation/index.ts`, `portfolio/lib/s3.ts`
- Pattern: named function exports with env-backed singleton helpers
- Purpose: Cross-service contracts and clients
- Examples: `@romulo/database`, `@romulo/queues`
- Pattern: workspace packages exposing small public APIs from `index.ts`
- Purpose: Deferred side effects and scheduled processing
- Examples: transactional email jobs, campaign email jobs, WhatsApp notifications, view flush jobs
- Pattern: BullMQ workers created once per queue with typed payloads
## Entry Points
- Location: `portfolio/app/layout.tsx`, `portfolio/app/page.tsx`, and localized routes under `portfolio/app/[locale]/`
- Triggers: HTTP requests to the Next.js app
- Responsibilities: render pages, serve APIs, host auth/webhook endpoints
- Location: `portfolio/middleware.ts`
- Triggers: non-static/non-API incoming requests
- Responsibilities: locale routing enforcement
- Location: `worker/index.ts`
- Triggers: container/process startup
- Responsibilities: verify email provider, register cron-like repeatable jobs, attach worker listeners, handle graceful shutdown
- Location: `frontend/src/main.jsx`
- Triggers: Vite dev/build workflow
- Responsibilities: standalone older portfolio/blog UI
## Error Handling
- API routes usually return `NextResponse.json({ error }, { status })` on validation/auth failures
- Worker handlers throw to let BullMQ retries/backoff handle transient failures
- No shared error abstraction or structured error class hierarchy was found
## Cross-Cutting Concerns
- `console.log`, `console.warn`, and `console.error` are used across both app and worker code
- Worker startup and queue processing are especially log-heavy
- Mostly manual input validation in route handlers
- `react-hook-form` and schema files exist on the client side, but server validation is inconsistent
- NextAuth with JWT sessions protects user routes
- Admin checks are helper-based (`requireAdmin`, `isAdminAuthenticated`)
- `next-intl` drives locale routing and messages in `portfolio/`
- The legacy `frontend/` uses `i18next`
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
