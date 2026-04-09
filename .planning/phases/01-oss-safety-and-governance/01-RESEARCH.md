# Phase 1 Research: OSS Safety And Governance

**Phase:** 1 - OSS Safety And Governance
**Date:** 2026-04-08
**Status:** Ready for planning

## Research Objective

Determine the safest and most incremental way to make this monorepo public-safe while adding a practical CI and repository-security baseline that does not rewrite the current architecture.

## Repo-Specific Starting Point

- The repository currently has no `.github/` directory, so CI and GitHub-native security enforcement must be added from scratch.
- The root workspace includes `packages/*`, `portfolio`, and `worker`, but `frontend/` is in-tree outside the root npm workspaces and still needs OSS hygiene coverage.
- The current `.gitignore` is minimal and does not reflect the full set of generated/runtime state that should stay out of a public repo.
- `portfolio/.env.example` exists, but there is no complete cross-surface environment contract for `worker/`, shared packages, or root-level operational expectations.
- Runtime data directories such as `waha-data/` and `portfolio/waha-data/` are already known concerns and should be treated as first-class audit targets.

## Key Research Findings

### 1. Public-repo safety should be enforced as a whole-repo policy

The repo should be treated as fully public-safe by default, not as a mostly-public repo with undocumented exceptions. That means Phase 1 plans should explicitly audit tracked files, ignore rules, and runtime/data artifacts across the full tree, including legacy and non-workspace surfaces.

For this repository, that means the Phase 1 audit must cover:
- root and nested `.env*` files
- runtime state directories like `waha-data/`
- build artifacts such as `.next/`, `dist/`, and coverage outputs
- Docker and deployment config that may leak internal operational assumptions
- legacy `frontend/` config and dependencies

### 2. A root CI entrypoint is worth standardizing now

GitHub Actions supports multiple workflows, path filters, matrices, and reusable triggers, but Phase 1 should start by defining one root CI entrypoint that can also be run locally. That keeps CI behavior explainable and prevents drift between local checks and PR checks.

For this repo, that usually means:
- adding root `package.json` scripts that orchestrate baseline checks
- keeping the first CI pass to lint/build/security checks rather than broad full-suite testing
- using path-aware workflows so changes do not always rebuild every surface

GitHub’s workflow syntax supports `paths`/`paths-ignore`, but skipped required workflows can leave PR checks pending. Planning should avoid a design where required checks never resolve when filters skip the workflow. A better baseline is a stable workflow that always runs and internally decides which jobs or targets are relevant.

### 3. Dependency review is a strong Phase 1 fit for public PR protection

GitHub’s dependency review is available for public repositories and can fail PR checks when a change introduces vulnerable dependencies. This maps cleanly to `CI-03` without forcing a full dependency-upgrade program in Phase 1.

Recommended use in this repo:
- run dependency review on pull requests that touch manifests or lockfiles
- make it a required check on public PRs once the workflow is stable
- keep the threshold simple at first: fail on introduced vulnerabilities, tighten later if needed

### 4. Secret scanning and push protection are complementary, not interchangeable

GitHub secret scanning detects exposed secrets already in the repo; push protection blocks them before push. For public repositories on GitHub.com, secret scanning is available for free, and push protection for users is on by default for pushes to public repos. Repository-level push protection and alerts depend on repository-level feature enablement.

Planning implication:
- do not assume GitHub platform settings alone are enough
- add repo-side safeguards too, such as OSS-safe examples, ignore rules, and local/CI secret scanning
- include explicit documentation for which GitHub repository settings the operator must enable after publishing

### 5. Code scanning should be treated as opportunistic baseline security, not a blocker to Phase 1 completion

GitHub recommends CodeQL default setup for eligible repositories because it is low-maintenance and automatically scans supported languages on pushes to the default or protected branches. This is useful for the TypeScript-heavy surfaces here, but the plan should not depend solely on GitHub-hosted code scanning to satisfy Phase 1 security goals.

Planning implication:
- if repository settings support CodeQL default setup, document enabling it as part of repo security controls
- keep workflow-owned security checks independent enough that Phase 1 still succeeds even if some GitHub Advanced Security settings require manual enablement

### 6. Environment contracts should be per runnable surface, with a root guide

The most practical pattern for a mixed monorepo is:
- root guidance describing each integration and which surface consumes it
- per-surface `.env.example` files or equivalent for runnable apps/services
- no real values, no copied secrets, and clear separation between required and optional variables

