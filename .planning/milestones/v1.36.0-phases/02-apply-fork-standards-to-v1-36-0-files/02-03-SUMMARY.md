---
phase: 02-apply-fork-standards-to-v1-36-0-files
plan: "03"
subsystem: agents
tags: [prompt-engineering, positive-framing, agents, negative-framing-scan]

# Dependency graph
requires: []
provides:
  - 13 agent files with positive-framing boilerplate replacing the negative 'Do NOT load full AGENTS.md files' directive
  - Clean baseline for plans 02-01 and 02-02 to operate on without encountering this violation
affects:
  - 02-01-apply-fork-standards (agent files now clean of this violation)
  - 02-02-apply-fork-standards (agent files now clean of this violation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Positive framing rule: 'Load specific agent files only' replaces 'Do NOT load full AGENTS.md files (100KB+ context cost)'"

key-files:
  created: []
  modified:
    - agents/gsd-code-fixer.md
    - agents/gsd-codebase-mapper.md
    - agents/gsd-debugger.md
    - agents/gsd-doc-verifier.md
    - agents/gsd-doc-writer.md
    - agents/gsd-executor.md
    - agents/gsd-code-reviewer.md
    - agents/gsd-intel-updater.md
    - agents/gsd-integration-checker.md
    - agents/gsd-eval-auditor.md
    - agents/gsd-nyquist-auditor.md
    - agents/gsd-pattern-mapper.md
    - agents/gsd-security-auditor.md

key-decisions:
  - "Replace 'Do NOT load full AGENTS.md files (100KB+ context cost)' with 'Load specific agent files only' — highest-frequency violation, swept globally before per-file passes"

patterns-established:
  - "Positive framing: negative prohibitions replaced with affirmative instructions specifying correct behavior"

requirements-completed:
  - NEW-11

# Metrics
duration: 8min
completed: 2026-04-15
---

# Phase 02 Plan 03: Apply Fork Standards — Global Boilerplate Replacement Summary

**Swept the highest-frequency negative-framing violation from 13 agent files: replaced 'Do NOT load full `AGENTS.md` files (100KB+ context cost)' with 'Load specific agent files only' across agents/gsd-*.md**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-15T09:46:00Z
- **Completed:** 2026-04-15T09:54:00Z
- **Tasks:** 1
- **Files modified:** 13

## Accomplishments

- Eliminated the single highest-frequency negative-framing violation (13 instances) from the agent corpus in one atomic sweep
- Preserved all YAML frontmatter intact across all 13 agent files (agent-frontmatter test: 135/135 pass)
- Preserved `Only use the Write tool` string in all 5 file-writing agents (code-fixer, codebase-mapper, doc-writer, doc-verifier, executor)
- Negative-framing scan maintained: 34/34 pass with zero regressions
- Plans 02-01 and 02-02 can now operate on clean files without encountering this violation

## Task Commits

1. **Task 1: Replace boilerplate in all 13 agent files** - `8039e93` (feat)

## Files Modified

- `agents/gsd-code-fixer.md` — line 38: boilerplate replaced
- `agents/gsd-codebase-mapper.md` — line 53: boilerplate replaced
- `agents/gsd-debugger.md` — line 86: boilerplate replaced
- `agents/gsd-doc-verifier.md` — line 44: boilerplate replaced
- `agents/gsd-doc-writer.md` — line 48: boilerplate replaced
- `agents/gsd-executor.md` — line 70: boilerplate replaced
- `agents/gsd-code-reviewer.md` — line 36: boilerplate replaced
- `agents/gsd-intel-updater.md` — line 29: boilerplate replaced
- `agents/gsd-integration-checker.md` — line 35: boilerplate replaced
- `agents/gsd-eval-auditor.md` — line 29: boilerplate replaced
- `agents/gsd-nyquist-auditor.md` — line 36: boilerplate replaced
- `agents/gsd-pattern-mapper.md` — line 41: boilerplate replaced
- `agents/gsd-security-auditor.md` — line 48: boilerplate replaced

All 13 files: line numbers matched the approximate values given in the plan exactly.

## Decisions Made

None - followed plan as specified. Replacement text was locked in CONTEXT.md decision D-01.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All 13 edits applied cleanly on the first attempt. Verification confirmed 0 remaining instances of the old boilerplate and exactly 13 instances of the new text.

Note: `npm test` shows 3 pre-existing failures in `ios-scaffold-safety.test.cjs` — these are documented in STATE.md as a known blocker to be addressed in Phase 3, Plan 03-01. They are unrelated to this plan's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 02-01 and 02-02 can proceed with clean baselines — the global boilerplate violation is fully resolved
- No blockers introduced by this plan

## Self-Check

- [x] `agents/gsd-code-fixer.md` exists and contains `Load specific agent files only`
- [x] `grep -r "Do NOT load full" agents/` returns 0 matches
- [x] `grep -r "Load specific agent files only" agents/` returns exactly 13 matches
- [x] Commit `8039e93` exists in git log
- [x] `node --test tests/negative-framing-scan.test.cjs` — 34/34 pass
- [x] `node --test tests/agent-frontmatter.test.cjs` — 135/135 pass

## Self-Check: PASSED

---
*Phase: 02-apply-fork-standards-to-v1-36-0-files*
*Completed: 2026-04-15*
