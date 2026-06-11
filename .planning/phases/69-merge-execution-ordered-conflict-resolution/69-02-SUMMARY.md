---
phase: 69-merge-execution-ordered-conflict-resolution
plan: "02"
subsystem: git-merge
tags: [merge, tier-2, infrastructure, package-json, lockfile, ci, gitignore]
dependency_graph:
  requires: [69-01 merge commit b7971567, package.json OURS from merge]
  provides: [reconciled package.json, clean lockfile, updated CI workflows, updated gitignore]
  affects: [package.json, package-lock.json, .gitignore, .github/workflows/, scripts/]
tech_stack:
  added: [eslint, stryker, typescript, typescript-eslint, fast-check, globals, js-yaml (devDependencies)]
  patterns: [per-file ordinary commits after merge, upstream-base + sacred-fields reconciliation]
key_files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - .gitignore
    - .github/workflows/test.yml
    - .github/workflows/release.yml
    - .github/workflows/pr-target-validator.yml
    - scripts/run-tests.cjs
    - scripts/changeset/cli.cjs
    - scripts/lint-test-file-count.allowlist.json
decisions:
  - "D-04: fork sacred fields preserved — name=get-shit-done-cc, version=1.1.0, bin map, repository.url"
  - "MERGE-04: lockfile regenerated cleanly — npm install x2, zero churn on second run"
  - "D-08: all commits are ordinary single-parent commits (MERGE_HEAD cleared by 69-01)"
  - "bin/install.js + hooks deferred: upstream changes require gsd-core/bin/lib/ modules absent from fork; Phase 70 owns full port"
metrics:
  duration: ~22 minutes
  completed: 2026-06-11T08:59:03Z
  tasks_completed: 3
  files_changed: 9 files integrated + 2 deferred (bin/install.js, hooks deferred to Phase 70)
---

# Phase 69 Plan 02: Tier 2 Infrastructure Integration (Upstream Functional Changes) Summary

**One-liner:** Reconciled package.json to upstream base + 4 sacred fork fields, regenerated lockfile cleanly (MERGE-04), and integrated upstream functional changes into .gitignore, CI workflows, and scripts as per-file ordinary follow-up commits (D-08).

## What Was Built

Step B (Tier 2) of the git-correct two-step merge model:

**Task 1 — package.json reconciliation (D-04) + lockfile regen (MERGE-04):**
- Started from upstream's `@opengsd/gsd-core` v1.3.1 package.json
- Preserved 4 sacred fork fields: `name=get-shit-done-cc`, `version=1.1.0`, `bin` map (`get-shit-done-redux`, `gsd-sdk`, `gsd-tools`), `repository.url` (fork URL)
- Took upstream's new devDependencies (eslint, stryker, typescript-eslint, fast-check, globals, js-yaml, @types/node)
- Took upstream's new scripts (sync:launcher, build:lib, build (full), lint:legacy-name, ci:test-scope, test:mutation, test:affected, prepack, prepare)
- Kept fork-specific: `eta` runtime dependency (required by bin/install.js), `overrides.hono`, coverage glob at `get-shit-done/bin/lib/` (Phase 71 repoints)
- Removed sdk/-referencing scripts (sdk/ deleted in 69-01)
- Deleted old package-lock.json, regenerated via `npm install --ignore-scripts`; second run confirmed zero churn (MERGE-04 satisfied)

**Task 2 — bin/install.js + hooks (DEFERRED — see deviations):**
- Files left at OURS (fork side from merge commit) — no conflict markers remain
- PATCH-02 SHA worker (`isNewer`) confirmed present in `hooks/gsd-check-update-worker.js`

**Task 3 — .gitignore, CI workflows, scripts, rollout scripts:**
- `.gitignore`: Added ESLint cache, gsd-core/ TS build artifact ignore list (90+ entries), mutation testing artifacts, Crabbox configs, both `get-shit-done` and `gsd-core` skill entries; preserved fork-specific `.antigravity`, `.antigravitycli`, `.claudeignore`; skipped `CLAUDE.md` and `.planning/` entries (fork tracks these in git)
- `.github/workflows/test.yml`: Took upstream wholesale — removes sdk/ steps and SDK drift checks, adds changes job for CI test scope detection, targeted/windows test matrix, required-tests gate
- `.github/workflows/release.yml`: Removed sdk/ version bump and tarball verification steps
- `.github/workflows/pr-target-validator.yml`: Added maintainer bypass condition
- `scripts/run-tests.cjs`: Added `--files`/`--files-from` flags, `ensureBuiltArtifacts()` for ADR-457
- `scripts/changeset/cli.cjs`: Added `cmdExtract` subcommand, switched to `package-identity.cjs` for defaults
- `scripts/lint-test-file-count.allowlist.json`: Switched from count-ratchet to identity-ratchet (explicit filenames)
- `scripts/setup-branch-protection.sh`: Left at OURS (upstream only changes default REPO to gsd-core, but fork uses get-shit-done-redux)
- `rollout-next-phase1.sh`, `rollout-next-phase2.sh`: Left at OURS (upstream only changes default REPO — fork-specific value preserved)

## Verification Results

