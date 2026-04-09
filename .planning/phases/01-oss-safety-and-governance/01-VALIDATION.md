---
phase: 1
slug: oss-safety-and-governance
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-08
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | PowerShell/git static audits + npm workspace scripts + GitHub Actions workflows |
| **Config file** | `package.json`, `.github/workflows/*.yml`, repo docs added in this phase |
| **Quick run command** | `git ls-files '*.env*' '*.pem' '*.key' '*.crt'` |
| **Full suite command** | `npm run ci` |
| **Estimated runtime** | ~10 seconds quick / ~120 seconds full |

---

## Sampling Rate

- **After every task commit:** Run the task-level `<automated>` command plus `git ls-files '*.env*' '*.pem' '*.key' '*.crt'`
- **After every plan wave:** Run `npm run ci`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds for task loop, 120 seconds for wave loop

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | OSS-01 | T-1-01 | Ignore rules and tracked-file audit catch public-repo safety issues early | static audit | `git ls-files '*.env*' '*.pem' '*.key' '*.crt'` | yes | pending |
| 1-01-02 | 01 | 1 | OSS-01, OSS-02 | T-1-02 | Env contract docs cover active surfaces and legacy frontend rationale safely | static audit | `Select-String -Path README.md -Pattern 'frontend|portfolio|worker|Environment'` | yes | pending |
| 1-02-01 | 02 | 2 | CI-01 | T-1-04 | Root CI entrypoint exists and is documented for local and CI usage | workflow + build | `Select-String -Path package.json -Pattern 'ci:phase1|ci'` | yes | pending |
| 1-02-02 | 02 | 2 | CI-02 | T-1-05 | PR workflow explicitly covers apps and shared packages without fragile trigger-only gating | workflow + build | `Select-String -Path .github/workflows/pr.yml -Pattern 'pull_request|package|packages|ci:phase1|npm run ci'` | no-wave0 | pending |
| 1-03-01 | 03 | 3 | OSS-03, CI-03 | T-1-07 | Dependency review, secret scanning, and baseline static security automation are committed | static audit | `Select-String -Path .github/workflows/dependency-review.yml,.github/workflows/secret-scan.yml,.github/workflows/static-security.yml -Pattern 'pull_request|push|gitleaks|codeql|security'` | no-wave0 | pending |
| 1-03-02 | 03 | 3 | OSS-03 | T-1-08 | Publication guidance clearly separates git-committed controls from GitHub UI settings | static audit | `Select-String -Path README.md -Pattern 'push protection|secret scanning|dependency review|public'` | yes | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers the phase-planning verification baseline. Per-task `<automated>` commands use existing git/PowerShell checks until the phase itself creates the root CI scripts and workflows.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GitHub repository settings match documented security expectations | OSS-03, CI-03 | Push protection, secret scanning, and default code scanning may require repo-admin UI actions | Follow the publication/security checklist and confirm the repository settings are enabled after publish |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s for task loop
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-08
