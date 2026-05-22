---
phase: 02-apply-fork-standards-to-v1-36-0-files
plan: "02"
subsystem: agents, workflows, commands
tags: [prompt-engineering, positive-framing, negative-framing-scan, agents, workflows]

# Dependency graph
requires:
  - 02-03 (global boilerplate replacement — agent files clean before this plan ran)
provides:
  - All 15 MOD files pass the negative-framing scanner with 0 violations
  - Affirmative replacements applied to every bare Do NOT line that failed the scanner
  - Scanner-passing patterns (lowercase Do not, em-dash complements, parentheticals) confirmed without unnecessary edits
  - D-07 SECURITY Never X — always Y patterns preserved verbatim
affects:
  - Phase 2 success criterion 3: all 26 affected files pass the scanner

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scanner-driven editing: run scanner first, edit only lines that actually fail"
    - "D-07 exception: Never X — always Y security patterns confirmed, not converted"
    - "D-08 replacement rule: affirmative instruction specifies correct behavior"

key-files:
  created: []
  modified:
    - agents/gsd-advisor-researcher.md
    - agents/gsd-phase-researcher.md
    - get-shit-done/workflows/execute-phase.md
    - get-shit-done/workflows/verify-work.md
    - get-shit-done/workflows/discuss-phase.md

key-decisions:
  - "Run scanner before each file — many VIOLATIONS.md entries used lowercase 'Do not' (n) which does not trigger scanner; no unnecessary edits made"
  - "execute-phase.md line 499 (IMPORTANT: Do NOT modify STATE.md) is inside a nested code fence — scanner correctly ignores it, no edit needed"
  - "## Don't Hand-Roll heading renamed to ## Solved Problems per MOD-03 even though scanner does not flag it — semantic improvement explicitly required"

# Metrics
duration: 25min
completed: 2026-04-15
requirements_completed: [MOD-01, MOD-02, MOD-03, MOD-04, MOD-05, MOD-06, MOD-07, MOD-08, MOD-09, MOD-10, MOD-11, MOD-12, MOD-13, MOD-14, MOD-15]
---

# Phase 02 Plan 02: Apply Fork Standards — Modified Files (Wave 2) Summary

**Applied positive-framing standard to 15 v1.36.0-modified files: ran scanner on each file, applied affirmative replacements only to lines that actually failed, confirmed scanner-passing lines without unnecessary edits.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-15
- **Completed:** 2026-04-15
- **Tasks:** 2
- **Files with edits:** 5 (of 15 scanned)
- **Files confirmed passing without edits:** 10

## Accomplishments

- Ran negative-framing scanner on all 15 MOD files before editing — key insight confirmed: many VIOLATIONS.md entries used `Do not` (lowercase n) which does not trigger scanner
- Applied 6 affirmative replacements across 5 files that actually failed the scanner
- Renamed `## Don't Hand-Roll` to `## Solved Problems` in gsd-phase-researcher.md per MOD-03 requirement
- Confirmed 10 files already pass without edits (lowercase patterns, em-dash complements, parentheticals, or inside code blocks)
- Preserved all D-07 SECURITY `Never X — always Y` patterns verbatim (complete-milestone.md, execute-phase.md, verify-work.md)
- All agent YAML frontmatter unchanged — 135/135 agent-frontmatter tests pass
- Final scanner: 34/34 pass

## Task Commits

1. **Task 1: Fix scanner violations in agent and command files** - `26ac78a` (feat)
2. **Task 2: Fix and confirm workflow files** - `b0f42bd` (feat)

## Files Processed

### Files With Edits Applied

- `agents/gsd-advisor-researcher.md` — 3 affirmative replacements:
  - L128: `Do NOT research beyond the single assigned gray area` → `Scope research to the single assigned gray area only`
  - L131: `Do NOT use time estimates in the Complexity column` → `Use qualitative labels (Low / Medium / High) in the Complexity column — omit time estimates`
  - L134: `Do NOT produce extended analysis paragraphs beyond the single rationale paragraph` → `Limit analysis output to the single rationale paragraph — write the table and stop`

- `agents/gsd-phase-researcher.md` — 1 semantic improvement:
  - L610: `## Don't Hand-Roll` → `## Solved Problems` (per MOD-03 requirement, scanner-independent)

- `get-shit-done/workflows/execute-phase.md` — 2 affirmative replacements:
  - L1020: `Do NOT run phase verification` → `Proceed to the next step — phase verification is handled separately`
  - L1021: `Do NOT mark the phase complete in ROADMAP/STATE` → `Leave ROADMAP.md and STATE.md unchanged — the orchestrator handles that update`

