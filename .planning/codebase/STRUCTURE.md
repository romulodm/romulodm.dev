# Codebase Structure

**Analysis Date:** 2026-04-08

## Directory Layout

```text
romulodm.dev/
├── frontend/              # Legacy Vite/React portfolio app
│   ├── public/            # Static assets and locale files
│   └── src/               # Legacy components, pages, contexts, data helpers
├── nginx/                 # Reverse proxy configuration
├── packages/              # Shared workspace packages
│   ├── database/          # Prisma schema and shared client package
│   └── queues/            # Shared Redis/BullMQ queue package
├── portfolio/             # Primary Next.js application
│   ├── app/               # App Router pages and API routes
│   ├── components/        # Reusable UI and feature components
│   ├── data/              # Resume/timeline content sources
│   ├── hooks/             # React hooks
│   ├── lib/               # Server/domain helpers and integrations
│   ├── public/            # Public assets
│   ├── scripts/           # Maintenance/generation scripts
│   ├── styles/            # Additional styling assets
│   ├── types/             # Shared TS types
│   └── utils/             # UI utilities
├── waha-data/             # Runtime WAHA session data mounted by Docker
├── worker/                # Background job service
│   ├── jobs/              # Ad hoc job scripts
│   ├── lib/               # Provider adapters and worker helpers
│   └── workers/           # BullMQ worker implementations
├── docker-compose.yml     # Base container topology
├── docker-compose.dev.yml # Development container topology
└── package.json           # Workspace root manifest
```

## Directory Purposes

**`frontend/`:**
- Purpose: Older standalone frontend, likely predating the Next.js rewrite
- Contains: Vite app source, Sanity/axios helpers, legacy blog/resume pages, i18next setup
- Key files: `frontend/package.json`, `frontend/src/main.jsx`, `frontend/src/App.jsx`
- Subdirectories: `src/components/`, `src/pages/`, `src/context/`, `src/data/`

**`portfolio/`:**
- Purpose: Main product surface and current app
- Contains: localized pages, API routes, admin UI, newsletter/blog/support flows, integrations
- Key files: `portfolio/package.json`, `portfolio/app/layout.tsx`, `portfolio/middleware.ts`, `portfolio/next.config.js`
- Subdirectories: `app/`, `components/`, `lib/`, `hooks/`, `scripts/`, `messages/`

**`packages/database/`:**
- Purpose: Shared Prisma package
- Contains: `index.ts`, Prisma schema, migrations, generated-client build output
- Key files: `packages/database/prisma/schema.prisma`, `packages/database/index.ts`
- Subdirectories: `prisma/migrations/`

**`packages/queues/`:**
- Purpose: Shared queue constants, payload types, and Redis helpers
- Contains: `index.ts`, `lib/queues.ts`, `lib/redis.ts`
- Key files: `packages/queues/index.ts`, `packages/queues/lib/queues.ts`

**`worker/`:**
- Purpose: Background processing service
- Contains: startup file, BullMQ workers, email provider adapters, WhatsApp/Umami notifier
- Key files: `worker/index.ts`, `worker/workers/email.worker.ts`, `worker/workers/notification.worker.ts`
- Subdirectories: `workers/`, `lib/email/`, `jobs/`

**`nginx/`:**
- Purpose: Reverse proxy config for HTTP routing, caching, and upload handling
- Contains: single server config file
- Key files: `nginx/default.conf`

**Runtime/Generated directories:**
- `portfolio/.next/`, `worker/dist/`, package `dist/`, `node_modules/`, and `waha-data/` are generated/runtime state rather than hand-edited source
- These should generally not be targets for feature work unless the task is explicitly about build/runtime artifacts

## Key File Locations

**Entry Points:**
- `portfolio/app/page.tsx` - top-level app entry page
- `portfolio/app/[locale]/page.tsx` - localized homepage
- `portfolio/app/api/**/route.ts` - server API/webhook entry points
- `worker/index.ts` - worker process entry
- `frontend/src/main.jsx` - legacy app bootstrap

**Configuration:**
- `package.json` - workspace definition
- `portfolio/tsconfig.json` - Next.js TypeScript config and path aliases
- `worker/tsconfig.json` - worker build config
- `frontend/.eslintrc.cjs` - legacy frontend lint config
- `docker-compose.yml` and `docker-compose.dev.yml` - service topology
- `nginx/default.conf` - proxy/security config

**Core Logic:**
- `portfolio/lib/` - auth, newsletter, moderation, payments, queues, uploads, markdown, views
- `packages/database/prisma/` - data model and migrations
- `packages/queues/lib/` - queue definitions and Redis factory
- `worker/lib/` - provider adapters
- `worker/workers/` - async business logic

**Testing:**
- No first-party `tests/`, `__tests__/`, or `*.test.*` files were found outside dependencies/generated code

**Documentation:**
- `frontend/README.md` - brief legacy project overview
- `.codex/` - local GSD/Codex skills and workflow assets (tooling, not app code)

## Naming Conventions

**Files:**
- React components usually use PascalCase filenames, especially in `portfolio/components/` and `frontend/src/components/`
- Route handlers follow Next.js `route.ts` convention
- Helper/util modules usually use kebab-case or lower-case filenames such as `auth-helpers.ts`, `email.queue.ts`, `remark-youtube.ts`

**Directories:**
- Feature/domain grouping is preferred over strict layer-only grouping in the main app (`components/blog/`, `components/comments/`, `app/api/donations/`)
- Shared package directories are short and domain-specific (`database`, `queues`)

**Special Patterns:**
- Dynamic routes use Next.js bracket notation like `[locale]`, `[slug]`, `[id]`, `[...nextauth]`
- `index.ts` is used as a small public barrel in workspace packages

## Where to Add New Code

**New end-user or admin page:**
- Primary code: `portfolio/app/[locale]/...`
- Supporting UI: `portfolio/components/`
- Server helpers: `portfolio/lib/`

**New API route or webhook:**
- Definition: `portfolio/app/api/.../route.ts`
- Reusable logic: `portfolio/lib/`
- Persistence changes: `packages/database/prisma/schema.prisma` plus migrations

**New async job:**
- Queue shape/constants: `packages/queues/lib/queues.ts`
- Producer: `portfolio/lib/queues/`
- Consumer: `worker/workers/`

**New shared infrastructure helper:**
- Database-oriented: `packages/database/`
- Queue/Redis-oriented: `packages/queues/`

**Legacy frontend-only change:**
- Implementation: `frontend/src/`
- Use this only if the task explicitly targets the Vite app rather than the Next.js app

## Special Directories

**`portfolio/.next/`:**
- Purpose: Next.js build cache and generated artifacts
- Source: generated by `next dev` / `next build`
- Committed: effectively runtime/build output; not source of truth

**`worker/dist/` and `packages/*/dist/`:**
- Purpose: compiled TypeScript output
- Source: `tsc`
- Committed: generated artifacts

**`waha-data/` and `portfolio/waha-data/`:**
- Purpose: persisted WhatsApp session/runtime state for WAHA
- Source: container/runtime writes
- Committed: should be treated as operational state, not code

---
*Structure analysis: 2026-04-08*
*Update when directory structure changes*
