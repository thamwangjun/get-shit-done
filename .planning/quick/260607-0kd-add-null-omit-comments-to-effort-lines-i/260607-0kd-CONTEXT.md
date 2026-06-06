---
type: context
quick_id: 260607-0kd
date: 2026-06-06
status: Ready for planning
---

# Quick Task 260607-0kd: Add null-omit comments to effort= lines in Agent invocations - Context

**Gathered:** 2026-06-06
**Status:** Ready for planning

<domain>
## Task Boundary

In all .md prompt files under agents/ and get-shit-done/workflows/ (recursively), find every
standalone-line `effort={*_effort_arg}` pattern — lines where `effort={varname}` is the only
content after leading whitespace — and append a trailing comment: `# omit this line when
<varname> == null`. Apply with sed, commit atomically.

50 total occurrences confirmed across 20 files (including one subdirectory file:
get-shit-done/workflows/discuss-phase/modes/advisor.md).

</domain>

<decisions>
## Implementation Decisions

### Target scope
Scan ALL .md files under agents/ and get-shit-done/workflows/ recursively. The regex
`^\s+effort=\{[A-Za-z_][A-Za-z_0-9]*_effort_arg\}\s*$` self-guards against inline patterns
(confirmed 0 false positives in code-review-fix.md). Using `grep -rn --include="*.md"` across
all prompt files.

### Pre-application review
Only apply to lines confirmed to be inside Agent() invocations — not documentation, prose,
or template examples. All 50 discovered matches were spot-checked and verified to be inside
Agent() call blocks. The match list is approved for transformation.

### Verification
Assert change count == 50 after sed runs (adapted from user feedback to count Agent()-only
matches). If count differs, surface for review before committing.

### Claude's Discretion
- Sed command syntax: macOS-compatible `sed -i '' -E` with `/# omit this line when/!` address
  guard for idempotency, backreferences `\1\2\3`.
- Indentation in replacement: `\1\2  # omit this line when \3 == null` (two spaces before `#`).
- Commit: single atomic commit with message `chore: add null-omit comments to effort= lines in Agent invocations`.

</decisions>

<specifics>
## Specific Ideas

Approved match list (50 lines, all verified as inside Agent() calls):
- agents/gsd-debug-session-manager.md:96
- get-shit-done/workflows/validate-phase.md:117
- get-shit-done/workflows/ui-review.md:118
- get-shit-done/workflows/diagnose-issues.md:116
- get-shit-done/workflows/debug.md:145, 224
- get-shit-done/workflows/scan.md:92
- get-shit-done/workflows/plan-phase.md:542, 863, 1006, 1063, 1108, 1267, 1383
- get-shit-done/workflows/explore.md:74
- get-shit-done/workflows/audit-milestone.md:98
- get-shit-done/workflows/secure-phase.md:123
- get-shit-done/workflows/map-codebase.md:167, 194, 221, 248
- get-shit-done/workflows/audit-fix.md:115
- get-shit-done/workflows/docs-update.md:400, 423, 446, 532, 559, 586, 613, 640, 668, 758
- get-shit-done/workflows/import.md:216
- get-shit-done/workflows/ui-phase.md:176, 230
- get-shit-done/workflows/execute-phase.md:552, 1401
- get-shit-done/workflows/verify-work.md:600, 652, 699
- get-shit-done/workflows/discuss-phase/modes/advisor.md:106
- get-shit-done/workflows/ingest-docs.md:204, 273
- get-shit-done/workflows/quick.md:462, 521, 588, 636, 788, 868, 906

</specifics>