For this repo, the planner should avoid a single giant undocumented root env file. The stronger plan is:
- preserve or expand `portfolio/.env.example`
- add `worker/.env.example` if the worker has independent runtime needs
- document shared package env expectations where they are actually consumed

### 7. Legacy surfaces should be documented, not silently excluded

Because `frontend/` is still in-tree and currently public by default once the repo is published, it must be covered by:
- ignore rules and public-safety audit
- baseline CI/lint handling if still buildable
- explicit documentation that it is legacy so future contributors do not misread repo intent

The lowest-risk incremental posture is to keep it visible but clearly classified.

## Recommended Plan Shape

The roadmap already proposes the correct split. Research suggests the three Plan 1.x slices should stay close to:

### Plan 01-01: Repo hygiene and env contract

Focus:
- tracked-file audit
- ignore-rule hardening
- env-template and env-doc baseline
- runtime/generated-data cleanup rules

Key outcome:
- the repo becomes publishable without exposing secrets or operational state

### Plan 01-02: CI entrypoint and scoped workflow baseline

Focus:
- root scripts for CI parity
- GitHub Actions workflows
- path-aware but stable PR checks
- baseline lint/build/security flow for affected surfaces

Key outcome:
- one reliable CI path exists locally and in GitHub Actions

### Plan 01-03: Repository security controls and publication guidance

Focus:
- dependency review
- secret scanning and push-protection documentation
- code scanning/default setup guidance where available
- release/publication checklist for safe open-source publication

Key outcome:
- future leaks and unsafe dependency changes are more likely to be blocked before merge or push

## Planning Constraints And Tradeoffs

### Keep Phase 1 incremental

Do not mix in deep code hardening or full test-framework rollout here. Phase 1 succeeds by creating the safety boundary and automation baseline that later phases can build on.

### Prefer stable required checks over clever but fragile filtering

Path filtering is useful, but required PR checks should not end up stuck in pending states because the workflow never ran. Use a stable top-level workflow and selectively skip or no-op internal jobs instead of relying only on trigger-level filters for required checks.

### Separate repo-controlled safeguards from platform-controlled safeguards

Some security capabilities live in GitHub settings rather than repo files. Plans should distinguish:
- repo-owned deliverables: docs, scripts, workflows, ignore rules, templates
- operator follow-up steps: enabling repository features like push protection or CodeQL default setup

### Treat lockfiles as security-relevant artifacts

This repo has multiple lockfiles and mixed package surfaces. The plan should decide whether all active surfaces keep their lockfiles and how dependency review/CI will treat each one consistently.

## Validation Architecture

Phase 1 validation should combine static repo inspection with repeatable CI entrypoint checks.

### Artifact-level validation

- Verify no unsafe tracked env or credential files remain in git except safe example files
- Verify runtime/generated directories are ignored or explicitly documented as non-source
- Verify every runnable surface has an OSS-safe env contract or documented rationale
- Verify `.github/workflows/` exists and contains the baseline PR workflow(s)

### Command-level validation

- A documented root CI command runs successfully in the local repo context
- CI workflows can execute baseline lint/build/security checks without depending on undeclared local state
- Dependency/security workflows are wired to PRs and/or repo guidance as intended

### Governance validation

- Publication or release guidance exists and clearly lists any GitHub settings the operator must enable manually
- The repo can be published publicly without relying on tribal knowledge about “private” folders

## Risks To Watch During Planning

- Overloading Phase 1 with test infrastructure that belongs in Phase 3
- Designing required checks that remain pending when workflows are skipped
- Documenting GitHub security features as if they were repo-committed automation when they actually require manual repository settings
- Forgetting non-workspace surfaces like `frontend/` and nested runtime data
- Adding examples/docs that accidentally normalize production secret names without enough context for safe usage

## Sources

### Official
- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
- [About dependency review](https://docs.github.com/en/enterprise-cloud%40latest/code-security/concepts/supply-chain-security/about-dependency-review)
- [Configuring the dependency review action](https://docs.github.com/en/enterprise-cloud%40latest/code-security/supply-chain-security/understanding-your-software-supply-chain/configuring-the-dependency-review-action)
- [About push protection](https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection)
- [Enabling push protection for your repository](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/prevent-future-leaks/enabling-push-protection-for-your-repository)
- [Enabling secret scanning features](https://docs.github.com/code-security/secret-scanning/configuring-secret-scanning-for-your-repositories)
- [Configuring default setup for code scanning](https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning)
- [npm workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces/)

### Local Context
- `.planning/phases/01-oss-safety-and-governance/01-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/CONCERNS.md`

---

## RESEARCH COMPLETE
