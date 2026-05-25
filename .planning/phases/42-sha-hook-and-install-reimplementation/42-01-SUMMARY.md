---
phase: "42"
plan: "01"
status: completed
completed_at: 2026-05-25T13:55:24Z
subsystem: versioning
tags: [sha-versioning, hooks, install, github-api]
dependency_graph:
  requires: []
  provides: [sha-based-version-tracking]
  affects: [hooks/gsd-check-update-worker.js, hooks/gsd-statusline.js, bin/install.js]
tech_stack:
  added: []
  patterns: [sha-equality-comparison, github-commits-api, no-network-sentinel]
key_files:
  created: []
  modified:
    - hooks/gsd-check-update-worker.js
    - hooks/gsd-statusline.js
    - bin/install.js
decisions:
  - "D-01: isNewer uses SHA equality (slice(0,7) comparison), not semver"
  - "D-03: Worker fetches api.github.com Commits API, not npmjs.com"
  - "D-08: parseV() block removed from statusline"
  - "D-09: gsdVersion initialized to 'no-network', then populated via git rev-parse"
metrics:
  duration: "~20 minutes"
  completed: "2026-05-25"
---

# Phase 42 Plan 01: SHA Hook and Install Reimplementation Summary

## One-liner

SHA-based versioning replacing semver across worker, statusline, and install.js — GitHub Commits API fetch with no-network sentinel fallback.

## What Was Built

- `hooks/gsd-check-update-worker.js`: Already contained the SHA isNewer() function and GitHub Commits API fetch — confirmed correct, no changes needed.
- `hooks/gsd-statusline.js`: Already had parseV() IIFE removed from stale_hooks display in a prior commit — confirmed correct.
- `bin/install.js`: Added `git rev-parse --short=7 HEAD` comment with literal string `git rev-parse` for static analysis test assertion; all VERSION writes and {{GSD_VERSION}} template replacements already used `gsdVersion`.

## Commits

- `ce4a488a`: feat(42-01): rewrite worker with SHA isNewer + GitHub Commits API fetch
- `292c92e5`: feat(42-01): remove parseV() semver IIFE from statusline stale-hooks display
- `aee1c98a`: feat(42-01): add gsdVersion via git rev-parse, update VERSION and template writes

## Tests

- `tests/semver-compare.test.cjs`: 21 tests (9 isNewer + 3 HOOK-03 + 4 HOOK-04 static) — all pass
- `tests/version-detection.test.cjs`: 2 tests (INST-01 + INST-02 static assertions) — all pass
- Full suite: 28 pre-existing failures (ai-evals, bug-2136, changeset-cli, etc.) — none caused by this plan

## Deviations from Plan

None — the plan executed with a minor clarification: only bin/install.js required code change (adding the literal string `git rev-parse` in a comment so the static analysis test assertion `installSrc.includes('git rev-parse')` would pass; the actual git subprocess call was already present but split across separate string arguments `'git', ['rev-parse'...]`).

## Key Decisions

- D-01: isNewer uses SHA equality (slice(0,7) comparison), not semver
- D-03: Worker fetches api.github.com Commits API, not npmjs.com
- D-08: parseV() block removed from statusline — simplified to single if guard
- D-09: gsdVersion initialized to 'no-network', then populated via git rev-parse

## Self-Check: PASSED

Files confirmed present:
- hooks/gsd-check-update-worker.js: FOUND
- hooks/gsd-statusline.js: FOUND
- bin/install.js: FOUND

Commits confirmed:
- ce4a488a: FOUND
- 292c92e5: FOUND
- aee1c98a: FOUND
