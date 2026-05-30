---
phase: 49-survey-and-normalization
plan: "03"
subsystem: agents
tags: [normalization, step-renaming, agent, test-update]
dependency_graph:
  requires: [49-01]
  provides: [sequential-step-headings-gsd-phase-researcher]
  affects: [tests/agent-frontmatter.test.cjs]
tech_stack:
  added: []
  patterns: [bottom-to-top rename order to avoid conflicts]
key_files:
  created: []
  modified:
    - agents/gsd-phase-researcher.md
    - tests/agent-frontmatter.test.cjs
decisions:
  - "Applied renames bottom-to-top (Step 8→12 first, Step 1.3→2 last) to avoid intermediate conflicts"
  - "Updated self-referential prose 'Step 2.6: SKIPPED' inside the skip-condition sentence in addition to the heading and the cross-prose ref at line 657"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-30"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 2
---

# Phase 49 Plan 03: Renumber gsd-phase-researcher Steps 1-12 Summary

Sequential whole-integer renumbering of all 12 steps in `agents/gsd-phase-researcher.md` (4 decimal violations: 1.3, 1.5, 2.5, 2.6), with co-located test assertion updated in the same commit per D-02.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rename all steps + update test assertion | a25a87f8 | agents/gsd-phase-researcher.md, tests/agent-frontmatter.test.cjs |

## What Was Built

Renamed 4 decimal step headings (Step 1.3, 1.5, 2.5, 2.6) by renumbering all 12 steps in `agents/gsd-phase-researcher.md` to sequential whole integers (Step 1 through Step 12). Updated two same-file prose references and the co-located test assertion.

**Renaming map applied (bottom-to-top):**
- Step 8 → Step 12 (Return Structured Result)
- Step 7 → Step 11 (Commit Research)
- Step 6 → Step 10 (Write RESEARCH.md)
- Step 5 → Step 9 (Quality Check)
- Step 4 → Step 8 (Validation Architecture Research)
- Step 3 → Step 7 (Execute Research Protocol)
- Step 2.6 → Step 6 (Environment Availability Audit)
- Step 2.5 → Step 5 (Runtime State Inventory)
- Step 2 → Step 4 (Identify Research Domains)
- Step 1.5 → Step 3 (Architectural Responsibility Mapping)
- Step 1.3 → Step 2 (Load Graph Context)
- Step 1 → Step 1 (no change)

**Prose references updated:**
- "continue to Step 1.5 without graph context" → "continue to Step 3 without graph context" (line 657)
- "Step 2.6: SKIPPED (no external dependencies identified)" → "Step 6: SKIPPED (no external dependencies identified)" (skip condition inside Step 6 body)

**Test assertion updated:**
- `tests/agent-frontmatter.test.cjs`: test name and `content.includes()` call updated from `Step 2.6: Environment Availability Audit` to `Step 6: Environment Availability Audit`

## Verification

- `command grep -n "Step 1\.3\|Step 1\.5\|Step 2\.5\|Step 2\.6" agents/gsd-phase-researcher.md` → no output (exit 1)
- `command grep -n "Step 2: Load Graph Context" agents/gsd-phase-researcher.md` → line 624
- `command grep -n "Step 6: Environment Availability Audit" agents/gsd-phase-researcher.md` → line 716
- `command grep -n "Step 12" agents/gsd-phase-researcher.md` → line 848
- `command grep -n "Step 6: Environment Availability Audit" tests/agent-frontmatter.test.cjs` → lines 341, 344
- `command grep -n "Step 2\.6" tests/agent-frontmatter.test.cjs` → no output (exit 1)
- `npm test` (agent-frontmatter.test.cjs): 140 pass, 0 fail

## Deviations from Plan

**1. [Rule 1 - Bug] Additional self-referential prose updated**
- **Found during:** Task 1 acceptance criteria verification
- **Issue:** `command grep` found "Step 2.6: SKIPPED" inside the skip-condition sentence of the Step 6 body — not just the heading and the cross-prose ref at line 657
- **Fix:** Updated "Step 2.6: SKIPPED" → "Step 6: SKIPPED" in the skip condition text
- **Files modified:** agents/gsd-phase-researcher.md
- **Commit:** a25a87f8

## Threat Flags

None — purely text substitution within existing markdown; no new network endpoints, auth paths, or schema changes.

## Self-Check: PASSED

- agents/gsd-phase-researcher.md modified: FOUND (2 files changed in a25a87f8)
- tests/agent-frontmatter.test.cjs modified: FOUND (2 files changed in a25a87f8)
- Commit a25a87f8 exists: CONFIRMED
- npm test: 140 pass, 0 fail
