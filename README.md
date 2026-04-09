# romulodm.dev

Personal portfolio and services monorepo with:
- `portfolio/`: primary Next.js app
- `worker/`: BullMQ-backed background processing
- `packages/database`: shared Prisma schema and client
- `packages/queues`: shared queue and Redis contracts
- `frontend/`: legacy Vite frontend kept in-tree for public visibility and future cleanup

## Environment

This repository is intended to be safe for public source control. Never commit real secrets, tokens, private endpoints, or runtime state.

Environment contract by surface:
- Root `.env.example`: shared infra variables used by workspace-level tooling and shared packages, mainly `DATABASE_URL` and `REDIS_URL`
- `portfolio/.env.example`: active Next.js app variables for auth, storage, moderation, analytics, payments, and public site metadata
- `worker/.env.example`: worker/runtime variables for queues, outbound notifications, Umami reporting, and email delivery
- `packages/database`: no separate example file; it consumes the shared `DATABASE_URL` documented at the root
- `packages/queues`: no separate example file; it consumes the shared `REDIS_URL` documented at the root
- `frontend/`: legacy surface. It still references Vite env variables such as `VITE_GOOGLE_CLIENT_ID`, `VITE_URL_EMAIL`, `VITE_ACCESSKEY_EMAIL`, `VITE_TERMINAL_SECRET_PASSWORD`, `VITE_TERMINAL_SECRET_REWARD`, `VITE_GITHUB_TOKEN`, `VITE_BACKEND_URL`, `VITE_SANITY_DATASET_NAME`, `VITE_SANITY_PROJECT_ID`, `VITE_SANITY_ENV`, and `VITE_SANITY_API_TOKEN`, but Phase 1 does not add `frontend/.env.example` because this app is not the active production surface. If you need to run it, create a local untracked `.env` from those names only.

Bootstrap guidance:
1. Copy the relevant `*.env.example` file for the surface you want to run into an untracked local `.env`.
2. Fill placeholders with local or deployment-specific values.
3. Keep production secrets in your deployment platform or secret manager, not in git.

## OSS Safety

Repo-safety rules for public release:
- Runtime state such as `waha-data/`, build output, coverage output, and nested `.env.*` files must stay untracked.
- Safe example files are the only env files that belong in git.
- Legacy surfaces remain in scope for repo hygiene even when they are not the primary deploy target.

## CI

Phase 1 introduces a root CI contract plus GitHub workflows for pull request validation and security review.

Local CI entrypoints:
- `npm run ci:phase1`: fast baseline check for packages, worker build, and frontend/portfolio linting
- `npm run ci`: fuller Phase 1 baseline including portfolio and frontend builds

Pull requests use the same root commands through GitHub Actions so local and CI expectations stay aligned.

## Publication Checklist

Before making the repository public, confirm:
- CI workflows are enabled and passing on the default branch
- secret scanning and push protection are enabled in GitHub repository settings
- dependency review is required for pull requests
- the committed `Secret Scan` and `Static Security` workflows are active
- any real secrets have been rotated out of local history, screenshots, and deployment notes

Security workflow overview:
- `PR Validation`: scoped checks for apps, packages, worker, and legacy frontend changes
- `Security Review`: npm audit coverage
- `Dependency Review`: pull request dependency risk review
- `Secret Scan`: committed secret-leak detection via gitleaks
- `Static Security`: baseline CodeQL analysis for JavaScript/TypeScript

GitHub settings such as push protection and secret scanning alerts still need to be enabled in the repository UI. The committed workflows do not replace those admin-level controls.
