---
phase: 13-agent-fixes
plan: "01"
subsystem: agents
tags: [positive-framing, framing-fixes, agent-files]
dependency_graph:
  requires: []
  provides: [FRAMING-01, FRAMING-05, FRAMING-06]
  affects: [agents/gsd-assumptions-analyzer.md, agents/gsd-doc-verifier.md, agents/gsd-user-profiler.md]
tech_stack:
  added: []
  patterns: [positive-framing-replacement]
key_files:
  created: []
  modified:
    - agents/gsd-assumptions-analyzer.md
    - agents/gsd-doc-verifier.md
    - agents/gsd-user-profiler.md
decisions:
  - "Replacement text for FRAMING-01 backreferences <calibration_tiers> block rather than restating tier counts inline"
  - "FRAMING-05 header replacement retains the same list structure beneath it"
  - "FRAMING-06 sequencing gate converted to affirmative imperative ('Load the rubric fully before ...')"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-22"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 13 Plan 01: Agent Do-Not Framing Fixes Summary

Three single-line targeted edits replacing bare "do not" directive violations with affirmative positive-framing replacements in three agent files, fixing FRAMING-01, FRAMING-05, and FRAMING-06.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix FRAMING-01 — gsd-assumptions-analyzer.md line 111 | 1b7e724 | agents/gsd-assumptions-analyzer.md |
| 2 | Fix FRAMING-05 — gsd-doc-verifier.md line 92 | cfcd0a7 | agents/gsd-doc-verifier.md |
| 3 | Fix FRAMING-06 — gsd-user-profiler.md line 88 | c50f5c1 | agents/gsd-user-profiler.md |

## Changes Made

### Task 1 — FRAMING-01: gsd-assumptions-analyzer.md line 111

**Before:** `- Do NOT generate more areas than the calibration tier specifies`

**After:** `- Keep area count within the tier limit defined in \`<calibration_tiers>\` above`

The replacement backreferences the `<calibration_tiers>` block at lines 39-56, avoiding repetition of specific numbers while maintaining semantic accuracy.

### Task 2 — FRAMING-05: gsd-doc-verifier.md line 92

**Before:** `Do NOT verify the following:`

**After:** `Skip verification for the following:`

Header-only replacement. The blank line and all seven bullet items beneath it were preserved unchanged.

### Task 3 — FRAMING-06: gsd-user-profiler.md line 88

**Before:** `Do not proceed to message analysis until the rubric is loaded.`

**After:** `Load the rubric fully before proceeding to message analysis.`

Sequencing gate converted to affirmative imperative. The closing `</step>` tag on the next line was preserved.

## Verification Results

```
grep -in "do not generate" agents/gsd-assumptions-analyzer.md  → (no output) PASS
grep -in "do not verify" agents/gsd-doc-verifier.md            → (no output) PASS
grep -in "do not proceed" agents/gsd-user-profiler.md          → (no output) PASS

grep -n "Keep area count within the tier limit" agents/gsd-assumptions-analyzer.md  → 111: match PASS
grep -n "Skip verification for the following:" agents/gsd-doc-verifier.md           → 92: match PASS
grep -n "Load the rubric fully before proceeding" agents/gsd-user-profiler.md       → 88: match PASS
```

## Deviations from Plan

None — plan executed exactly as written. All three Edit operations matched their exact OLD TEXT targets on first attempt.

## Known Stubs

None.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes introduced. Changes are confined to markdown prompt text in three existing agent files.

## Self-Check: PASSED

- agents/gsd-assumptions-analyzer.md — modified, line 111 correct
- agents/gsd-doc-verifier.md — modified, line 92 correct
- agents/gsd-user-profiler.md — modified, line 88 correct
- Commits 1b7e724, cfcd0a7, c50f5c1 — all present in git log
