# Phase 15: Test Suite Gate - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify that the DO NOT corpus scan passes all 4 subtests (agents, workflows, references, commands) and that the full test suite shows no regressions from the Phases 13–14 framing pass.

**Current state (verified 2026-04-22):**
- `corpus scan — DO NOT primary directives (case-insensitive)` → 4/4 passing
- `corpus scan — NEVER primary directives` → 4/4 passing
- Full test suite → 4168/4168 passing, 0 failures

No fixes are required — this phase captures, documents, and formally closes the verification.

</domain>

<decisions>
## Implementation Decisions

### Plan Scope
- **D-01:** Document first, then confirm green. The plan must update each FRAMING-XX entry in REQUIREMENTS.md with the actual fix that was applied (before/after text inline), then run the full test suite to confirm 4/4 corpus scan subtests pass and 0 failures.

### Documentation Location
- **D-02:** Violation-to-fix mapping goes in REQUIREMENTS.md inline — add a `Fixed:` annotation to each FRAMING-07 through FRAMING-17 entry with the before/after line text. No separate artifact file. Keeps requirement and fix co-located.

### Test Count Update
- **D-03:** Update the test count floor from `≥4142` to `≥4168` in both ROADMAP.md (Phase 15 success criterion SC-2) and REQUIREMENTS.md (TEST-05). 4168 is the accurate post-Phase-13/14 baseline.

### Claude's Discretion
- Exact before/after wording for each FRAMING-XX annotation — derive from the actual git diff of Phase 14 edits.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — TEST-05 is the gate requirement; FRAMING-07 through FRAMING-17 are the violation requirements to annotate with fix text
- `.planning/ROADMAP.md` — Phase 15 success criteria (SC-2 test count to update from ≥4142 to ≥4168)

### Test files (gate)
- `tests/negative-framing-scan.test.cjs` — the corpus scanner; run `node --test tests/negative-framing-scan.test.cjs` to isolate results
- Run `npm test` for full suite verification

### Prior phase context (source of truth for what was fixed)
- `.planning/phases/13-agent-fixes/13-CONTEXT.md` — FRAMING-01 through FRAMING-06 decisions
- `.planning/phases/14-workflow-reference-and-command-fixes/14-CONTEXT.md` — FRAMING-07 through FRAMING-17 decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Established Patterns
- Phase 14 test count: `npm test` reports 4168 tests (26 added by Phases 13–14 vs. the 4142 baseline)
- The corpus scanner lives in `tests/negative-framing-scan.test.cjs` and runs as part of `npm test`
- REQUIREMENTS.md entries follow the format: `✓ **FRAMING-XX**: [description]` — append `Fixed:` line below each one

### Integration Points
- REQUIREMENTS.md and ROADMAP.md are the two files requiring text updates (test count + fix annotations)
- No source files need editing — all fixes were applied in Phases 13 and 14

</code_context>

<specifics>
## Specific Ideas

- For each FRAMING-XX annotation: find the Phase 14 commit diff for the relevant file and extract the exact before/after line. Keep annotations short: `Before: "Do not X" → After: "Y instead"`.
- SC-2 in ROADMAP.md Phase 15 block: change "at least 4142 tests passing" to "at least 4168 tests passing".

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 15-test-suite-gate*
*Context gathered: 2026-04-22*
