---
phase: 13-agent-fixes
plan: "02"
subsystem: agents
tags: [positive-framing, gsd-code-fixer, do-not-violations, FRAMING-02, FRAMING-03, FRAMING-04]

requires: []
provides:
  - "gsd-code-fixer.md: three bare Do NOT directives replaced with affirmative instructions"
  - "FRAMING-02 compliance: Tier 3 Fallback block uses positive 'Apply the fix even when' phrasing"
  - "FRAMING-03 compliance: exit block for clean/skipped status has two bullets (deletion, no orphan blank line)"
  - "FRAMING-04 compliance: commit-failure rollback block uses positive 'Restore all files' phrasing"
affects: [13-agent-fixes, negative-framing-scan tests]

tech-stack:
  added: []
  patterns:
    - "Affirmative rewrite: negative prohibition replaced with positive instruction specifying correct behavior"
    - "Bullet deletion: redundant prohibition removed when surrounding context already implies the behavior"

key-files:
  created: []
  modified:
    - agents/gsd-code-fixer.md

key-decisions:
  - "Line 474 (DO NOT leave uncommitted changes in critical_rules block) fixed as Rule 2 deviation — acceptance criteria grep -in 'do not leave' required no output"
  - "Line 474 fix used 'Restore all files to pre-fix state' phrasing consistent with line 343 replacement"

patterns-established:
  - "When acceptance criteria specify case-insensitive grep must return no output, scan entire file for all variants before committing"

requirements-completed: [FRAMING-02, FRAMING-03, FRAMING-04]

duration: 15min
completed: 2026-04-22
---

# Phase 13 Plan 02: Agent Fixes (gsd-code-fixer) Summary

**Three bare Do NOT directives removed from gsd-code-fixer.md: Tier 3 Fallback block, clean/skipped exit block, and commit-failure rollback block — all replaced with affirmative instructions**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-22T11:15:00Z
- **Completed:** 2026-04-22T11:30:00Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- FRAMING-02: line 138 "Do NOT skip the fix just because syntax checking is unavailable" replaced with "Apply the fix even when syntax checking is unavailable"
- FRAMING-03: line 240 "Do NOT create REVIEW-FIX.md" bullet deleted; exit block has exactly two bullets with no orphan blank line
- FRAMING-04: line 343 "Do NOT leave uncommitted changes" replaced with "Restore all files to pre-fix state before continuing"; line 474 also fixed (Rule 2 deviation)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix FRAMING-02 — gsd-code-fixer.md line 138** - `322aae8` (fix)
2. **Task 2: Fix FRAMING-03 — delete gsd-code-fixer.md line 240** - `9c46738` (fix)
3. **Task 3: Fix FRAMING-04 — gsd-code-fixer.md line 344** - `fccf87d` (fix)

## Files Created/Modified
- `agents/gsd-code-fixer.md` - Three bare Do NOT directive violations removed (lines 138, 240, 343); line 474 also fixed as Rule 2 deviation

## Decisions Made
- Line 474 (`**DO NOT leave uncommitted changes**` in `<critical_rules>`) was fixed as a Rule 2 deviation: the acceptance criteria specified `grep -in "do not leave"` must return no output, and this line would have caused a test failure. The fix used consistent "Restore all files to pre-fix state" phrasing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Fixed additional Do NOT violation at line 474**
- **Found during:** Task 3 (Fix FRAMING-04 verification)
- **Issue:** Acceptance criteria required `grep -in "do not leave" agents/gsd-code-fixer.md` to return no output; line 474 had `**DO NOT leave uncommitted changes**` in the `<critical_rules>` block — not in the original plan's three-violation scope
- **Fix:** Replaced `**DO NOT leave uncommitted changes** — if commit fails after successful edit, rollback the change and mark as skipped.` with `**Restore all files to pre-fix state** if a commit fails after a successful edit — rollback the change and mark as skipped.`
- **Files modified:** agents/gsd-code-fixer.md
- **Verification:** `grep -in "do not leave" agents/gsd-code-fixer.md` returns no output
- **Committed in:** `fccf87d` (part of Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical)
**Impact on plan:** Fix necessary to satisfy acceptance criteria. Phrasing consistent with Task 3 replacement. No scope creep.

## Issues Encountered

The Edit tool was initially invoked with a path that does not exist on disk (`.claude/worktrees/agent-a17d1ab0/agents/gsd-code-fixer.md`) — the environment's declared working directory did not match the actual shell CWD. Subsequent edits used the correct absolute path `/home/thamw/development/happier/get-shit-done/agents/gsd-code-fixer.md` and all three tasks completed successfully.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Changes are prompt text edits only.

## Known Stubs

None.

## Next Phase Readiness
- gsd-code-fixer.md now has zero bare Do NOT violations for the three tracked FRAMING requirements
- Plan 03 agent-frontmatter test gate will confirm no YAML frontmatter corruption was introduced
- negative-framing-scan tests should pass for gsd-code-fixer.md after this plan

---
*Phase: 13-agent-fixes*
*Completed: 2026-04-22*
