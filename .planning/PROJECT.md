# romulodm.dev Production Hardening

## What This Is

This is a brownfield hardening project for an existing personal monorepo that powers a public portfolio, supporting services, and background jobs. The goal is to make the repository safe to open-source and the system safe to deploy to production, without rewriting the architecture.

The monorepo already contains a primary Next.js portfolio app, a separate worker service for async flows, shared Prisma and queue packages, and a legacy Vite frontend still in-tree. This work focuses on closing the highest-risk security, testing, and scalability gaps first so the system can handle real traffic with confidence.

## Core Value

Safe public deployment of the existing monorepo, with the public portfolio staying up, the worker never failing silently, and admin/auth control remaining reliable.

## Requirements

### Validated

- ✓ Public portfolio and content delivery already exist in the current codebase
- ✓ Background worker and queue-backed async processing already exist in the current codebase
- ✓ Authentication and admin/content management flows already exist in the current codebase
- ✓ Payment, newsletter, upload, and moderation integrations already exist in the current codebase

### Active

- [ ] Harden the repo so it is safe to publish publicly with no secrets, credentials, or sensitive runtime data exposed
- [ ] Add comprehensive automated test coverage across `portfolio/`, `worker/`, `packages/`, and `frontend/`
- [ ] Establish a production-ready CI baseline that runs critical checks and tests automatically
- [ ] Strengthen API validation, sanitization, access control, and rate limiting across high-risk routes
- [ ] Improve worker observability so failures are visible and silent queue degradation is reduced
- [ ] Raise the production baseline for scalability, logging, database efficiency, and deployment safety without changing the core architecture

### Out of Scope

- Full architectural rewrite or migration away from the current monorepo layout — hardening is the goal, not a rebuild
- Perfection-level platform maturity before release — the target is a production-ready baseline with the highest-risk gaps closed first
- Replacing existing product capabilities with new major features — feature expansion is secondary to reliability, security, and testability

## Context

- The repository is a monorepo with a primary Next.js app in `portfolio/`, a background worker in `worker/`, and shared packages in `packages/database` and `packages/queues`
- A legacy Vite frontend still exists under `frontend/`, so the repo contains both current and older frontend surfaces that need to be understood before public release
- The system handles real traffic, but the primary operator is a single person, so silent operational failure is especially dangerous
- The highest-risk failure modes are:
  - the public portfolio being unavailable
  - the worker breaking or backing up silently
  - authentication/admin control failing and locking the operator out
- Payments and email are important but temporarily recoverable; portfolio uptime, worker visibility, and auth reliability take precedence
- Current codebase mapping identified several hardening gaps, including missing first-party automated tests, process-local rate limiting, env-heavy integrations, runtime data in the repo tree, and broad use of ad hoc validation and logging
- The repository needs to become safe for open-source publication as well as stable for production use, which means both code changes and repository hygiene changes matter

## Constraints

- **Architecture**: Keep the existing architecture intact — this is a hardening effort, not a rewrite
- **Priority Order**: Security before scalability — public safety and secret handling come first
- **Verification**: All changes must be incremental and testable — every improvement should reduce risk without creating blind spots
- **Operations**: Single-operator system — observability and safe defaults matter more because there is no separate operations team watching the system
- **Public Exposure**: Repository will be open-source — code, config patterns, and tracked files must be safe for public visibility
- **Production Baseline**: "Done" means safe to publish and deploy with the highest-risk gaps closed first, not absolute completeness

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Prioritize security hardening before scalability work | Public repo safety and production trust depend first on eliminating exposure and access risks | — Pending |
| Keep the existing monorepo architecture | The goal is to harden what already exists without introducing rewrite risk | — Pending |
| Treat portfolio uptime, worker reliability, and auth control as non-negotiable | These are the most damaging failure modes for the operator and the public system | — Pending |
| Add comprehensive automated testing across all apps and packages | A production-ready baseline requires repeatable verification before and after changes | — Pending |
| Aim for a production-ready baseline instead of perfection | The project needs a realistic threshold for release and deployment readiness | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-08 after initialization*
