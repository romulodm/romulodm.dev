# romulodm.dev

## What This Is

This repository is a public personal monorepo that now has a shipped production-hardening baseline. It powers a public Next.js portfolio, supporting services, and background workers, and the current project state reflects a security-first, test-backed deployment posture rather than an in-progress rescue effort.

The codebase still contains the same core architecture: a primary portfolio app, a separate worker service, shared Prisma and queue packages, and a legacy frontend that is being retired. What changed in `v1.0` is the operational baseline: the repo is OSS-safe, critical routes are hardened, must-not-break flows are tested, worker failures are visible, and the production runtime has intentional safety and performance defaults.

## Core Value

Safe public deployment of the existing monorepo, with the public portfolio staying up, the worker never failing silently, and admin/auth control remaining reliable.

## Requirements

### Validated

- Public portfolio and content delivery already exist in the current codebase
- Background worker and queue-backed async processing already exist in the current codebase
- Authentication and admin/content management flows already exist in the current codebase
- Payment, newsletter, upload, and moderation integrations already exist in the current codebase
- OSS-safe public repository hygiene and env contracts shipped in `v1.0`
- Shared API validation, auth, rate limiting, and safe error boundaries shipped in `v1.0`
- Active-surface unit, integration, and E2E verification shipped in `v1.0`
- Worker failure visibility, retry safety, and backlog health signaling shipped in `v1.0`
- Production caching, queue tuning, and high-value Prisma/query hardening shipped in `v1.0`

### Active

- [ ] Remove the remaining BullMQ critical-dependency warning from the portfolio build path
- [ ] Migrate the Vitest config off deprecated `environmentMatchGlobs`
- [ ] Disable NextAuth debug logging outside explicit local debugging and test scenarios
- [ ] Expand observability from baseline health signals into dashboards or alerting for long-term operations
- [ ] Clarify and execute the retirement path for the legacy `frontend/`

### Out of Scope

- Full architectural rewrite or migration away from the current monorepo layout - hardening is the goal, not a rebuild
- Perfection-level platform maturity before release - `v1.0` targeted a production-ready baseline with the highest-risk gaps closed first
- Replacing existing product capabilities with new major features - feature expansion is secondary to reliability, security, and testability
- Deep investment in the retiring legacy `frontend/` during the hardening milestone - retirement planning is more valuable than new test/features there

## Context

- The repository is a monorepo with a primary Next.js app in `portfolio/`, a background worker in `worker/`, and shared packages in `packages/database` and `packages/queues`
- A legacy Vite frontend still exists under `frontend/`, but it was intentionally kept out of new hardening investment because it is being retired
- The system handles real traffic, but the primary operator is a single person, so silent operational failure is especially dangerous
- The highest-risk failure modes are:
  - the public portfolio being unavailable
  - the worker breaking or backing up silently
  - authentication/admin control failing and locking the operator out
- Payments and email are important but temporarily recoverable; portfolio uptime, worker visibility, and auth reliability take precedence
- `v1.0` closed the main hardening gaps that were discovered during mapping: repo safety, missing first-party tests, inconsistent API boundaries, silent worker risk, and unreviewed production caching/queue behavior
- The active production baseline now includes shared server-side API guards, automated unit/integration/E2E coverage, worker health signals, and scoped PR enforcement for critical tests
- The current known debt is narrower and operationally safer: a build warning around BullMQ bundling, a Vitest deprecation, noisy NextAuth debug output in E2E, and remaining legacy-frontend retirement work

## Constraints

- **Architecture**: Keep the existing architecture intact - this is a hardening effort, not a rewrite
- **Priority Order**: Security before scalability - public safety and secret handling come first
- **Verification**: All changes must be incremental and testable - every improvement should reduce risk without creating blind spots
- **Operations**: Single-operator system - observability and safe defaults matter more because there is no separate operations team watching the system
- **Public Exposure**: Repository will be open-source - code, config patterns, and tracked files must be safe for public visibility
- **Production Baseline**: "Done" means safe to publish and deploy with the highest-risk gaps closed first, not absolute completeness

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Prioritize security hardening before scalability work | Public repo safety and production trust depend first on eliminating exposure and access risks | Confirmed in `v1.0`; the milestone order stayed security-first and the baseline shipped safely |
| Keep the existing monorepo architecture | The goal is to harden what already exists without introducing rewrite risk | Confirmed in `v1.0`; safety and reliability improved without a rewrite |
| Treat portfolio uptime, worker reliability, and auth control as non-negotiable | These are the most damaging failure modes for the operator and the public system | Confirmed in `v1.0`; E2E, worker observability, and auth hardening all centered on these paths |
| Use shared server-side helpers at risky boundaries | Consistency matters more than route-local fixes in a public production system | Confirmed in Phases 2 and 7; shared validation, rate-limit, and error helpers are now the baseline |
| Audit before archive and convert blockers into explicit phases | Milestone quality is easier to preserve when gaps are made visible and scheduled | Confirmed in `v1.0`; Phases 6 and 7 closed the audit-discovered blockers before ship |

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
*Last updated: 2026-04-11 after v1.0 milestone*
