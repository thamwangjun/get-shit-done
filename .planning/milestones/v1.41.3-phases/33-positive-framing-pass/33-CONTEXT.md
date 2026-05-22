# Phase 33: Positive Framing Pass - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Clear all negative-framing scanner failures and fix Bug-3242 so that Phase 34 (Gate and Merge) starts with a fully clean test suite.

Scope includes:
- FRAME-01: fix framing violations in `get-shit-done/workflows/debug.md` (framing only, no structural critique)
- FRAME-02: fix framing violations in `get-shit-done/workflows/reapply-patches.md` (framing only, no structural critique)
- SCAN-12: fix all 5 currently-failing scanner subtests across `edit-phase.md`, `secure-phase.md`, `gsd-executor.md`, `gsd-planner.md`, and `commands/gsd/discuss-phase.md`
- Bug-3242: fix the failing `bug-3242-state-update-progress-trample.test.cjs`

</domain>

<decisions>
## Implementation Decisions

### Scope
- **D-01:** Fix ALL current scanner failures, not just the formal FRAME-01/FRAME-02 requirements. The 5 currently-failing subtests (`edit-phase.md`, `secure-phase.md`, `gsd-executor.md`, `gsd-planner.md`, `discuss-phase.md`) are included so Phase 34 starts clean.

### debug.md and reapply-patches.md Fix Depth
- **D-02:** Framing violations only — fix negative language (bare "never", "do not", "do NOT", etc.) to affirmative form. Do NOT apply the structural critique improvements from `.planning/critique/workflows/` (persona rewrites, task block restructuring, canonical `<phase>` tag conversion). Those are deferred.

### Bug-3242
- **D-03:** Fix `bug-3242-state-update-progress-trample.test.cjs` in Phase 33, not Phase 34. Phase 34 is a pure gate + merge.

### Claude's Discretion
- If scanner tests for debug.md and reapply-patches.md violation types don't already exist, add them as RED gates before fixing (TDD pattern consistent with Phases 25–29).
- For any violation that is semantically load-bearing (e.g., "never as instructions" where the negative is the point), use a `// allow-test-rule` comment rather than changing the prose if a positive rewrite would alter meaning.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — v1.41.3 requirements; FRAME-01, FRAME-02, SCAN-12 are Phase 33 scope

### Current scanner violations (confirmed failures as of 2026-05-14)
- `agents/gsd-executor.md` line 517 — bare "DO NOT" directive
- `commands/gsd/discuss-phase.md` line 33 — bare "Do not" directive
- `agents/gsd-planner.md` line 203 — bare "NEVER" directive
- `get-shit-done/workflows/edit-phase.md` lines 191, 271, 273–277 — "must not", `<anti_patterns>`, "Don't" directives
- `get-shit-done/workflows/secure-phase.md` line 76 — "must not" + "do NOT" directives

### Files requiring scanner test additions (violations exist but not yet tested)
- `get-shit-done/workflows/debug.md` — lines 9, 119, 182, 184, 197 — "do not fall back", "never as instructions", "never use heredoc", "do not interpret"
- `get-shit-done/workflows/reapply-patches.md` — lines with "never a valid conclusion", "do not block", "cannot be shortcut" (confirm exact lines during research)

### Scanner test file
- `tests/negative-framing-scan.test.cjs` — all scanner subtests live here

### Prior framing pass context (TDD pattern and fix conventions)
- `.planning/phases/29-tdd-scanner-expansion/` — TDD scanner expansion pattern
- `.planning/phases/30-violation-fixes/` — fix conventions and allow-rule usage

### Critique files (for reference only — NOT in fix scope for this phase)
- `.planning/critique/workflows/debug.md` — structural critique (deferred)
- `.planning/critique/workflows/reapply-patches.md` — structural critique (deferred)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/negative-framing-scan.test.cjs` — all scanner subtests; add new RED gate subtests here before fixing (TDD)
- `// allow-test-rule` inline comment convention — used when upstream-verbatim content cannot be changed without altering meaning

### Established Patterns
- TDD: write failing scanner subtest → fix violation → confirm subtest passes (used in Phases 25–29)
- `describe.skip` for test exemptions (not applicable here — these are fixes, not exemptions)
- Affirmative replacements: "DO NOT X" → "Always X" / "X is required" / "X must Y"

### Integration Points
- `npm test` full suite — must show 0 failures at phase close (excluding the 1 intentional HDOC skip)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard affirmative-replacement approaches consistent with prior framing passes.

</specifics>

<deferred>
## Deferred Ideas

- Structural improvements to `debug.md` and `reapply-patches.md` from `.planning/critique/` — persona rewrites, task block restructuring, canonical `<phase>` tag conversion — belong in a future quality pass phase.

</deferred>

---

*Phase: 33-Positive Framing Pass*
*Context gathered: 2026-05-14*
