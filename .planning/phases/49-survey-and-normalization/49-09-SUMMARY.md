---
phase: 49-survey-and-normalization
plan: "09"
subsystem: commands
tags: [step-numbering, normalization, graphify, NORM-01]
dependency_graph:
  requires: [49-01]
  provides: [graphify.md whole-integer steps 0-6]
  affects: [tests/step-numbering-scan.test.cjs graphify subtest]
tech_stack:
  added: []
  patterns: [bottom-up rename to avoid step-number collision during substitution]
key_files:
  created: []
  modified:
    - commands/gsd/graphify.md
decisions:
  - "Applied renames bottom-to-top as specified in threat model T-49-09-01: Step 3→6 first, then 2c→5, 2b→4, 2a→3 to prevent collision"
  - "Updated prose table references in Step 2 dispatch table alongside heading renames"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-30"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 49 Plan 09: graphify.md Step Rename Summary

Renamed letter-suffix step headings Step 2a/2b/2c to whole-integer steps 3/4/5 in `commands/gsd/graphify.md`, and promoted the old Step 3 (Build Inline) to Step 6.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Rename Step 2a/2b/2c to Step 3/4/5 in graphify.md | 5dffeb09 | commands/gsd/graphify.md |

## What Was Built

Applied the full RESEARCH.md A10 renaming map to `commands/gsd/graphify.md`:

| Old heading | New heading |
|-------------|-------------|
| `### Step 2a -- Query` | `### Step 3 -- Query` |
| `### Step 2b -- Status` | `### Step 4 -- Status` |
| `### Step 2c -- Diff` | `### Step 5 -- Diff` |
| `## Step 3 -- Build (Inline)` | `## Step 6 -- Build (Inline)` |

Also updated the four prose table references in Step 2's dispatch table to match (Step 3 → Step 6, Step 2a → Step 3, Step 2b → Step 4, Step 2c → Step 5).

## Verification Results

- `command grep -c "Step 2[abc]" commands/gsd/graphify.md` outputs `0` -- PASS
- `command grep -n "Step 3 -- Query" commands/gsd/graphify.md` -- MATCH found
- `command grep -n "Step 4 -- Status" commands/gsd/graphify.md` -- MATCH found
- `command grep -n "Step 5 -- Diff" commands/gsd/graphify.md` -- MATCH found
- `command grep -n "Step 6" commands/gsd/graphify.md` -- MATCH found
- Scanner subtest `no decimal Pattern A/B labels in commands/gsd/graphify.md` -- `✔ PASS` (was failing before)
- Total scanner pass count: 617 (up from 616); 12 pre-existing failures remain in other files

## Deviations from Plan

None — plan executed exactly as written. Applied renames bottom-to-top per threat model T-49-09-01. No co-located test assertions existed for this file per RESEARCH.md A10.

## Known Stubs

None.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. This plan modifies only markdown step heading labels.

## Self-Check: PASSED

- [x] `commands/gsd/graphify.md` modified and contains new step headings
- [x] Commit 5dffeb09 exists in git log
- [x] All 3 graphify.md scanner subtests pass GREEN
- [x] No unintended file deletions
