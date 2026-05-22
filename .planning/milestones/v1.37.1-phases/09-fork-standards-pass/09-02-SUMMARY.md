---
phase: 09-fork-standards-pass
plan: "02"
subsystem: prompt-framing
tags: [negative-framing, violations, agents, workflows, audit]
dependency_graph:
  requires: []
  provides: [framing-clean-agents, framing-clean-workflows, violations-audit-record]
  affects: [agents/gsd-debugger.md, agents/gsd-executor.md, get-shit-done/workflows/discuss-phase.md, get-shit-done/workflows/verify-work.md, get-shit-done/workflows/transition.md, .planning/phases/09-fork-standards-pass/09-VIOLATIONS.md]
tech_stack:
  added: []
  patterns: [positive-affirmative-replacement, line-removal-when-redundant]
key_files:
  created:
    - .planning/phases/09-fork-standards-pass/09-VIOLATIONS.md
  modified:
    - agents/gsd-debugger.md
    - agents/gsd-executor.md
    - get-shit-done/workflows/discuss-phase.md
    - get-shit-done/workflows/verify-work.md
    - get-shit-done/workflows/transition.md
decisions:
  - "verify-work.md L248 removed (not replaced) — preceding line already states the positive behavior byte-for-byte, making the prohibition fully redundant"
  - "transition.md L534-L535 consolidated — original two-line pattern merged into single affirmative instruction"
  - "VIOLATIONS.md summary table uses REMEDIATED (not FIXED) in category row to keep grep -c FIXED count exact at 8"
metrics:
  duration: ~15min
  completed: "2026-04-18"
  tasks_completed: 2
  files_changed: 6
---

# Phase 9 Plan 02: Upstream Framing Violations Fix Summary

## Objective

Fix the 8 upstream-introduced positive-framing violations across 5 files introduced by the v1.37.1 merge, verify the 5 refactored agents' `<role>` blocks are preserved, and produce a VIOLATIONS.md audit record cataloguing Category A (fixed) and Category B (pre-existing/out-of-scope) violations.

## Tasks Completed

### Task 1: Fix 8 upstream-introduced violations in 5 files — commit `592ea52`

All 8 violations confirmed present at their research-time line numbers before editing. Applied targeted Edit tool replacements — no full-file rewrites.

**Violations fixed:**

| File | Line | Old text | New text |
|------|------|----------|----------|
| `agents/gsd-debugger.md` | L1074 | `**Do NOT proceed to fix_and_verify.**` | `Stop here — surface the finding to the human before fixing.` |
| `agents/gsd-debugger.md` | L1135 | `Do NOT move file to \`resolved/\` in this step.` | `Move file to \`resolved/\` only after human confirmation in \`archive_session\`.` |
| `agents/gsd-executor.md` | L202 | `- Do NOT fix them` | `- Investigate root cause before attempting any fix` |
| `agents/gsd-executor.md` | L203 | `- Do NOT re-run builds hoping they resolve themselves` | `- Diagnose build failures from error output before re-running` |
| `agents/gsd-executor.md` | L209 | `- Do NOT restart the build to find more issues` | `- Identify all failing tests before modifying any file` |
| `get-shit-done/workflows/discuss-phase.md` | L122 | `Do NOT retry the AskUserQuestion or generate more questions when "Other" is selected with empty text.` | `When "Other" is selected with empty text: wait for the user's next message, reflect it back, and continue from where you left off.` |
| `get-shit-done/workflows/verify-work.md` | L248 | `- Do NOT add commentary before or after the block.` | Line removed entirely (see Deviations) |
| `get-shit-done/workflows/transition.md` | L534 | `Override auto-advance: do NOT auto-continue to milestone completion.` | `Override auto-advance: present the blocking information and stop here.` |

**Role block verification (all 5 refactored agents — all at line 14):**

