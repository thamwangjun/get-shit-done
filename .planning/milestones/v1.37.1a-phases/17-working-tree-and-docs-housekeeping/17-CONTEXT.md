# Phase 17: Working Tree & Docs Housekeeping - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Close all 7 remaining tech debt items from the v1.37.1a milestone audit:
1. Commit all untracked files (mise.toml, v1.37.1a-MILESTONE-AUDIT.md, 14-PATTERNS.md, .planning/notes/)
2. Commit all modified tracked files (.planning/config.json, .planning/research/*.md, package-lock.json, sdk/package-lock.json)
3. Remove the duplicate `describe('corpus scan — DO NOT primary directives (case-insensitive)', ...)` block at line 564 of `tests/negative-framing-scan.test.cjs`
4. Add `Fixed:` inline annotations for FRAMING-01 through FRAMING-06 in REQUIREMENTS.md (same indented format as FRAMING-07–17)
5. Update `15-01-SUMMARY.md` test count from 4164 → 4168 (live count confirmed 4168 by audit)

No new capabilities. No structural changes beyond the targeted items above.

</domain>

<decisions>
## Implementation Decisions

### Untracked File Disposition
- **D-01:** Commit all four untracked items:
  - `mise.toml` — dev tool version pin, commit to repo root
  - `.planning/v1.37.1a-MILESTONE-AUDIT.md` — milestone audit artifact, commit under .planning/
  - `.planning/phases/14-workflow-reference-and-command-fixes/14-PATTERNS.md` — planning artifact, commit in place
  - `.planning/notes/` directory (contains `2026-04-22-scanner-bug-isconditionalorfactual.md`) — commit as-is

### Modified Tracked Files Disposition
- **D-02:** Commit all modified tracked files as a housekeeping bundle:
  - `.planning/config.json`
  - `.planning/research/ARCHITECTURE.md`
  - `.planning/research/FEATURES.md`
  - `.planning/research/PITFALLS.md`
  - `.planning/research/STACK.md`
  - `package-lock.json`
  - `sdk/package-lock.json`
  - `tests/negative-framing-scan.test.cjs` (the duplicate describe removal is also here)

### Duplicate Describe Block Removal
- **D-03:** Remove the duplicate `describe('corpus scan — DO NOT primary directives (case-insensitive)', ...)` block at `tests/negative-framing-scan.test.cjs:564`. The canonical block is at line 400 — keep that one. The block at line 564 (and its contents through the closing brace) is the duplicate to delete.
  - After removal, run `npm test` to confirm 0 failures.

### FRAMING-01–06 Fixed: Annotations
- **D-04:** Add `Fixed:` inline annotations to FRAMING-01 through FRAMING-06 entries in REQUIREMENTS.md. Use the same format established by FRAMING-07–17: indented two spaces under the requirement bullet, format `  - Fixed: <before text> → <after text>`.
  - Source the before/after text from `.planning/phases/13-agent-fixes/13-CONTEXT.md` decisions (D-01 through D-03 and the remaining FRAMING-02/04/05/06 decisions) and from the actual git history of Phase 13.

### Phase 15 SUMMARY Test Count Correction
- **D-05:** Update `.planning/phases/15-test-suite-gate/15-01-SUMMARY.md` — change all occurrences of `4164` to `4168` where they refer to the test count floor or result. The audit confirms live count is 4168; Phase 15's SUMMARY was written in worktree mode before the test file modifications were committed, making it stale by 4 tests.

### Claude's Discretion
- Exact commit message split (one commit for all, or separate commits per concern) — either grouping is acceptable
- Whether to correct the ROADMAP.md Phase 15 SC-2 test count in the same phase (the audit notes it may already read 4168; verify first)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Audit (source of truth for this phase's scope)
- `.planning/v1.37.1a-MILESTONE-AUDIT.md` — tech_debt items enumerated; confirms 4168 live test count

### FRAMING Annotation Source
- `.planning/REQUIREMENTS.md` — FRAMING-01 through FRAMING-06 entries at lines 12–17 (add Fixed: annotations here)
- `.planning/phases/13-agent-fixes/13-CONTEXT.md` — decisions D-01 through D-03 contain the before/after fix text for FRAMING-01, FRAMING-02, FRAMING-03 (and the remaining FRAMING-04–06 patterns)

### Test File
- `tests/negative-framing-scan.test.cjs` — duplicate describe at line 564; canonical block at line 400

### Phase 15 SUMMARY (to update)
- `.planning/phases/15-test-suite-gate/15-01-SUMMARY.md` — test count 4164 → 4168

### Reference Format (FRAMING-07–17 annotation examples)
- `.planning/REQUIREMENTS.md` lines for FRAMING-07 through FRAMING-17 — established `Fixed:` annotation format with indented before/after

</canonical_refs>

<code_context>
## Existing Code Insights

### Established Patterns
- `Fixed:` annotation format (FRAMING-07–17): indented two spaces under the requirement bullet, `  - Fixed: <original text> → <replacement text>` (or "line deleted" for deletions)
- Working-tree cleanup convention: housekeeping commits bundle incidental changes (config, research, lock files) without mixing with code fixes

### Integration Points
- `tests/negative-framing-scan.test.cjs` — removing lines 564–end-of-duplicate-block; test suite must pass after removal
- `npm test` — final gate; must show 0 failures after all changes

</code_context>

<specifics>
## Specific Ideas

- Phase 15 SUMMARY stale count (4164 vs 4168) is documented in the v1.37.1a-MILESTONE-AUDIT.md as: "live count confirmed 4168 — SUMMARY count is stale due to 4 tests added by uncommitted `tests/negative-framing-scan.test.cjs` modifications"
- The duplicate describe block appears at line 564 because `tests/negative-framing-scan.test.cjs` was modified during Phase 15 work and the change was never committed; the file currently has two blocks with the same name

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 17-working-tree-and-docs-housekeeping*
*Context gathered: 2026-04-23*
