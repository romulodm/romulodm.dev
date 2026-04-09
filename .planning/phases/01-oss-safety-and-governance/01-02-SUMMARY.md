---
phase: 01-oss-safety-and-governance
plan: 02
subsystem: infra
tags: [github-actions, ci, npm, workflows, monorepo]
requires:
  - phase: 01-01
    provides: public-safe env and ignore-rule baseline
provides:
  - Root CI scripts for packages, worker, portfolio, and frontend surfaces
  - Scoped PR validation workflow with stable final status job
  - Baseline security review workflow for dependency auditing
affects: [security, release, testing, onboarding]
tech-stack:
  added: [GitHub Actions, dorny/paths-filter]
  patterns:
    - Stable required-status job after scoped CI jobs
    - Root npm scripts as local and CI contract
key-files:
  created:
    - .github/workflows/pr.yml
    - .github/workflows/security-review.yml
  modified:
    - package.json
    - README.md
key-decisions:
  - "Used a detect-changes plus always-running status job instead of trigger-only path filters"
  - "Kept root CI split between fast `ci:phase1` and fuller `ci` commands"
patterns-established:
  - "Root npm scripts are the source of truth for CI entrypoints"
  - "Scoped workflows must still end in a stable required check"
requirements-completed: [CI-01, CI-02]
duration: 22min
completed: 2026-04-09
---

# Phase 1: OSS Safety And Governance Summary

**Root CI scripts and scoped GitHub Actions workflows for apps, packages, worker, and legacy frontend changes**

## Performance

- **Duration:** 22 min
- **Started:** 2026-04-09T03:21:00Z
- **Completed:** 2026-04-09T03:43:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added root npm scripts that define the monorepo’s local and CI entrypoints
- Introduced a scoped PR workflow that explicitly covers `portfolio`, `worker`, `packages/*`, and `frontend`
- Added a baseline security review workflow so dependency auditing is part of the committed CI surface

## Task Commits

Each task was committed atomically:

1. **Task 1: Create root CI scripts for local and workflow parity** - `248e00b` (build)
2. **Task 2: Add stable GitHub Actions workflows for PR validation** - `ea7313f` (ci)

**Plan metadata:** pending until plan close-out docs are committed

## Files Created/Modified
- `package.json` - root CI script contract for packages, worker, portfolio, and frontend
- `README.md` - local CI command guidance aligned with GitHub workflows
- `.github/workflows/pr.yml` - scoped PR validation workflow with stable required status
- `.github/workflows/security-review.yml` - baseline dependency/security review workflow

## Decisions Made

- Used a final `ci-status` job to avoid required-check deadlocks when scoped jobs are skipped
- Treated `packages/database` and `packages/queues` as first-class CI surfaces instead of relying only on app builds

## Deviations from Plan

### Auto-fixed Issues

**1. Local Prisma generate verification blocked by sandboxed network**
- **Found during:** Task 1 (root CI script verification)
- **Issue:** `npm run ci:phase1` failed locally because `prisma generate` attempted to fetch an engine binary and network access is restricted in this environment
- **Fix:** Kept the CI contract intact for GitHub Actions and recorded the local verification limitation rather than weakening the script to fit the sandbox
- **Files modified:** none
- **Verification:** The script structure and workflow wiring were reviewed directly; the failure was `ECONNREFUSED 127.0.0.1:9` during Prisma engine fetch
- **Committed in:** none (environment limitation only)

---

**Total deviations:** 1 auto-fixed
**Impact on plan:** No scope creep. The plan remains valid; local verification was partially limited by sandbox networking.

## Issues Encountered

- `Get-ChildItem .github -Recurse` initially walked into `node_modules` when `.github` did not exist at the repo root, so root existence had to be checked more narrowly

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 3 can now attach dependency review, secret scanning, and static security workflows to a committed CI baseline
- The repo has a stable root CI contract for later testing and verification phases to extend

---
*Phase: 01-oss-safety-and-governance*
*Completed: 2026-04-09*
