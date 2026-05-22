# Phase 32: Quick Test Fixes - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 3 targeted test failures introduced by the v1.41.2 upstream merge:
- HOOKS-01: `gsd-update-banner.js` missing from MANAGED_HOOKS array
- TEST-02: Windows npm spawn platform gate tests fail on POSIX CI
- PATH-01: Test reads `extract_learnings.md` (underscore) but upstream renamed to `extract-learnings.md` (hyphen)

</domain>

<decisions>
## Implementation Decisions

### HOOKS-01 — MANAGED_HOOKS entry
- **D-01:** Insert `'gsd-update-banner.js'` alphabetically between `'gsd-check-update.js'` and `'gsd-context-monitor.js'` in `hooks/gsd-check-update-worker.js`. Consistent with the existing sorted pattern in the array.

### TEST-02 — Windows spawn platform gate
- **D-02:** Apply `describe.skip` to the entire `describe('gsd-check-update-worker: Windows npm spawn platform gate', ...)` block in `tests/gsd-check-update-worker-platform-gate.test.cjs`.
- **D-03:** Add an inline comment next to `describe.skip` explaining that this fork replaces the npm-based update architecture with GitHub API, making these Windows-only spawn shape tests inapplicable.

### PATH-01 — Stale file path in test
- **D-04:** Update the `readFile` path in `tests/phase-30-affirmative-replacements.test.cjs` line 53 from `'get-shit-done/workflows/extract_learnings.md'` to `'get-shit-done/workflows/extract-learnings.md'` (hyphen). Fix the path only — no other changes to the test.

### Claude's Discretion
- Test description text for PATH-01 (line 52) — update only if it causes noise; the requirement is to fix the readFile path.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — v1.41.3 requirements; HOOKS-01, TEST-02, PATH-01 are all Phase 32 scope

### Files to modify
- `hooks/gsd-check-update-worker.js` — MANAGED_HOOKS array (HOOKS-01)
- `tests/gsd-check-update-worker-platform-gate.test.cjs` — Windows spawn platform gate describe block (TEST-02)
- `tests/phase-30-affirmative-replacements.test.cjs` — stale extract_learnings.md path (PATH-01)

### Files to verify
- `hooks/gsd-update-banner.js` — confirm exists before adding to MANAGED_HOOKS
- `get-shit-done/workflows/extract-learnings.md` — confirm exists and contains `"continues silently"` before updating test path

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MANAGED_HOOKS` array in `hooks/gsd-check-update-worker.js` lines 40–52 — sorted alphabetically; insert new entry maintaining that order

### Established Patterns
- `describe.skip` is the established skip mechanism in this test suite
- The platform gate file already has an `allow-test-rule` comment at the top (line 26–28) explaining the structural assertion rationale — the new inline comment should complement it, not duplicate it

### Integration Points
- `tests/managed-hooks.test.cjs` — the failing test; reads `gsd-check-update-worker.js` source and asserts every `gsd-*.js` in `hooks/` is in MANAGED_HOOKS

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard targeted fixes.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 32-Quick Test Fixes*
*Context gathered: 2026-05-13*
