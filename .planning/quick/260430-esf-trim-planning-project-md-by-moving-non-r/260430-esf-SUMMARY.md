---
phase: quick-260430-esf
plan: 01
status: complete
subsystem: planning-docs
tags: [project-docs, housekeeping, archive]
dependency_graph:
  requires: []
  provides: [PROJECT_HISTORY.md]
  affects: [PROJECT.md]
tech_stack:
  added: []
  patterns: []
key_files:
  created:
    - .planning/PROJECT_HISTORY.md
  modified:
    - .planning/PROJECT.md
decisions:
  - "Historical milestones, validated requirements, and settled Key Decisions rows moved to PROJECT_HISTORY.md to keep PROJECT.md focused on active guidance"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-30"
---

# Quick Task 260430-esf: Trim PROJECT.md Summary

**One-liner:** Moved 4 milestone sections, 45 validated requirements, and 21 historical Key Decisions rows from PROJECT.md into a new PROJECT_HISTORY.md archive — reducing PROJECT.md from 203 to 89 lines.

## What Was Done

### Task 1: Create PROJECT_HISTORY.md

Created `.planning/PROJECT_HISTORY.md` as a self-contained historical archive with:
- Abandoned Milestone: v1.37.1c Tag Hierarchy Completion
- Shipped Milestone: v1.37.1b Fork Tag Corpus Tests
- Shipped Milestone: v1.37.1a Do-Not Framing Pass
- Shipped Milestone: v1.37.1 Files
- Full Validated Requirements section (45 ✓ items)
- Historical Key Decisions table (21 rows — implementation-specific, settled decisions)
- Clear archive header pointing back to PROJECT.md
- Archived timestamp footer

**Commit:** 1b63ac35

### Task 2: Trim PROJECT.md

Rewrote `.planning/PROJECT.md` retaining only active-guidance content:
- What This Is, Core Value, Active Requirements, Requirements (Active + Out of Scope only)
- Context (verbatim, with PROJECT_HISTORY.md pointer added to Current state bullet)
- Constraints (verbatim)
- Key Decisions table pruned from 29 rows to 7 load-bearing rows, with PROJECT_HISTORY.md footer note
- Evolution (verbatim)
- Updated footer last-updated line

**Commit:** fbc0efa5

## Line Count Before/After

| File | Before | After |
|------|--------|-------|
| PROJECT.md | 203 lines | 89 lines |
| PROJECT_HISTORY.md | (new) | 132 lines |

## Verification Results

All checks passed:
- `grep -c "Shipped Milestone" .planning/PROJECT.md` → 0
- `grep -c "Shipped Milestone" .planning/PROJECT_HISTORY.md` → 3
- `grep "Abandoned Milestone" .planning/PROJECT_HISTORY.md` → found
- `grep "Abandoned Milestone" .planning/PROJECT.md` → empty
- `grep "### Validated" .planning/PROJECT.md` → empty
- `grep "### Validated" .planning/PROJECT_HISTORY.md` → found
- `grep "PROJECT_HISTORY" .planning/PROJECT.md` → 4 occurrences (Active Requirements, Context, Key Decisions footer, footer line)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — this task modifies only planning documentation files; no security-relevant surface introduced.

## Self-Check: PASSED

- `.planning/PROJECT_HISTORY.md` exists: FOUND
- `.planning/PROJECT.md` exists: FOUND
- Commit 1b63ac35 exists: confirmed (Task 1)
- Commit fbc0efa5 exists: confirmed (Task 2)
