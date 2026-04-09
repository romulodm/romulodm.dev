# Security Policy

## Reporting a Vulnerability

Please do not open public issues for suspected secrets exposure, auth flaws, payment bugs, or other sensitive vulnerabilities.

Report security issues privately to the repository owner with:
- a short description of the issue
- the affected file, route, or workflow
- reproduction steps or proof of concept when possible
- impact assessment if known

## Baseline Protections in This Repository

Committed protections:
- `PR Validation` workflow for scoped CI checks
- `Security Review` workflow for npm audit coverage
- `Dependency Review` workflow for pull request dependency changes
- `Secret Scan` workflow for committed secret-leak detection
- `Static Security` workflow for baseline CodeQL analysis

Repository hygiene protections:
- nested `.env.*` files are ignored by default
- only `*.env.example` files are intended to be tracked
- runtime state such as `waha-data/`, build output, and coverage output should stay out of git

## GitHub Settings To Enable After Publishing

Some controls live in GitHub repository settings rather than in committed files. After the repo is public, enable or confirm:
- secret scanning alerts
- push protection for supported secret patterns
- code scanning / CodeQL default setup if you prefer GitHub-managed setup in addition to the committed workflow
- branch protection rules requiring CI checks before merge

## Secret Handling Expectations

- never commit production credentials, tokens, API keys, private endpoints, or exported runtime sessions
- rotate any secret immediately if it is exposed in git history, logs, screenshots, or PR comments
- use deployment-platform secrets or a secret manager for production values

## Supported Scope

This repository is a personal production monorepo. The most sensitive areas are:
- authentication and admin control
- background worker and queue integrations
- payment and webhook flows
- upload/storage credentials
- third-party API integrations
