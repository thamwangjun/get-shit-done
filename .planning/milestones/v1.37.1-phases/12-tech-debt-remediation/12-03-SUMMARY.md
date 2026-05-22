---
phase: 12-tech-debt-remediation
plan: "03"
subsystem: commands, tests
tags: [positive-framing, tech-debt, WR-01, D-01, command-files, test-cleanup]
dependency_graph:
  requires:
    - phase: 12-01
      provides: "IN-01/WR-03 resolved; test suite green baseline"
    - phase: 12-02
      provides: "All 9 unpaired NEVER prohibitions in agent files replaced"
  provides:
    - "quick.md and thread.md SECURITY blocks end with positive sanitization instruction"
    - "WR-01 resolved: dormant NEVER skip guard removed from agent-frontmatter test"
    - "D-01 positive-framing sweep complete: zero unpaired bare prohibitions in agents/ or commands/gsd/"
    - "npm test 4142/4142 passing — Phase 12 completion gate met"
  affects: [future-fork-maintenance]
tech_stack:
  added: []
  patterns:
    - "Prohibition fold with em-dash: trailing 'Never X' folded into preceding sentence as '— pass only sanitized Y to Z'"
    - "Dormant test guard removal: guards that skip lines based on obsolete content patterns are removed when the content pattern no longer exists"
key_files:
  created: []
  modified:
    - commands/gsd/quick.md
    - commands/gsd/thread.md
    - tests/agent-frontmatter.test.cjs
    - .planning/phases/12-tech-debt-remediation/12-VALIDATION.md
decisions:
  - "quick.md SECURITY block: em-dash fold preserves sanitization instruction, removes trailing prohibition without creating a new sentence"
  - "thread.md SECURITY block: same em-dash fold pattern applied consistently"
  - "NEVER skip guard in agent-frontmatter.test.cjs removed: guard was dormant after Phase 7 replaced all NEVER-prefixed heredoc instructions with positive form; removing it closes WR-01 and eliminates false-negative risk for future regressions"
metrics:
  duration: "~6 minutes"
  completed: "2026-04-21T12:10:00Z"
  tasks_completed: 2
  files_modified: 3
---

# Phase 12 Plan 03: Command File Positive Framing + WR-01 Guard Removal Summary

Two remaining command file unpaired prohibitions replaced with positive sanitization instructions (D-01 sweep complete), and the dormant NEVER skip guard removed from the heredoc detection test (WR-01 resolved). Full suite 4142/4142 — Phase 12 completion gate met.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace unpaired prohibitions in commands/gsd/quick.md and commands/gsd/thread.md | afefefd | commands/gsd/quick.md, commands/gsd/thread.md |
| 2 | WR-01 — Remove dormant NEVER skip guard from tests/agent-frontmatter.test.cjs | 6223a11 | tests/agent-frontmatter.test.cjs |

## What Was Built

### Task 1: D-01 Command File Sweep (quick.md and thread.md)

Both `commands/gsd/quick.md` and `commands/gsd/thread.md` had unpaired bare prohibitions in their SECURITY blocks — sentences that stated what not to do without being preceded by an affirmative action instruction.

**quick.md SECURITY block change:**
The final sentence `Never pass raw directory names to shell commands via string interpolation.` was folded into the preceding sentence using an em-dash: `name.replace(...)` — pass only sanitized directory names to shell commands.`

**thread.md SECURITY block change:**
The final sentence `Never pass raw filenames to shell commands via string interpolation.` was folded into the preceding sentence using an em-dash: `...and path separators — pass only sanitized filenames to shell commands.`

All PAIRED forms in both files (4 total across both files) were confirmed untouched after edits. The D-01 positive-framing sweep is now complete across all `agents/` and `commands/gsd/` files.

### Task 2: WR-01 — Dormant NEVER Skip Guard Removal

The heredoc detection test in `tests/agent-frontmatter.test.cjs` (line 53, `'no active heredoc patterns in any agent file'` test) had a skip guard:

```
if (line.includes('NEVER') || line.trim().startsWith('```')) continue;
```

The `line.includes('NEVER') || ` prefix was removed, leaving only:

```
if (line.trim().startsWith('```')) continue;
```

**Why the guard was dormant:** Phase 7 replaced all NEVER-prefixed anti-heredoc instructions (e.g., `NEVER use cat << 'EOF'`) with positive-only form (`Only use the Write tool`). After that change, no agent file contains a NEVER-prefixed heredoc instruction, so the guard was skipping zero lines. Its presence created a false-negative risk: if a future agent reintroduced a NEVER-prefixed heredoc line, the guard would silently skip it rather than catching the pattern.

Removing the guard closes WR-01 per D-04 (dormant guards must be removed). The code-fence guard and all surrounding test logic are unchanged.

## Verification

```
PASS: quick: no Never-raw-directory
PASS: quick: has pass-only-sanitized-directory
PASS: quick: PAIRED 173 intact
PASS: thread: no Never-raw-filenames
PASS: thread: has pass-only-sanitized-filenames
PASS: thread: PAIRED 140 intact

PASS: NEVER guard removed
PASS: code-fence guard preserved

Full suite: 4142/4142 pass, 0 fail
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

No new security-relevant surface introduced. Changes are text-only framing edits and a test guard removal.

The T-12-05 threat (tampering via test guard removal changing heredoc inspection) was mitigated by verifying 135/135 agent-frontmatter tests pass after the guard removal and confirming no agent file contains a NEVER-prefixed heredoc pattern before removing the guard.

## Self-Check: PASSED

- [x] `commands/gsd/quick.md` modified — `grep -c "Never pass raw directory names"` returns 0
- [x] `commands/gsd/thread.md` modified — `grep -c "Never pass raw filenames"` returns 0
- [x] `tests/agent-frontmatter.test.cjs` modified — `grep -c "line.includes('NEVER')"` returns 0
- [x] Commit afefefd exists in git log (Task 1)
- [x] Commit 6223a11 exists in git log (Task 2)
- [x] 4142/4142 tests pass — Phase 12 completion gate met
- [x] 12-VALIDATION.md updated: nyquist_compliant: true, wave_0_complete: true, all tasks ✅ green
