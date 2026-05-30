---
phase: quick
plan: 260530-e5j
subsystem: planning-docs
tags: [roadmap, letter-suffix, step-numbering, scope-correction]
dependency_graph:
  requires: []
  provides: [updated-roadmap-letter-suffix-scope]
  affects: [.planning/ROADMAP.md]
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - .planning/ROADMAP.md
decisions:
  - "Letter-suffix step labels (e.g., Step 7a) are violations requiring renumbering, not false-positives to exclude"
metrics:
  duration: "< 5 minutes"
  completed: "2026-05-30"
---

# Quick Task 260530-e5j: Update ROADMAP Letter-Suffix Scope — Summary

**One-liner:** Three surgical ROADMAP.md edits reclassify letter-suffix step labels as violations requiring renumbering (not false-positive exclusions) for Phases 48 and 49.

## What Was Done

Applied three targeted edits to `.planning/ROADMAP.md`:

1. **Phase 48 Goal** (line 227): Added "letter-suffix step labels (e.g., Step 7a)" alongside decimal step labels in the goal statement.

2. **Phase 48 AC #2** (line 233): Replaced "without false-positives on letter-suffix steps (e.g., `Step 7a`) or code-fenced content" with a clause stating the scanner flags letter-suffix steps as violations requiring renumbering to whole integers; code-fenced content remains excluded.

3. **Phase 49 AC #2** (line 246): Added "and letter-suffix-label" to the corpus subtests GREEN condition, alongside the existing decimal-label subtests.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- All three `letter-suffix` strings present in ROADMAP.md at expected lines (227, 233, 246)
- "without false-positives on letter-suffix" absent from ROADMAP.md (0 matches)
- Commit `1a91f150` exists and contains exactly 3 insertions / 3 deletions in `.planning/ROADMAP.md`
