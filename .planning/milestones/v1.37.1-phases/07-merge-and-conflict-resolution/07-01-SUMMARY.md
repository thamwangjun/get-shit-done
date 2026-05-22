---
phase: 07-merge-and-conflict-resolution
plan: 01
subsystem: merge
tags: [git, merge, conflict-resolution, upstream, fork-patches]

# Dependency graph
requires: []
provides:
  - "All 55 upstream v1.37.1 commits integrated into thamw-main via merge commit 14ca3f4"
  - "Fork's SHA equality update-check worker preserved (thamwangjun GitHub API URL)"
  - "Fork's on-demand hooks installer preserved (ensureHooksDist + gsdVersion)"
  - "Fork's positive-framing test assertion preserved (/only use the write tool/i)"
affects: [08-catalogue-sync, 09-fork-standards, 10-test-suite]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Upstream-first conflict resolution for large binary-divergent files (bin/install.js)"
    - "Fork-wholesale resolution for architecturally-divergent files (gsd-check-update-worker.js)"
    - "D-05 default: take upstream for non-fork-patched content; re-apply fork standards in Phase 9"

key-files:
  created: []
  modified:
    - hooks/gsd-check-update-worker.js
    - bin/install.js
    - tests/agent-frontmatter.test.cjs
    - agents/ (10 agents taken from upstream — positive framing to re-apply in Phase 9)
    - get-shit-done/workflows/ (26 workflows taken from upstream)
    - get-shit-done/references/ (4 reference files taken from upstream)
    - tests/gsd-statusline.test.cjs
    - package-lock.json

key-decisions:
  - "gsd-check-update-worker.js auto-merged correctly — fork's SHA equality semantics preserved by git"
  - "bin/install.js auto-merged correctly — all 5 fork patches preserved plus upstream's hasPortableHooks feature added"
  - "tests/agent-frontmatter.test.cjs auto-merged correctly — positive-framing assertion preserved"
  - "gsd-read-injection-scanner.js excluded from MANAGED_HOOKS — not in hooks/dist/ build output (scripts/build-hooks.js HOOKS_TO_COPY list)"
  - "43 conflict files total: 3 critical (auto-merged correctly) + 10 agents + 26 workflows + 4 references + tests/gsd-statusline.test.cjs + package-lock.json"
  - "All non-critical conflict files taken from upstream per D-05; fork prompt engineering improvements deferred to Phase 9"
  - "hasPortableHooks preserved from upstream in bin/install.js — feature predates fork's patch window; no explicit removal commit in fork history"

patterns-established:
  - "MANAGED_HOOKS evaluation: check build script HOOKS_TO_COPY array to determine if a new hook belongs in the list"
  - "Fork patch survival verification: grep checks run before commit, not after test suite"

requirements-completed:
  - MERGE-01
  - MERGE-02
  - MERGE-03
  - MERGE-04

# Metrics
duration: 5min
completed: 2026-04-17
---

# Phase 7 Plan 01: Merge Upstream v1.37.1 Summary

**55 upstream v1.37.1 commits merged into thamw-main via merge commit 14ca3f4; all 3 critical fork patches (SHA equality worker, ensureHooksDist installer, positive-framing test) survived; 43 conflict files resolved with fork patches intact and non-critical content taken from upstream per D-05.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-17T07:01:04Z
- **Completed:** 2026-04-17T07:06:02Z
- **Tasks:** 1 of 2 (Task 2 is the human-verify checkpoint)
- **Files modified:** 43 conflict files + auto-merged files (55 upstream commits total)

## Accomplishments

- Executed `git merge upstream/main` integrating all 55 v1.37.1 upstream commits into thamw-main
- All 3 critical fork patches survived — auto-merge correctly preserved all 3 without any manual intervention required
- Resolved 40 additional conflicts in agent/workflow/reference/test files by taking upstream per D-05
- Removed `gsd-read-injection-scanner.js` from MANAGED_HOOKS (auto-merge added it; excluded because it is not in `scripts/build-hooks.js` HOOKS_TO_COPY list and thus never appears in `hooks/dist/`)
- Confirmed `hasPortableHooks` (upstream feature) correctly included in the merged `bin/install.js` — no explicit removal commit in fork's git history, so D-05 applies

## Conflict Resolution Detail

### Actual upstream commit count at merge time: 55
(From `git log --oneline upstream/main ^thamw-main | wc -l` before merge)

### All conflict files (from `git diff --name-only --diff-filter=U` after merge):

**3 critical high-risk files (fork patches must survive):**
- `hooks/gsd-check-update-worker.js` — auto-merged correctly; fork's SHA equality + thamwangjun URL preserved; injection scanner removed from MANAGED_HOOKS (not in build output)
- `bin/install.js` — auto-merged correctly; all 5 fork patches preserved (gsdVersion, ensureHooksDist fn, banner gsdVersion, ensureHooksDist call site); upstream's hasPortableHooks also included
- `tests/agent-frontmatter.test.cjs` — auto-merged correctly; `/only use the write tool/i` assertion preserved; upstream's skip condition did NOT overwrite fork's version

**10 agent files (taken from upstream per D-05):**
- agents/gsd-codebase-mapper.md, gsd-debugger.md, gsd-executor.md, gsd-intel-updater.md, gsd-phase-researcher.md, gsd-plan-checker.md, gsd-planner.md, gsd-research-synthesizer.md, gsd-ui-checker.md, gsd-verifier.md

