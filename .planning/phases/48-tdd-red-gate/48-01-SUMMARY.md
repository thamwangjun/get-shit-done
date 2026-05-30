---
phase: 48-tdd-red-gate
plan: 01
subsystem: tests
tags: [tdd, scanner, step-numbering, red-gate]
key-files:
  - tests/step-numbering-scan.test.cjs
metrics:
  lines_added: 305
  files_created: 1
  files_modified: 0
  test_failures_introduced: 9
---

# Plan 48-01 Summary: Write Step Numbering Scanner Test (RED Gate)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 6962136a | test(48-01): add step-numbering scanner test (RED gate) |

## What Was Done

Created `tests/step-numbering-scan.test.cjs` (305 lines) — the TDD Red Gate for the v2.1.0-d whole-integer step numbering milestone.

The file implements:
- `scanContent()` — Pattern A/B (`Step N.M` bold/plain headings) and Pattern D (`N.M.` ordered-list items at columns 0–2) decimal detection
- `scanForOutOfOrder()` — per-section sequential step tracking with reset on `##`/`###` headings; line-start anchored to avoid mid-sentence cross-reference false positives
- 7 synthetic unit tests for `scanContent()` (all GREEN)
- 6 synthetic unit tests for `scanForOutOfOrder()` (all GREEN)
- 3 corpus describe blocks (per-file subtests per D-06): Pattern A/B, Pattern D, out-of-order

## Verification Results

**Unit tests:** 13 pass GREEN (all synthetic fixtures in `scanContent()` and `scanForOutOfOrder()` blocks)

**Corpus RED gate (Pattern A/B decimal failures — expected):**
- `agents/gsd-intel-updater.md` — Step 6.5
- `agents/gsd-phase-researcher.md` — Step 1.3, 1.5, 2.5, 2.6
- `get-shit-done/workflows/progress.md` — Step 1.5, 1.6
- `get-shit-done/workflows/quick.md` — Step 2.5, 4.5, 4.75, 5.5, 5.6, 6.25, 6.5
- `get-shit-done/workflows/execute-phase.md` — Step 7.0–7.3
- `get-shit-done/workflows/execute-phase/steps/post-merge-gate.md` — inline "step 5.8" ref
- `get-shit-done/workflows/execute-plan.md` — additional decimal label found

**Pattern D failures (expected):**
- `get-shit-done/workflows/execute-phase.md` — `2.5.`, `5.5.`–`5.8.` ordered-list items

**Out-of-order failures:**
- `get-shit-done/workflows/discuss-phase-assumptions.md` — Step 1 follows Step 3 in a sub-section without a heading reset (real corpus finding, not false positive)

**No violations for (verified):**
- `agents/gsd-verifier.md` — letter-suffix steps (`Step 7a`, `Step 2a`) correctly excluded
- Pattern C files (`plan-phase.md`, `new-milestone.md`, `new-project.md`) — excluded via `PATTERN_C_EXCLUDES`
- `get-shit-done/references/` — excluded from `SCAN_DIRS`

**Regression check:** 42 pre-existing failures unchanged; no new failures in pre-existing test files.

## Deviations

**`scanForOutOfOrder` regex anchored to line start.** The PATTERNS.md scaffold used `/\*?\*?Step\s+(\d+)(?![\.\da-z])/i` without a line-start anchor. Without anchoring, `agents/gsd-verifier.md` line 573 ("...in Step 8, status MUST be human_needed") triggered a false positive out-of-order violation. Fixed to `/^\s*\*?\*?Step\s+(\d+)(?![\.\da-z])/i` — anchors match to line start, preventing mid-sentence cross-references from affecting the sequence counter. All unit tests still pass.

## Self-Check

**PASSED.** All acceptance criteria met:
- [x] File exists at `tests/step-numbering-scan.test.cjs`
- [x] `node --test tests/step-numbering-scan.test.cjs` exits non-zero (RED)
- [x] Failures reference all 5 required files + 2 additional
- [x] No failures for `agents/gsd-verifier.md`
- [x] No failures for Pattern C files
- [x] All 13 unit test subtests GREEN
- [x] `PATTERN_C_EXCLUDES` present (count: 2)
- [x] `get-shit-done/references` absent from file
- [x] `inCodeBlock` present in both scan functions (count: 6)
- [x] No regressions in pre-existing test suite
