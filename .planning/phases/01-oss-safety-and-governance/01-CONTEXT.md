# Phase 1: OSS Safety And Governance - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase makes the monorepo safe to publish publicly and establishes the minimum CI and repository-security baseline needed before deeper API, testing, and scalability work. It includes tracked-file and runtime-data hygiene, documented environment contracts, GitHub-side safety automation, and a practical monorepo CI entrypoint. It does not redesign the architecture or expand feature scope.

</domain>

<decisions>
## Implementation Decisions

### Public Repo Boundary
- **D-01:** Treat the entire repository as intended-for-public by default. Unsafe or operational-only material must be removed from tracking, aggressively ignored, or replaced with safe templates rather than relying on undocumented private subtrees.
- **D-02:** Runtime data directories, generated artifacts, and local-only state are part of the Phase 1 audit scope, including top-level `waha-data/`, `portfolio/waha-data/`, build output, and stray local env files.

### Environment Contract
- **D-03:** Create explicit OSS-safe environment documentation for each runnable surface in scope, with concrete examples for `portfolio/` and `worker/` and any shared-package env requirements documented where they are consumed.
- **D-04:** Provide a root-level explanation of what each required variable/integration is for, so a public contributor or future operator can bootstrap safely without seeing real credentials.

### CI Baseline
- **D-05:** Phase 1 CI should expose a single documented root entrypoint that can run locally and in GitHub Actions.
- **D-06:** The initial CI baseline should favor scoped lint/build/security checks over broad heavy testing, so merge protection becomes usable immediately and expands later when Phase 3 adds deeper automated coverage.

### Security Automation
- **D-07:** Enable both repository-level and code-level safety guardrails in Phase 1, including secret-leak prevention, dependency/security review, and a baseline static security workflow where the repository setup supports it.
- **D-08:** Future secret leaks should be blocked or surfaced before merge or push wherever platform features allow, with local repo guidance documenting the expected protections.

### Legacy Frontend Handling
- **D-09:** Keep `frontend/` in the public repository for now, but treat it as a legacy surface that still must satisfy OSS hygiene and baseline CI expectations.
- **D-10:** Document the legacy frontend clearly so downstream agents do not mistake it for the primary product surface while still covering it in public-release safety checks.

### the agent's Discretion
- Exact workflow/job names, file layout under `.github/workflows/`, and the split between README guidance versus dedicated ops/security docs are left to planning and implementation as long as they satisfy the decisions above.
- The planner can decide the cleanest way to express env contracts across root docs, package docs, and `.env.example` files without weakening OSS safety.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` - project goal, non-negotiables, and hardening constraints
- `.planning/REQUIREMENTS.md` - Phase 1 requirement set (`OSS-01`..`OSS-03`, `CI-01`..`CI-03`)
- `.planning/ROADMAP.md` - Phase 1 goal, success criteria, and plan breakdown
- `.planning/STATE.md` - current project position and active focus

### Research Guidance
- `.planning/research/SUMMARY.md` - recommended approach for OSS safety, CI, and security guardrails
- `.planning/research/PITFALLS.md` - production-hardening failure modes to avoid during Phase 1

### Codebase Context
- `.planning/codebase/STRUCTURE.md` - monorepo layout, runnable surfaces, and runtime/generated directories
- `.planning/codebase/CONCERNS.md` - repo hygiene, runtime-data, and security concerns already identified
- `.planning/codebase/CONVENTIONS.md` - current repo conventions and lack of root orchestration patterns

### Current Repo Surfaces
- `.gitignore` - current ignore baseline and OSS hygiene gaps
- `package.json` - root workspace definition and current lack of root scripts
- `portfolio/package.json` - active Next.js app scripts and baseline checks
- `worker/package.json` - worker scripts and baseline checks
- `frontend/package.json` - legacy frontend scripts and public-repo implications
- `portfolio/.env.example` - existing env example starting point for the env contract
- `docker-compose.yml` - runtime topology and potential public-release hygiene concerns
- `docker-compose.dev.yml` - development/runtime topology and env/runtime-state implications

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `portfolio/.env.example`: existing env-template seed that can be expanded into a fuller OSS-safe contract
- Workspace package manifests and per-app scripts: usable as the basis for a single root CI entrypoint instead of inventing a separate execution model
- `.planning/codebase/*.md`: already captures repo structure and concerns, which can drive the Phase 1 audit without rediscovering surfaces manually

### Established Patterns
- The repo currently has no root CI orchestration scripts and no `.github/` directory, so Phase 1 should add these incrementally rather than assuming an existing Actions layout
- The workspace root only includes `packages/*`, `portfolio`, and `worker`; `frontend/` is in-tree but outside the root npm workspaces, which affects how CI and docs should treat it
- Ignore rules are minimal today (`*.env`, `node_modules`, `.next`, `waha-data`), so public-release safety likely needs more explicit patterns and documentation

### Integration Points
- Root-level repo configuration: `.gitignore`, root `package.json`, and new `.github/` workflows/check configs
- App/package entrypoints: `portfolio/package.json`, `worker/package.json`, `frontend/package.json`, and shared package manifests as CI targets
- Runtime and infra surfaces: env files, docker compose files, and runtime-data directories that must be audited for public safety

</code_context>

<specifics>
## Specific Ideas

- Use the entire repository as the OSS safety boundary rather than defining unofficial private corners.
- Keep Phase 1 pragmatic: establish fast, reliable merge protection now and defer broader heavy test execution to the dedicated testing phase.
- Treat the legacy `frontend/` app as documented legacy scope, not as invisible scope.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 01-oss-safety-and-governance*
*Context gathered: 2026-04-08*
