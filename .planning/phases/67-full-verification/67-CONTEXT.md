# Phase 67: Full Verification - Context

**Gathered:** 2026-06-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Final verification gate for the CITE milestone. Confirm that the full test suite passes with zero failures, the issue-citation guard test is GREEN, and pre-existing content scanners are unaffected by the phase 66 cleanup.

This phase verifies — it does not implement new features. The only code changes permitted are remediation of failures discovered during verification (see decisions below).

</domain>

<decisions>
## Implementation Decisions

The user reviewed the verification-policy gray areas (failure remediation, manual grep step, baseline-unchanged assertion) and chose **"Nothing to discuss"** — the phase is clear-cut verification. No policies were locked; the planner has discretion on how to structure the verification plan.

### Current verified state (at context-gathering time)
- **D-01:** `tests/no-issue-citations.test.cjs` — already GREEN (326/326 subtests passing).
- **D-02:** `tests/negative-framing-scan.test.cjs` — already GREEN (99/99 subtests), matching the required v2.1.0-f baseline in success criterion #3.
- **D-03:** Full `npm test` run is the remaining confirmation step — not yet run as part of this phase.

### Claude's Discretion
- How to handle any failure surfaced by `npm test` (fix-in-place vs. route to debug/replan) — user left this to planner/executor judgement.
- Whether to include an explicit manual `grep -rEn '#[0-9]+'` allowlist check (CITE-11) as a verification step, or rely on the guard test as the encoding of that rule.
- Whether to hard-assert exact scanner counts or require only "no new failures."

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — CITE-10 (guard GREEN after cleanup), CITE-11 (`grep -rEn '#[0-9]+'` returns only allowlisted hits), CITE-12 (`npm test` zero failures).
- `.planning/ROADMAP.md` §"Phase 67: Full Verification" — goal and 3 success criteria.

### Test artifacts to verify against
- `tests/no-issue-citations.test.cjs` — the issue-citation guard test (must pass GREEN; encodes the allowlist of hex colors, placeholders, heading markers).
- `tests/negative-framing-scan.test.cjs` — must remain at the 99/99 baseline (success criterion #3).
- `tests/step-numbering-scan.test.cjs`, `tests/cross-file-step-refs.test.cjs`, `tests/agent-frontmatter.test.cjs` — named in success criteria as suite members that must remain GREEN.

### Prior-phase context
- `.planning/phases/66-citation-cleanup/66-0{1,2,3,4}-SUMMARY.md` — what the cleanup changed (the work being verified here).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `npm test 2>&1 | tee /tmp/gsd-test-output.txt` — canonical full-suite invocation (from CLAUDE.md); run once, read the file rather than re-running.
- Individual scanner tests run via `node --test tests/<name>.test.cjs` for targeted confirmation.

### Established Patterns
- Content scanners (guard, negative-framing, step-numbering, cross-file-step-refs) are corpus-wide and assert exact pass counts — any drift is a real signal, not noise.

### Integration Points
- This phase consumes the output of phase 66 (citation cleanup); no new files expected beyond any remediation.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — verification follows the success criteria in ROADMAP.md exactly.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 67-full-verification*
*Context gathered: 2026-06-10*
