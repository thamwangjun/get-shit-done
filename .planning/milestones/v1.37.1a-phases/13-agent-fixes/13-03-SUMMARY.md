---
phase: 13-agent-fixes
plan: "03"
subsystem: tests
tags: [test-gate, positive-framing, corpus-scan, do-not-violations, FRAMING-01, FRAMING-02, FRAMING-03, FRAMING-04, FRAMING-05, FRAMING-06]
dependency_graph:
  requires: [13-01, 13-02]
  provides: [corpus-scan-do-not-agent-gate]
  affects: [tests/negative-framing-scan.test.cjs]
tech-stack:
  added: []
  patterns:
    - "corpus scan subtest scoped to phase boundary (agent files only for Phase 13)"
key-files:
  created: []
  modified:
    - tests/negative-framing-scan.test.cjs
key-decisions:
  - "DO NOT corpus scan added with agent-files-only subtest (Phase 13 scope); workflow/reference/command subtests deferred to Phase 14"
  - "Test file adds 'corpus scan — DO NOT primary directives (case-insensitive)' describe block with 1 subtest"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-22"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 1
requirements-completed: [FRAMING-01, FRAMING-02, FRAMING-03, FRAMING-04, FRAMING-05, FRAMING-06]
---

# Phase 13 Plan 03: Test Gates — Corpus Scan and Frontmatter Integrity Summary

**Test suite confirms all 6 bare Do NOT violations from Phase 13 Plans 01 and 02 are resolved; YAML frontmatter integrity verified across all 31 agent files**

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Run corpus scan — confirm agent DO NOT violations cleared; add DO NOT corpus scan subtest | 03fccff | tests/negative-framing-scan.test.cjs |
| 2 | Run agent-frontmatter test — confirm YAML integrity | (no changes needed) | — |

## What Was Done

### Task 1 — Corpus Scan Gate

**Pre-run sanity check:** All 4 targeted agent files returned no output for the expected violation patterns:
- `grep -in "do not generate" agents/gsd-assumptions-analyzer.md` → PASS (no output)
- `grep -in "do not verify" agents/gsd-doc-verifier.md` → PASS (no output)
- `grep -in "do not proceed" agents/gsd-user-profiler.md` → PASS (no output)
- `grep -in "do not skip|do not create review|do not leave" agents/gsd-code-fixer.md` → PASS (no output)

**DO NOT corpus scan test gap identified:** The plan's must_haves required a `corpus scan — DO NOT primary directives (case-insensitive)` subtest in `tests/negative-framing-scan.test.cjs`, but this describe block did not exist in the test file. The file only had `corpus scan — NEVER primary directives` tests. Rule 2 (auto-add missing critical functionality) applied: the test was added.

**Added describe block:** `corpus scan — DO NOT primary directives (case-insensitive)` with subtest `no bare DO NOT directives in agent files`. Scope is agent files only (Phase 13). Workflow DO NOT tests are Phase 14 scope (4 violations remain in `get-shit-done/workflows/`).

**Scanner result (all 4 Phase 13 agent files):** 0 violations confirmed by both manual scanner execution and the new corpus scan subtest.

**Final test run:** `node --test tests/negative-framing-scan.test.cjs` → 35/35 pass (was 34/34 before adding the new subtest), exit 0.

### Task 2 — Agent-Frontmatter Integrity Gate

**Test run:** `node --test tests/agent-frontmatter.test.cjs` → 155/155 pass, 0 failures, exit 0.

No YAML frontmatter corruption was introduced by Plans 01 or 02. All 31 agent files pass:
- HDOC: anti-heredoc instruction (22 file-writing agents + 1 sweep test)
- SKILL: skills frontmatter absent (31 agents)
- HOOK: hooks frontmatter pattern (31 agents)
- SPAWN: spawn type consistency (5 tests)
- AGENT: required frontmatter fields (31 agents)
- CLAUDEMD: compliance enforcement (4 tests)
- VERIFY: data-flow trace and behavioral spot-checks (6 tests)
- DISCUSS: discussion log generation (2 tests)
- COMPAT: no runtime-specific frontmatter keys (22 agents)

## Verification Results

```
node --test tests/negative-framing-scan.test.cjs
  ✔ no bare DO NOT directives in agent files (12ms)
  [34 NEVER tests also pass]
  35/35 pass, exit 0

node --test tests/agent-frontmatter.test.cjs
  [155 tests pass across 9 describe blocks]
  155/155 pass, exit 0
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added 'DO NOT primary directives' corpus scan subtest**
- **Found during:** Task 1 (interpreting corpus scan output)
- **Issue:** Plan must_haves required `corpus scan — DO NOT primary directives (case-insensitive) subtest for agent files passes with 0 violations`, but this describe block was absent from `tests/negative-framing-scan.test.cjs`. The test file had only NEVER corpus scans.
- **Fix:** Added `describe('corpus scan — DO NOT primary directives (case-insensitive)')` block with `test('no bare DO NOT directives in agent files')` subtest. Scoped to agent files only (Phase 13 boundary); workflow DO NOT subtests deferred to Phase 14.
- **Files modified:** tests/negative-framing-scan.test.cjs
- **Commit:** 03fccff
- **Why not Rule 4:** Adding a subtest within an existing describe pattern is not an architectural change. The file already had the scanner infrastructure and SCAN_DIRS. This is a missing gate test, not a structural decision.

## Phase 13 Completion Status

All 6 FRAMING requirements are satisfied:

| Req ID | File | Fix | Test Result |
|--------|------|-----|-------------|
| FRAMING-01 | gsd-assumptions-analyzer.md:111 | "Keep area count within the tier limit..." | PASS (Plan 01) |
| FRAMING-02 | gsd-code-fixer.md:138 | "Apply the fix even when..." | PASS (Plan 02) |
| FRAMING-03 | gsd-code-fixer.md:240 | Bullet deleted | PASS (Plan 02) |
| FRAMING-04 | gsd-code-fixer.md:343+474 | "Restore all files to pre-fix state..." | PASS (Plan 02) |
| FRAMING-05 | gsd-doc-verifier.md:92 | "Skip verification for the following:" | PASS (Plan 01) |
| FRAMING-06 | gsd-user-profiler.md:88 | "Load the rubric fully before..." | PASS (Plan 01) |

**Phase 13 is ready to hand off to Phase 14 (Workflow, Reference, and Command Fixes).**

Phase 14 DO NOT scope: 4 violations remain in `get-shit-done/workflows/` (not agent files). References and commands are already clean (0 violations each).

## Known Stubs

None.

## Threat Flags

None. Changes are confined to one test file (`tests/negative-framing-scan.test.cjs`). No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- tests/negative-framing-scan.test.cjs — modified, contains `corpus scan — DO NOT primary directives (case-insensitive)` describe block with 1 subtest
- Commit 03fccff — present in git log
- `node --test tests/negative-framing-scan.test.cjs` → exit 0, 35/35 pass
- `node --test tests/agent-frontmatter.test.cjs` → exit 0, 155/155 pass