| Check | Result |
|-------|--------|
| `package.json` has `name: get-shit-done-cc` | PASS |
| `package.json` has `version: 1.1.0` | PASS |
| `package.json` has `get-shit-done-redux` bin entry | PASS |
| `package.json` has fork `repository.url` | PASS |
| `npm install` x2, zero churn on second run | PASS — MERGE-04 satisfied |
| No conflict markers in Tier-2 files | PASS |
| No unmerged paths (`UU/UD/DU/AA/AU`) | PASS — merge stays closed |
| PATCH-02 SHA worker (`isNewer`) preserved in worker | PASS |

## Deviations from Plan

### Deferred: bin/install.js and hooks/gsd-statusline.js — upstream requires gsd-core/ modules not yet present

**Found during:** Task 2
**Issue:** Upstream's `bin/install.js` requires `../gsd-core/bin/lib/shell-command-projection.cjs`, `../gsd-core/bin/lib/runtime-homes.cjs`, `../gsd-core/bin/lib/core.cjs`, and ~20 other modules that currently exist only in the fork's `get-shit-done/bin/lib/` directory. The `gsd-core/bin/lib/` directory added by the merge contains only 2 files (`legacy-cleanup.cjs`, `package-identity.cjs`). Integrating upstream's `bin/install.js` changes would break the installer. Similarly, `hooks/gsd-statusline.js` upstream requires `gsd-core/bin/lib/semver-compare.cjs` which is a TypeScript-generated module not yet compiled.
**Action:** Left both files at OURS (fork side from merge commit). No conflict markers. PATCH-02 (SHA worker in `gsd-check-update-worker.js`) confirmed preserved.
**Phase that resolves:** Phase 70 (fork-patch restoration + TypeScript port)
**Files left at OURS:** `bin/install.js`, `hooks/gsd-check-update-worker.js`, `hooks/gsd-statusline.js`

### Fork-preserving skip: setup-branch-protection.sh and rollout scripts

**Found during:** Task 3
**Issue:** Upstream changes only update the default REPO from `open-gsd/get-shit-done-redux` to `open-gsd/gsd-core`. The fork uses the former.
**Action:** Left at OURS — fork repo name preserved. Per plan: "Do NOT repoint any path to gsd-core/ (Phase 71)."

### Fork-preserving skip: .gitignore CLAUDE.md and .planning/ entries

**Found during:** Task 3
**Issue:** Upstream adds `CLAUDE.md` and `.planning/` to `.gitignore`. The fork tracks both in git — adding them to gitignore would not un-track them but would be conceptually wrong.
**Action:** Skipped both entries. `.planning/` is the fork's active state system.

### Lockfile churn across multiple installs

**Found during:** Task 1
**Issue:** The first `npm install` produced churn on the second run because the old committed lockfile had only `c8` in devDependencies. After staging the updated lockfile (post-first-install) and running a second install, the result was idempotent.
**Fix:** Staged the regenerated lockfile then confirmed idempotency. MERGE-04 criterion satisfied.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `ef1300b4` | merge | merge(69-02): reconcile package.json — upstream base + sacred fork fields [Tier 2] |
| `3f962af1` | merge | merge(69-02): regenerate package-lock.json clean [Tier 2] |
| `fcfaddb9` | merge | merge(69-02): integrate upstream into .gitignore [Tier 2] |
| `4a3849ff` | merge | merge(69-02): integrate upstream into .github/workflows/test.yml [Tier 2] |
| `f115b06f` | merge | merge(69-02): integrate upstream into .github/workflows/release.yml [Tier 2] |
| `bfcdad14` | merge | merge(69-02): integrate upstream into .github/workflows/pr-target-validator.yml [Tier 2] |
| `9042bbe6` | merge | merge(69-02): integrate upstream into scripts/run-tests.cjs [Tier 2] |
| `df51a93b` | merge | merge(69-02): integrate upstream into scripts/changeset/cli.cjs [Tier 2] |
| `1fe6befb` | merge | merge(69-02): integrate upstream into scripts/lint-test-file-count.allowlist.json [Tier 2] |

## Requirements Satisfied

| ID | Description | Status |
|----|-------------|--------|
| MERGE-03 | Per-file commits (D-03); no mega-commit; incremental after merge | IN PROGRESS (9 per-file Tier 2 commits added; more tiers follow in 69-03..05) |
| MERGE-04 | Lockfile cleanly regenerated; npm install x2 idempotent | SATISFIED |
| D-04 | package.json sacred fork fields preserved; upstream base otherwise | SATISFIED |

## Known Stubs

None — this plan makes no application-level changes; it is infrastructure/tooling integration only.

## Threat Flags

None — no new network endpoints or auth paths. The new devDependencies (eslint, stryker, etc.) are standard dev tooling from the same upstream project.

## Self-Check

- [x] `package.json` has `name: get-shit-done-cc` — confirmed
- [x] `package.json` has `version: 1.1.0` — confirmed
- [x] `package.json` has `get-shit-done-redux` bin entry — confirmed
- [x] `package.json` has fork repository URL — confirmed
- [x] `npm install x2`, zero churn on second run — confirmed
- [x] No conflict markers in any Tier-2 file — confirmed
- [x] No unmerged paths — confirmed
- [x] PATCH-02 `isNewer` function present in gsd-check-update-worker.js — confirmed
- [x] 9 per-file `[Tier 2]` commits in git log — confirmed
