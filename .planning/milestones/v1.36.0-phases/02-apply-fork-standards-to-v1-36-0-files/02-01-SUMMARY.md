---
phase: 02-apply-fork-standards-to-v1-36-0-files
plan: "01"
subsystem: commands, agents, workflows, references
tags: [prompt-engineering, positive-framing, commands, agents, workflows, references]

# Dependency graph
requires:
  - 02-03 (global boilerplate replacement — agent files cleaned before this pass)
provides:
  - 5 files with targeted affirmative replacements (NEW-01 through NEW-05)
  - 5 files confirmed-passing without edits (NEW-06 through NEW-10)
  - All 10 new v1.36.0 files pass negative-framing scanner at 34/34
affects:
  - Phase 3 test alignment (clean prompt files with no negative directives)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Positive framing: 'Do not skip X — CLI fallback works' replaced with 'Use the CLI fallback when X unavailable — skip nothing'"
    - "Positive framing: 'Do not fabricate X — only Y' replaced with 'Source X exclusively from Y'"
    - "Positive framing: 'Do not deploy until gaps addressed' replaced with 'Address all gaps before deployment'"
    - "Graphify STOP section deletion: standalone 'STOP -- DO NOT READ THIS FILE' line removed per D-03"
    - "Inline op stops: '**STOP** after displaying X. Do not spawn an agent.' replaced with 'Display X and stop.'"

key-files:
  created: []
  modified:
    - commands/gsd/graphify.md
    - agents/gsd-debug-session-manager.md
    - agents/gsd-domain-researcher.md
    - agents/gsd-ai-researcher.md
    - get-shit-done/workflows/eval-review.md

key-decisions:
  - "graphify.md STOP section deleted per D-03 — standalone injection-guard line removed, file structure intact"
  - "5 files confirmed passing without edits: extract_learnings.md (em-dash complement), planner-antipatterns.md (no scanner patterns), planner-source-audit.md (conditional branch), ai-evals.md (editorial voice D-05), ai-frameworks.md (quoted speech D-04)"
  - "Do not (lowercase n) patterns in documentation_lookup blocks converted to affirmative — fork standard applies beyond scanner enforcement"

requirements-completed:
  - NEW-01
  - NEW-02
  - NEW-03
  - NEW-04
  - NEW-05
  - NEW-06
  - NEW-07
  - NEW-08
  - NEW-09
  - NEW-10

# Metrics
duration: 25min
completed: 2026-04-15
---

# Phase 02 Plan 01: Apply Fork Standards — New v1.36.0 Files Summary

**Applied positive framing standard to all 10 new v1.36.0 files (NEW-01 through NEW-10): 5 files received targeted edits, 5 confirmed-passing without edits. Final scanner result: 34/34 pass.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-15T10:10:00Z
- **Completed:** 2026-04-15T10:35:00Z
- **Tasks:** 2
- **Files modified:** 5
- **Files confirmed-passing (no edits):** 5

## Accomplishments

- Deleted the `STOP -- DO NOT READ THIS FILE` injection-guard line from `commands/gsd/graphify.md` per D-03
- Replaced 3 `**STOP** after displaying X. Do not spawn an agent.` patterns with `Display X and stop.` in graphify.md
- Applied affirmative context budget instruction to `agents/gsd-debug-session-manager.md`
- Applied 2 affirmative replacements in `agents/gsd-domain-researcher.md` (CLI fallback, source criteria)
- Applied 1 affirmative replacement in `agents/gsd-ai-researcher.md` (CLI fallback)
- Applied 1 affirmative replacement in `get-shit-done/workflows/eval-review.md` (address gaps before deployment)
- Confirmed 5 files pass scanner without edits, with documented reasons for each
- Negative-framing scan maintained: 34/34 pass with zero regressions
- Agent frontmatter intact: 135/135 pass

## Task Commits

1. **Task 1: Fix scanner violations in 5 new files requiring edits** - `8c01583` (feat)
2. **Task 2: Confirm 5 files that pass scanner already** — no file changes; all confirmed passing

## Files Modified (Task 1)

- `commands/gsd/graphify.md` — STOP section deleted; 3 inline op stops converted to `Display X and stop.`
- `agents/gsd-debug-session-manager.md` — context budget rewritten affirmatively
- `agents/gsd-domain-researcher.md` — 2 replacements: CLI fallback instruction, source criteria instruction
- `agents/gsd-ai-researcher.md` — 1 replacement: CLI fallback instruction
- `get-shit-done/workflows/eval-review.md` — 1 replacement: address gaps before deployment