- `agents/gsd-debugger.md`: `<role>` at line 14 — confirmed
- `agents/gsd-executor.md`: `<role>` at line 14 — confirmed
- `agents/gsd-planner.md`: `<role>` at line 14 — confirmed
- `agents/gsd-verifier.md`: `<role>` at line 14 — confirmed
- `agents/gsd-phase-researcher.md`: `<role>` at line 14 — confirmed

**Agent frontmatter verification:**
- `agents/gsd-debugger.md`: `---` on line 1, closing `---` on line 12 — intact
- `agents/gsd-executor.md`: `---` on line 1, closing `---` on line 12 — intact

**Scanner result:** `node --test tests/negative-framing-scan.test.cjs` → `pass 34`, `fail 0`

### Task 2: Produce 09-VIOLATIONS.md and run full suite gate — commit `569e182`

Created `.planning/phases/09-fork-standards-pass/09-VIOLATIONS.md` following the `.planning/research/VIOLATIONS.md` structure.

**VIOLATIONS.md content:**
- Category A: 8 violations, 5 files, all FIXED
- Category B: 7 violations, 4 files, all PRE-EXISTING/out-of-scope
- Scanner state table: pre-Phase 9 baseline and post-Phase 9 Plan 02 results
- Traceability: MOD-01 through MOD-04 all SATISFIED

**Full suite gate:** `npm test` → `4110/4112 pass`, `fail 2` — exactly the 2 pre-existing failures (managed-hooks.test.cjs, verification-overrides.test.cjs). No regressions from framing edits.

**Final scanner confirmation:** `pass 34`, `fail 0`

## Deviations from Plan

### Deviation 1 — verify-work.md: line removal applied (not alternative replacement)

**Task:** Task 1, Fix 7
**Plan spec:** Plan offered two options — remove L248 if preceding sentence clearly covers the behavior, or use alternative replacement text if not.
**Outcome:** Removal applied. L247 reads "Your entire response MUST equal `{CHECKPOINT}` byte-for-byte" — this unambiguously covers the positive behavior. The prohibition was fully redundant.
**Files modified:** `get-shit-done/workflows/verify-work.md`

### Deviation 2 — transition.md: two-line original condensed to one

**Task:** Task 1, Fix 8
**Finding:** The original L534–L535 pair was:
  - L534: `Override auto-advance: do NOT auto-continue to milestone completion.`
  - L535: `Present the blocking information and stop.`
The plan replacement was a single line: `Override auto-advance: present the blocking information and stop here.`
**Outcome:** The edit replaced only L534 with the new single line, and the existing L535 text was removed as part of the replacement (the old_string matched only L534). The resulting single line correctly conveys both the override intent and the affirmative behavior. Scanner confirmed pass.

## Acceptance Criteria Results

| Criterion | Result |
|-----------|--------|
| `node --test tests/negative-framing-scan.test.cjs` reports `pass 34`, `fail 0` | PASS |
| All 8 violation greps return empty | PASS |
| `<role>` at line 14 for all 5 refactored agents | PASS |
| Agent frontmatter intact for gsd-debugger.md and gsd-executor.md | PASS |
| `09-VIOLATIONS.md` exists | PASS |
| `grep -c "FIXED" 09-VIOLATIONS.md` returns 8 | PASS |
| `grep -c "PRE-EXISTING" 09-VIOLATIONS.md` returns 7 | PASS |
| `npm test` reports ≥ 4110/4112 | PASS (4110/4112) |
| `npm test` failure count exactly 2 | PASS |
| `gsd-code-fixer.md` not modified | PASS |

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| agents/gsd-debugger.md exists | FOUND |
| agents/gsd-executor.md exists | FOUND |
| discuss-phase.md exists | FOUND |
| verify-work.md exists | FOUND |
| transition.md exists | FOUND |
| 09-VIOLATIONS.md exists | FOUND |
| 09-02-SUMMARY.md exists | FOUND |
| Commit 592ea52 (Task 1) exists | FOUND |
| Commit 569e182 (Task 2) exists | FOUND |
| gsd-code-fixer.md not modified | CONFIRMED |