- `get-shit-done/workflows/verify-work.md` — 1 affirmative replacement:
  - L238: `Do NOT add commentary before or after the block.` → `Output the block only — omit all commentary before and after.`

- `get-shit-done/workflows/discuss-phase.md` — 1 affirmative replacement:
  - L110: `Do NOT retry the AskUserQuestion or generate more questions when "Other" is selected with empty text.` → `When "Other" is selected with empty text, accept the input and proceed.`

### Files Confirmed Passing Without Edits

- `agents/gsd-executor.md` — no scanner-triggering patterns after 02-03 boilerplate removal
- `commands/gsd/quick.md` — `Do NOT proceed` on same line as `STOP after displaying the list.` — period+uppercase complement → passes scanner
- `commands/gsd/reapply-patches.md` — all patterns use lowercase `Do not` (n) — not scanner-triggering
- `commands/gsd/thread.md` — same as quick.md: STOP sentences provide complement
- `get-shit-done/workflows/complete-milestone.md` — 2 `Never inject` patterns confirmed D-07 (preserved)
- `get-shit-done/workflows/plan-phase.md` — all lowercase `Do not` patterns
- `get-shit-done/workflows/pr-branch.md` — 0 scanner failures found
- `get-shit-done/workflows/update.md` — lowercase `Do not` pattern
- `get-shit-done/workflows/new-milestone.md` — `Do NOT persist` passes via period+uppercase complement
- `get-shit-done/workflows/next.md` — no scanner-triggering patterns

## Scanner vs VIOLATIONS.md Discrepancies

Several files listed in VIOLATIONS.md had violations that did NOT actually fail the scanner:

1. **commands/gsd/quick.md and thread.md** — VIOLATIONS.md listed `Do NOT proceed to further steps` as violations. These pass the scanner because they appear on the same line as a preceding `STOP after...` sentence — the period+uppercase after `list.` or `displaying.` satisfies `hasPositiveComplement()`.

2. **commands/gsd/reapply-patches.md** — All listed violations used lowercase `Do not` (capital D, lowercase n) — not scanner-triggering.

3. **get-shit-done/workflows/execute-phase.md line 499** — `IMPORTANT: Do NOT modify STATE.md or ROADMAP.md.` appears inside a nested code fence (the ` ``` ` at line 481 opens the outer block; the scanner's toggle-based code block tracking puts line 499 inside the block). Scanner correctly ignores it.

4. **get-shit-done/workflows/discuss-phase.md** — Multiple `Do not` (lowercase n) lines were listed as violations but do not trigger the scanner.

## D-07 Patterns Confirmed Unchanged

All SECURITY-style `Never X — always Y` patterns were identified, confirmed as valid reframe exceptions, and left verbatim:

- `complete-milestone.md` L110: `Never inject raw file content into STATE.md.`
- `complete-milestone.md` L116: `Never inject raw user-supplied content into STATE.md without sanitization.`
- `execute-phase.md` L333: `Never shell-interpolate the prompt — always pipe via stdin...`
- `verify-work.md` L452: `Never pass raw file content to subagents without DATA_START/DATA_END wrapping.`

## Decisions Made

- Scanner-first approach: run the scanner before any edit to avoid unnecessary changes to lines that already pass
- `execute-phase.md` L499 left unchanged — verified to be inside a code fence; scanner correctly ignores it
- `## Don't Hand-Roll` renamed despite not failing scanner — the MOD-03 requirement explicitly calls this out as a semantic improvement

## Deviations from Plan

None — plan executed as written. The plan correctly anticipated the scanner vs VIOLATIONS.md discrepancies and instructed to "run scanner first; edit only lines that actually fail."

## Self-Check

- [x] `node --test tests/negative-framing-scan.test.cjs` — 34/34 pass
- [x] `grep -n "Do NOT" get-shit-done/workflows/execute-phase.md` — lines 1020/1021 absent; line 333 (`Never shell-interpolate`) present
- [x] `grep -n "Never inject" get-shit-done/workflows/complete-milestone.md` — 2 lines returned (D-07 preserved)
- [x] `grep "## Solved Problems" agents/gsd-phase-researcher.md` — 1 match
- [x] `node --test tests/agent-frontmatter.test.cjs` — 135/135 pass
- [x] `grep -r "Do NOT load full" agents/` — 0 matches (from 02-03, confirmed still clean)
- [x] Commit `26ac78a` exists (Task 1)
- [x] Commit `b0f42bd` exists (Task 2)

## Self-Check: PASSED

---
*Phase: 02-apply-fork-standards-to-v1-36-0-files*
*Completed: 2026-04-15*
