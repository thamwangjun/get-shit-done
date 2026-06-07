# Phase 59: Comment Cleanup - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Delete the stale "Phase 48 RED expectation" JSDoc comment (lines 18–26) from
`tests/step-numbering-scan.test.cjs`, establishing a clean baseline before any
substantive test additions in later v2.1.0-f phases.

This phase delivers ONLY the comment removal — no test logic changes, no new
assertions, no behavioral changes.

</domain>

<decisions>
## Implementation Decisions

### Scope
- **D-01:** No implementation gray areas exist. This is a single, mechanical
  deletion fully specified by the ROADMAP.md success criteria. Discussion was
  skipped per the discuss-phase skip-assessment rule; this CONTEXT.md is a record
  only.

### Verification
- **D-02:** After deletion, confirm `node --test tests/step-numbering-scan.test.cjs`
  reports the same test count as before (no tests lost, no parse errors).
- **D-03:** Confirm `npm test 2>&1 | tee /tmp/gsd-test-output.txt` passes with 0
  new failures.

### Claude's Discretion
- Exact deletion boundary: remove the JSDoc block at lines 18–26 (the
  "Phase 48 RED expectation:" paragraph and its bulleted file list). The
  surrounding `/** ... */` block comment documenting SCAN_DIRS/EXCLUDED stays;
  only the Phase 48 RED paragraph is removed. Planner/executor to verify exact
  line boundaries at execution time since line numbers may have drifted.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Target file
- `tests/step-numbering-scan.test.cjs` — the file containing the stale comment;
  lines 18–26 (the "Phase 48 RED expectation" JSDoc paragraph) are the deletion target.

### Roadmap
- `.planning/ROADMAP.md` §"Phase 59: Comment Cleanup" — goal, requirement DOC-01,
  and the three success criteria.

No external ADRs or specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — this is a deletion, not new code.

### Established Patterns
- The file's leading `/** ... */` JSDoc block documents the scanner's purpose,
  SCAN_DIRS, and EXCLUDED files. Only the Phase-48-specific RED expectation
  paragraph is stale (the milestone shipped 2026-05-31); the rest remains accurate.

### Integration Points
- None.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — straightforward deletion.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 59-Comment Cleanup*
*Context gathered: 2026-06-07*
