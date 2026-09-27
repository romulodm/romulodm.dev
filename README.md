# romulodm.dev

Source code for [romulodm.dev](https://romulodm.dev) — a personal portfolio and
bilingual blog, built as a TypeScript monorepo with a Go search service
alongside it.

It is a real deployment rather than a template: the same tree contains the
public site, an admin area, a background worker, a newsletter pipeline, a
donations flow and the nginx/Docker setup that runs it on a VPS.

## Stack

**Web** (`portfolio/`) — Next.js 16 (App Router) and React 19, `next-intl` for
`/en` and `/pt` routing, `next-auth` for Google and GitHub OAuth plus
credentials, MUI and Tailwind for UI, `three` / `@react-three/fiber` for the
interactive sections, `viem` for on-chain donation verification.

**Worker** (`worker/`) — BullMQ consumers for transactional and campaign email,
notifications, buffered view flushing and search index sync. Email goes out
through SMTP or SES.

**Shared packages** (`packages/`) — `database` (Prisma client and schema),
`queues` (queue names, job types and Redis helpers), `templates` (email
templates), `web3`.

**Search** (`search/`) — a standalone Go service with an in-memory index: trie
prefix matching, a BK-tree for fuzzy lookup, vector scoring and Snowball
stemming.

**Infrastructure** — Postgres, Redis, MinIO, nginx and certbot, orchestrated
with Docker Compose. Images are built in CI, published to GHCR and pulled by the
VPS; the VPS never builds.

## Repository layout

```
portfolio/          Next.js app: public site, admin UI, HTTP API routes
worker/             BullMQ worker runtime
packages/database/  Prisma schema and shared client
packages/queues/    Queue contracts and Redis helpers
packages/templates/ Email templates
packages/web3/      On-chain helpers
search/             Go search service
testing/            Shared Vitest aliases and setup
nginx/              Server config, TLS bootstrap and validation scripts
backup/ cron/       Production support containers
docs/               Deployment runbook
```

## Running locally

Requires Node 22, Go 1.22 and Docker.

```bash
git clone https://github.com/romulodm/romulodm.dev.git
cd romulodm.dev
npm ci

cp .env.example .env          # then fill it in
npm run build:database        # generates the Prisma client

docker compose -f docker-compose.dev.yml up -d
```

That brings up Postgres, Redis, MinIO, MailCatcher, the Go search service, the
worker and the app. The site is served on `${NEXT_PORT}`, MailCatcher's inbox on
`${HTTP_PORT}`, and the MinIO console on `9001`.

The Prisma client is generated rather than committed, so `build:database` has to
run before any typecheck, test or build — otherwise every import of
`@romulo/database` fails.

## Tests and checks

```bash
npm run lint           # eslint across the whole monorepo
npm run typecheck      # portfolio and worker
npm run test:unit      # vitest
npm run test:integration
npm run test:e2e       # playwright
npm run ci             # the same sequence CI runs
```

`npm run ci` is meant to stay identical to `.github/workflows/ci.yml`. If the
two drift apart, the script stops being useful.

## Deployment

`docs/DEPLOY.md` is the runbook: provisioning, DNS, TLS, GitHub Environments and
the two-environment deploy flow. In short, pushing to a deploy branch runs CI,
builds four images tagged with the commit SHA, pushes them to GHCR, and the VPS
pulls, migrates and swaps containers.

## License

This repository is licensed in two parts.

**Code — MIT.** See [`LICENSE`](./LICENSE). Use it, fork it, ship it, sell it.
Attribution is appreciated but the license only requires that the copyright
notice travels with copies of the code.

**Content and assets — all rights reserved.** See
[`LICENSE-CONTENT.md`](./LICENSE-CONTENT.md). The résumé data, the legal texts,
the timeline entries, everything under `portfolio/public/`, the blog posts and
the visual identity are not covered by the MIT license and are not licensed for
reuse.

The practical version: the engineering is yours to take, my identity is not. If
you build on this, swap in your own content and assets before you deploy it.