## Files Confirmed Passing Without Edits (Task 2)

- `get-shit-done/workflows/extract_learnings.md` — `Do not fabricate learnings — only extract...` has em-dash complement, passes scanner per RESEARCH.md analysis
- `get-shit-done/references/planner-antipatterns.md` — no `DO NOT`/`Do NOT`/`do NOT`/`NEVER` patterns found
- `get-shit-done/references/planner-source-audit.md` — `do NOT finalize` on a line starting with `If ANY row is...` — conditional branch, `isConditionalOrFactual()` returns true, passes scanner
- `get-shit-done/references/ai-evals.md` — only lowercase `don't` patterns; editorial voice per D-05; scanner does not flag
- `get-shit-done/references/ai-frameworks.md` — only quoted user speech `"I don't know..."` per D-04; scanner does not flag

## Decisions Made

1. `graphify.md` STOP section: deleted the single bold line (not a multi-line section with heading) per D-03. Verified adjacent sections intact.
2. `Do not` (lowercase n) patterns in `documentation_lookup` blocks converted to affirmative even though scanner doesn't flag lowercase `not` — fork positive framing standard applies to all primary directives.
3. `planner-source-audit.md` line 37 `do NOT` — begins with `If`, classified as conditional branch, passes scanner correctly.

## Deviations from Plan

### Auto-fixed Issues

None.

### Observations

**1. [Observation] Working tree out-of-sync with HEAD at start**

The worktree was initialized from an upstream state (commit `f7d4d60`, upstream v1.36.0 merge) before the fork's custom commits were applied. A `git reset --soft` moved HEAD to the target commit `f92c33f`, but left the working tree in the upstream state. Resolution: restored all relevant directories (`agents/`, `commands/`, `get-shit-done/workflows/`, `get-shit-done/references/`, `tests/`) from HEAD before beginning edits. No fork content was lost.

**2. [Observation] Scanner already passing 34/34 at baseline**

All files in the plan's scope already passed the negative-framing scanner at baseline. The `Do not` (lowercase n) patterns listed as violations in VIOLATIONS.md are below the scanner's detection threshold (scanner only flags `DO NOT`, `Do NOT`, `do NOT`, `NEVER`). The edits applied per this plan implement the fork's positive framing standard at the manual-review level, not the automated-scanner level.

## Issues Encountered

None. All 5 edits in Task 1 applied cleanly. All 5 Task 2 confirmations matched predictions from RESEARCH.md and the plan's violation map.

Note: `npm test` shows pre-existing failures in `ios-scaffold-safety.test.cjs` — documented in STATE.md, addressed in Phase 3, Plan 03-01.

## User Setup Required

None.

## Next Phase Readiness

- All 10 new v1.36.0 files (NEW-01 through NEW-10) now meet the fork's positive framing standard
- Plan 02-02 can proceed (handles remaining files from the broader v1.36.0 change set)
- No blockers introduced by this plan

## Self-Check

- [x] `commands/gsd/graphify.md` exists — FOUND
- [x] `STOP -- DO NOT READ THIS FILE` absent from graphify.md — CONFIRMED
- [x] `Display results and stop.` present in graphify.md line 87 — CONFIRMED
- [x] `Display status and stop.` present in graphify.md line 101 — CONFIRMED
- [x] `Display diff and stop.` present in graphify.md line 117 — CONFIRMED
- [x] `agents/gsd-debug-session-manager.md` contains `Load only the debug file and project metadata into context` — CONFIRMED
- [x] `agents/gsd-domain-researcher.md` contains `Use the CLI fallback when MCP tools are unavailable — skip nothing` — CONFIRMED
- [x] `agents/gsd-domain-researcher.md` contains `Source criteria exclusively from research` — CONFIRMED
- [x] `agents/gsd-ai-researcher.md` contains `Use the CLI fallback when MCP tools are unavailable — skip nothing` — CONFIRMED
- [x] `get-shit-done/workflows/eval-review.md` contains `Address all gaps before deployment` — CONFIRMED
- [x] Commit `8c01583` exists — CONFIRMED
- [x] `node --test tests/negative-framing-scan.test.cjs` — 34/34 pass — CONFIRMED
- [x] `node --test tests/agent-frontmatter.test.cjs` — 135/135 pass — CONFIRMED

## Self-Check: PASSED

---
*Phase: 02-apply-fork-standards-to-v1-36-0-files*
*Completed: 2026-04-15*
