---
phase: 49-survey-and-normalization
plan: "02"
subsystem: agents
tags: [normalization, step-numbering, NORM-01]
dependency_graph:
  requires: ["49-01"]
  provides: ["agents/gsd-intel-updater.md step labels normalized"]
  affects: ["tests/step-numbering-scan.test.cjs"]
tech_stack:
  added: []
  patterns: ["sequential whole-integer step numbering"]
key_files:
  created: []
  modified:
    - agents/gsd-intel-updater.md
decisions:
  - "Renamed Step 6.5 → Step 7 (Self-Check) and Step 7 → Step 8 (Snapshot) per NORM-01"
  - "Updated prose cross-reference 'proceed to Step 7' to 'proceed to Step 8' in the same edit"
metrics:
  duration: "5 minutes"
  completed_date: "2026-05-30"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 1
---

# Phase 49 Plan 02: Rename Step 6.5 → Step 7 and Step 7 → Step 8 in gsd-intel-updater.md Summary

**One-liner:** Renamed decimal Step 6.5 (Self-Check) to Step 7 and existing Step 7 (Snapshot) to Step 8 in `agents/gsd-intel-updater.md`, eliminating the NORM-01 violation.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rename Step 6.5 → Step 7 and Step 7 → Step 8 | 9301f04b | agents/gsd-intel-updater.md |

## Changes Made

### agents/gsd-intel-updater.md

Three edits in a single pass:

1. `### Step 6.5: Self-Check` → `### Step 7: Self-Check` (line 259)
2. `proceed to Step 7` → `proceed to Step 8` (prose cross-reference at line 265)
3. `### Step 7: Snapshot` → `### Step 8: Snapshot` (line 271)

YAML frontmatter was not touched — `agent-frontmatter.test.cjs` validates agents on every test run.

## Verification

- `command grep -c "Step 6.5" agents/gsd-intel-updater.md` → 0 occurrences
- `command grep "Step 7: Self-Check" agents/gsd-intel-updater.md` → match found
- `command grep "Step 8" agents/gsd-intel-updater.md` → match found (heading + prose)
- `node --test tests/step-numbering-scan.test.cjs` subtests for `agents/gsd-intel-updater.md` all PASS:
  - "no decimal Pattern A/B labels in agents/gsd-intel-updater.md" — PASS
  - "no decimal Pattern D items in agents/gsd-intel-updater.md" — PASS
  - "no out-of-order step numbering in agents/gsd-intel-updater.md" — PASS
- `npm test` exits 0 with no new failures (14 pre-existing failures in other files, unrelated to this plan)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Edit is a pure text rename in a markdown agent file.

## Self-Check: PASSED

- `agents/gsd-intel-updater.md` exists and contains `Step 7: Self-Check` and `Step 8: Snapshot`
- Commit 9301f04b exists in git log
- No `Step 6.5` occurrences remain