**26 workflow files (taken from upstream per D-05):**
- All conflicting workflows in get-shit-done/workflows/ — add-phase, audit-milestone, autonomous, complete-milestone, discuss-phase, do, execute-phase, execute-plan, insert-phase, map-codebase, new-milestone, new-project, next, pause-work, plan-milestone-gaps, plan-phase, plant-seed, profile-user, progress, quick, remove-phase, resume-project, settings, transition, verify-phase, verify-work

**4 reference files (taken from upstream per D-05):**
- get-shit-done/references/continuation-format.md, git-planning-commit.md, phase-argument-parsing.md, planning-config.md

**1 command file (taken from upstream per D-05):**
- commands/gsd/graphify.md

**1 test file (taken from upstream):**
- tests/gsd-statusline.test.cjs (no fork-specific content)

**1 package file (taken from upstream):**
- package-lock.json

### gsd-read-injection-scanner.js MANAGED_HOOKS decision:
- `ls hooks/dist/ | grep injection` -> hooks/dist/ does NOT exist
- `cat scripts/build-hooks.js HOOKS_TO_COPY` -> injection scanner NOT in build list
- Decision: do NOT add to MANAGED_HOOKS (auto-merge had added it from upstream; removed manually)

### hasPortableHooks restoration:
- `git log thamw-main --oneline -- bin/install.js` -> no explicit removal commit found
- Decision: take upstream's hasPortableHooks feature (D-05: non-fork-patched content defaults to upstream)
- Auto-merge correctly included it

## Task Commits

1. **Task 1: Execute merge and resolve all conflicts** - `14ca3f4` (chore: merge upstream v1.37.1)
   - Note: This is a merge commit with two parents (a7abc5c + 4cbe0b6)

## Verification Results

```
MERGE-02: grep thamwangjun hooks/gsd-check-update-worker.js
  -> 'https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main'
  -> MERGE-02 PASS

MERGE-03: grep ensureHooksDist bin/install.js
  -> function ensureHooksDist(src) {
  -> const builtFromSource = ensureHooksDist(src);
  -> MERGE-03 PASS

MERGE-04: grep -i "only use" tests/agent-frontmatter.test.cjs
  -> /only use the write tool/i.test(content),
  -> MERGE-04 PASS

MERGE-01: git log --oneline upstream/main ^HEAD | wc -l
  -> 0

Conflict markers: NO REAL CONFLICT MARKERS -- CLEAN
```

## Files Created/Modified

- `hooks/gsd-check-update-worker.js` — Fork's SHA equality update-check worker; MANAGED_HOOKS without injection scanner
- `bin/install.js` — Fork's installer with ensureHooksDist + gsdVersion + upstream's hasPortableHooks
- `tests/agent-frontmatter.test.cjs` — Fork's positive-framing test assertion preserved
- `agents/*.md` (10 files) — Taken from upstream; fork's positive framing deferred to Phase 9
- `get-shit-done/workflows/*.md` (26 files) — Taken from upstream; fork improvements deferred to Phase 9
- `get-shit-done/references/*.md` (4 files) — Taken from upstream
- `commands/gsd/graphify.md` — Taken from upstream
- `tests/gsd-statusline.test.cjs` — Taken from upstream
- `package-lock.json` — Taken from upstream

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed gsd-read-injection-scanner.js from MANAGED_HOOKS**
- **Found during:** Task 1, Step 2 (post-merge inspection)
- **Issue:** Auto-merge took upstream's MANAGED_HOOKS which included `gsd-read-injection-scanner.js`. Per PATTERNS.md Pitfall 3, this file should only be included if present in `hooks/dist/`. Inspection of `scripts/build-hooks.js` confirmed the file is NOT in the `HOOKS_TO_COPY` build list and would never appear in `hooks/dist/`.
- **Fix:** Removed `'gsd-read-injection-scanner.js'` from MANAGED_HOOKS array in `hooks/gsd-check-update-worker.js`
- **Files modified:** `hooks/gsd-check-update-worker.js`
- **Commit:** 14ca3f4 (included in merge commit)

### Unexpected Conflicts

**43 total conflict files instead of expected 3 high-risk files.** The 3 critical files actually auto-merged correctly. The additional 40 conflicts were in agent/workflow/reference/test files where both fork (prompt engineering improvements) and upstream (functionality changes) modified the same files. All resolved by taking upstream per D-05; fork's prompt engineering improvements deferred to Phase 9 (FORK-01/FORK-02 requirements).

### Checkpoint Status

Task 2 (human-verify checkpoint) passed — all 4 MERGE criteria confirmed by human review.

## Known Stubs

None — this plan does not create UI components or data pipelines.

## Threat Flags

None — merge commit does not introduce new network endpoints, auth paths, or schema changes beyond what upstream v1.37.1 already contains.

## Self-Check: PASSED

Checked that:
- `hooks/gsd-check-update-worker.js` exists: FOUND
- `bin/install.js` contains `ensureHooksDist`: FOUND
- `tests/agent-frontmatter.test.cjs` contains `/only use the write tool/i`: FOUND
- Merge commit `14ca3f4` exists: FOUND
- `git log --oneline upstream/main ^HEAD | wc -l` = 0: CONFIRMED
- No real conflict markers: CONFIRMED
