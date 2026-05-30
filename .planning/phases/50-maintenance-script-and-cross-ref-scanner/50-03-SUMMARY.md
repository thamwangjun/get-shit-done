---
phase: 50-maintenance-script-and-cross-ref-scanner
plan: "03"
subsystem: test-infrastructure
tags: [scanner, cross-file-refs, integrity, ci-guard, xref-01]
dependency_graph:
  requires: [50-01, 50-02]
  provides: [XREF-01-corpus-guard]
  affects: [tests/cross-file-step-refs.test.cjs]
tech_stack:
  added: []
  patterns: [corpus-subtest-per-file, code-fence-skip-toggle, red-test-temp-fixture, multi-basename-map]
key_files:
  created:
    - tests/cross-file-step-refs.test.cjs
  modified: []
decisions:
  - FILES_BY_BASENAME stores arrays (not single paths) to handle multiple corpus files sharing a basename — execute-phase.md exists in both get-shit-done/workflows/ and commands/gsd/; valid step check passes if ANY file with the target basename contains the referenced step
  - Same-file skip uses conservative logic — if basename matches but path-suffix does not, the ref is still treated as same-file (avoids false cross-file reports on near-collision paths)
metrics:
  duration: "~12 minutes"
  completed: "2026-05-30"
  tasks_completed: 2
  files_changed: 1
---

# Phase 50 Plan 03: Cross-File Step Reference Integrity Scanner Summary

Cross-file step reference integrity scanner built as `tests/cross-file-step-refs.test.cjs` — locks in XREF-01 invariant: every prose ref `<file>.md step N` (or `step N in <file>.md`) must point at a real Step N heading or Pattern D item in the target file.

## What Was Built

`tests/cross-file-step-refs.test.cjs` — new file (423 lines), auto-discovered by `scripts/run-tests.cjs`.

Three-layer test design:

1. **Helper unit tests** — 13 synthetic-content tests across `extractStepSet()` (8 tests) and `findCrossFileRefs()` (5 tests), covering heading detection, Pattern D items, code-fence skips, decimal/letter-suffix skips, both word-order ref variants, same-file skip, fence skip on source side.

2. **Corpus subtests** — 208 per-file subtests over `SCAN_FILES` (same scope as `step-numbering-scan.test.cjs`), all GREEN against the post-Phase-49 + post-Plan-2 clean corpus. The 3 known clean refs (`execute-plan.md` lines 143, 369, 475 → `execute-phase.md step 7`) all resolve correctly.

3. **RED test** — 1 test injects a synthetic stale ref via `fs.mkdtempSync(os.tmpdir())` and confirms the scanner detects it. Never mutates the corpus (D-06). Cleans up via `try/finally { fs.rmSync(tmpDir, { recursive: true, force: true }) }`.

Total: **219 tests, 219 pass, 0 fail** (full suite 5006/5003 pass, 3 pre-existing skips).

## Design Decisions

**XREF_PATTERNS (whole-integer only):** The scanner captures only `(\d+)` — no fractional suffix — unlike `normalize-step-numbers.cjs` which captures `(\d+(?:\.\d|[a-z])?)`. Decimal cross-file refs are the normalize script's domain; this scanner validates whole-integer integrity only.

**FILES_BY_BASENAME as Map → Array:** Multiple corpus files can share a basename (e.g., `get-shit-done/workflows/execute-phase.md` and `commands/gsd/execute-phase.md`). The initial implementation using a single-value map caused the thin command file to overwrite the workflow file, making step 7 appear absent. Fix: store all paths per basename; a ref is valid if step N exists in ANY file with that basename.

**Symmetric code-fence skip:** Both `extractStepSet` (target side) and `findCrossFileRefs` (source side) apply the `inCodeBlock` toggle. Pitfall 3 from RESEARCH.md — without symmetric skipping, code-fenced examples showing step numbers would be counted as either refs or real steps.

**Same-file skip conservatism:** If basename matches but path-suffix check does not agree, the ref is still treated as same-file. This is the conservative path — it avoids false cross-file reports when near-collision paths exist (e.g., `execute-phase.md` vs `execute-phase/steps/post-merge-gate.md`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] FILES_BY_BASENAME collision: commands/gsd/execute-phase.md overwriting workflows/execute-phase.md**
- **Found during:** Task 1 verification run
- **Issue:** Map keyed by single basename → last-writer wins. `commands/gsd/execute-phase.md` (thin delegator, no steps) processed after `get-shit-done/workflows/execute-phase.md` (has steps 1-14), causing step 7 lookups to return empty set — 3 known valid refs in `execute-plan.md` reported as stale.
- **Fix:** Changed `FILES_BY_BASENAME` to store `Map<string, string[]>` (basename → all matching absolute paths). Corpus subtest checks step membership across all paths for that basename.
- **Files modified:** `tests/cross-file-step-refs.test.cjs`
- **Commit:** f6e713ff (incorporated into initial commit)

None — plan executed with one auto-fixed deviation. Both tasks are combined in a single commit since the RED test (Task 2) was written in the same session immediately after Task 1's corpus tests passed.

## Threat Flags

None — test file reads corpus files and temp files only; writes no files outside `os.tmpdir()`; no network access; no user input beyond test runner invocation.

## Self-Check

- [x] `tests/cross-file-step-refs.test.cjs` exists
- [x] Commit `f6e713ff` exists: `git log --oneline | grep f6e713ff`
- [x] `node --test tests/cross-file-step-refs.test.cjs` exits 0, `# fail 0`
- [x] `npm test` exits 0, 5003 pass, 0 fail
- [x] `tests/helpers.cjs` untouched
- [x] No temp directories left behind after test run

## Self-Check: PASSED
