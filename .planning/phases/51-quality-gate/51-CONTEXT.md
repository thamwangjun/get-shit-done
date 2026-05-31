# Phase 51: Quality Gate - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Run the full test suite to confirm the entire v2.1.0-d milestone (Phases 48–50) delivers a clean baseline before closing the milestone:

1. `npm test` passes at the new expected count (documented at execution time by running it first)
2. Negative-framing scanner remains at 99/99 subtests passing
3. `tests/step-numbering-scan.test.cjs` and `tests/cross-file-step-refs.test.cjs` both pass in the full suite run

**In scope:** Running the gate, documenting results, inline-fixing trivial regressions (single file, <10 lines changed), producing phase close-out artifacts
**Out of scope:** New functionality, scanner changes, maintenance script changes, fixing complex regressions (those become a new phase)

</domain>

<decisions>
## Implementation Decisions

### Regression Measurement
- **D-01:** Run `npm test` first and document the new expected pass count at execution time. The v2.1.0-c baseline was 7459 pass / 49 fail, but Phases 48–50 added new tests — the actual count will be higher. Lock the observed count as the success criterion for this phase.
- **D-02:** The 49 pre-existing failures are already known; "0 regressions" means the fail count stays at 49 (no new failures beyond the pre-existing ones).

### Failure Response
- **D-03:** If `npm test` reveals new failures introduced by Phase 48–50 work, Phase 51 fixes them inline — but only if the fix touches a single file and changes fewer than 10 lines. Anything larger stops execution and creates a new fix phase.
- **D-04:** "Trivial" threshold: single file, <10 lines changed. Not whether the failure is "obviously mechanical" (too subjective) — the size bound is the enforced gate.

### Completion Artifacts
- **D-05:** Phase 51 produces a `VERIFICATION.md` documenting the test run results and gate check, plus a `SUMMARY.md` that closes the phase. Standard GSD close-out, consistent with Phases 48–50.
- **D-06:** No milestone prep note in SUMMARY.md — `/gsd-complete-milestone` is a separate workflow step that the user runs after Phase 51 verification.

### Claude's Discretion
- Format of VERIFICATION.md (table vs prose — mirror Phase 50's VERIFICATION.md style for consistency)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Gate Requirements
- `.planning/REQUIREMENTS.md` §GATE-01 — the single requirement this phase delivers: `npm test` at 0 regressions + negative-framing scanner at 99/99
- `.planning/ROADMAP.md` §Phase 51 — success criteria: (1) 0 new failures vs v2.1.0-c baseline, (2) negative-framing scanner 99/99, (3) both new test files pass

### Test Files to Verify
- `tests/step-numbering-scan.test.cjs` — Phase 48/49 scanner; must pass GREEN in full suite
- `tests/cross-file-step-refs.test.cjs` — Phase 50 cross-file ref scanner; must pass GREEN in full suite
- `tests/negative-framing-scan.test.cjs` — 99 framing scanner subtests; must stay at 99/99

### Phase Context
- `.planning/phases/50-maintenance-script-and-cross-ref-scanner/50-CONTEXT.md` — Phase 50 decisions; what was built and what the baseline state is entering Phase 51
- `.planning/PROJECT.md` — milestone goal and baseline: v2.1.0-c was 7459 pass / 49 fail before Phases 48–50 added tests

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/step-numbering-scan.test.cjs` — already exists; Phase 51 just runs it as part of `npm test`
- `tests/cross-file-step-refs.test.cjs` — already exists; Phase 51 just runs it as part of `npm test`
- `scripts/normalize-step-numbers.cjs` — already exists; `--dry-run` was a Phase 50 success criterion, so Phase 51 can verify idempotency in one line if desired

### Established Patterns
- VERIFICATION.md format: see Phase 50's VERIFICATION.md for the style to mirror
- `npm test 2>&1 | tee /tmp/gsd-test-output.txt; echo "Exit: $?"` — the standard test run pattern from CLAUDE.md; run once, analyze from file

### Integration Points
- `scripts/run-tests.cjs` — auto-discovers `tests/cross-file-step-refs.test.cjs`; no wiring needed
- Pre-existing 49 failures: these are known and expected; Phase 51 must not introduce new ones

</code_context>

<specifics>
## Specific Ideas

- Run `npm test` once, capture output, confirm pass count, then lock it in VERIFICATION.md. Do not re-run to check output.
- The negative-framing scanner check is just verifying the 99 subtests in `tests/negative-framing-scan.test.cjs` pass — no separate CLI invocation needed beyond `npm test`.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 51-Quality Gate*
*Context gathered: 2026-05-31*
