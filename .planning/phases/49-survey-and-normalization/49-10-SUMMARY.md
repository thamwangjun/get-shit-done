---
phase: 49-survey-and-normalization
plan: "10"
subsystem: workflows
tags: [step-numbering, scanner, structural-fix]
dependency_graph:
  requires: [49-01]
  provides: [discuss-phase-assumptions-scanner-clean]
  affects: [tests/step-numbering-scan.test.cjs]
tech_stack:
  added: []
  patterns: [heading-separator-counter-reset]
key_files:
  created: []
  modified:
    - get-shit-done/workflows/discuss-phase-assumptions.md
decisions:
  - "Added ### Codebase Context heading (not ## ) to act as sub-section separator — both levels reset the scanner counter, but ### is semantically appropriate for a sub-step group inside a <step> block"
  - "Inserted heading inside the scout_codebase <step> block, immediately before the second Step 1 group — not before the <step> tag itself, which would break the document structure"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-30"
---

# Phase 49 Plan 10: Add ### Heading to discuss-phase-assumptions.md Summary

## One-liner

Added `### Codebase Context` heading before the second Step 1 group in `discuss-phase-assumptions.md` so the scanner step counter resets and the out-of-order subtest passes GREEN.

## What Was Built

Single-line insertion in `get-shit-done/workflows/discuss-phase-assumptions.md`. The file had two independent Step 1/2/3 sequences (one for project files, one for codebase maps) inside the `scout_codebase` step without a separator heading. The scanner's `scanForOutOfOrder()` function resets its per-section counter on any `##` or `###` heading — adding `### Codebase Context` before the second sequence is sufficient to reset the counter and eliminate the false-positive out-of-order violation.

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add ### section heading before second Step 1 group | 044ae297 | get-shit-done/workflows/discuss-phase-assumptions.md |

## Verification

- `command grep -c "### Codebase Context" get-shit-done/workflows/discuss-phase-assumptions.md` → `1` (heading added)
- `command grep -c "Step 1:" get-shit-done/workflows/discuss-phase-assumptions.md` → `2` (both occurrences intact)
- `node --test tests/step-numbering-scan.test.cjs` → all three `discuss-phase-assumptions.md` subtests PASS:
  - `no decimal Pattern A/B labels in get-shit-done/workflows/discuss-phase-assumptions.md`
  - `no decimal Pattern D items in get-shit-done/workflows/discuss-phase-assumptions.md`
  - `no out-of-order step numbering in get-shit-done/workflows/discuss-phase-assumptions.md`

## Deviations from Plan

None — plan executed exactly as written. The heading was inserted at the expected location (immediately before "**Step 1: Check for existing codebase maps**" inside the `scout_codebase` step). No step renumbering was performed.

## Known Stubs

None.

## Threat Flags

None — the change is a single-line markdown heading insertion with no security surface.

## Self-Check: PASSED

- File exists: `get-shit-done/workflows/discuss-phase-assumptions.md` — confirmed modified
- Commit exists: `044ae297` — confirmed via `git log`
- Scanner subtests all pass GREEN for `discuss-phase-assumptions.md`
