# Phase 60: Effort Wiring Coverage - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Add eight Group B effort-wiring regression tests to `tests/phase-56-effort-wiring.test.cjs`. Each test guards a spawn-template wiring site added in v2.1.0-e Phase 56, asserting the workflow `.md` file contains its `resolve-model-effort gsd-<agent>` capture line and its `<agent>_model_effort_arg` token. These are GREEN guards against silent regression — all target tokens already exist in the live files (verified during discussion).

**In scope:** writing 8 new tests in the existing file.
**Out of scope:** modifying any workflow `.md` file, adding wiring, changing the Phase 56 GAP A/B tests.

</domain>

<decisions>
## Implementation Decisions

### Test file & structure
- **D-01:** Add tests to the existing `tests/phase-56-effort-wiring.test.cjs` (locked by ROADMAP goal — not a new file).
- **D-02:** Add a new `describe('phase-60 Group B effort wiring: <newly-covered workflows>', ...)` block at the end of the file, after the existing GAP B block. Do not fold into the Phase 56 GAP A/B describe blocks.
- **D-03:** Mirror the existing GAP B pattern exactly: use the file's `read(rel)` helper + `assert.ok(content.includes(token), '<msg>')`. Plain substring checks, no regex, no adjacency/wiring-position assertions (consistency with Phase 56 style).

### Test-to-requirement mapping (one test per EWC requirement)
- **D-04:** EWC-01 → `audit-fix.md`: `resolve-model-effort gsd-executor`, `executor_model_effort_arg`
- **D-05:** EWC-02 → `diagnose-issues.md`: `resolve-model-effort gsd-debugger`, `debugger_model_effort_arg`
- **D-06:** EWC-03 → `code-review.md`: `resolve-model-effort gsd-code-reviewer`, `code_reviewer_model_effort_arg`
- **D-07:** EWC-04 → `code-review-fix.md`: `resolve-model-effort gsd-code-reviewer`, `resolve-model-effort gsd-code-fixer`, `code_reviewer_model_effort_arg`, `code_fixer_model_effort_arg` (single test, both spawn sites)
- **D-08:** EWC-05 → `explore.md`: `resolve-model-effort gsd-phase-researcher`, `phase_researcher_model_effort_arg`
- **D-09:** EWC-06 → `import.md`: `resolve-model-effort gsd-plan-checker`, `plan_checker_model_effort_arg`
- **D-10:** EWC-07 → `ingest-docs.md`: `resolve-model-effort gsd-doc-synthesizer`, `resolve-model-effort gsd-roadmapper`, `doc_synthesizer_model_effort_arg`, `roadmapper_model_effort_arg` (single test, both spawn sites)
- **D-11:** EWC-08 → `discuss-phase-assumptions.md`: `resolve-model-effort gsd-assumptions-analyzer`, `assumptions_analyzer_model_effort_arg`
- **D-12:** Multi-agent requirements (EWC-04, EWC-07) are one test each asserting all four tokens — keeps the file's "one test per file" convention. Paths are relative to `get-shit-done/workflows/`.

### Verification
- **D-13:** Tests must be live (not skipped) and pass GREEN; `npm test 2>&1 | tee /tmp/gsd-test-output.txt` must show 0 new failures (success criterion 5).

### Claude's Discretion
- Exact `describe`/`test` titles and assertion message wording — follow the existing file's phrasing style.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Test target & pattern
- `tests/phase-56-effort-wiring.test.cjs` — the file to extend; its GAP B `describe` block is the exact pattern to mirror (read helper + `content.includes` asserts).

### Requirements & success criteria
- `.planning/REQUIREMENTS.md` §Effort Wiring Coverage (EWC-01 – EWC-08) — the locked token list per file.
- `.planning/ROADMAP.md` "Phase 60: Effort Wiring Coverage" — goal + 5 success criteria (incl. multi-agent grouping for code-review-fix.md and ingest-docs.md).

### Files under test (all under `get-shit-done/workflows/`)
- `audit-fix.md`, `diagnose-issues.md`, `code-review.md`, `code-review-fix.md`, `explore.md`, `import.md`, `ingest-docs.md`, `discuss-phase-assumptions.md` — tokens verified present 2026-06-07.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `read(rel)` helper and `ROOT` constant in `tests/phase-56-effort-wiring.test.cjs` — reuse directly; do not reimplement.
- `// allow-test-rule: source-text-is-the-product` header already present at top of file — covers the new source-text assertions.

### Established Patterns
- One `test()` per workflow file; `assert.ok(content.includes(token), msg)` with a descriptive failure message naming the file and token.
- Multi-agent spawn sites (e.g. ui-phase.md in existing GAP B) are asserted as a single test with multiple `assert.ok` calls — the model for EWC-04 and EWC-07.

### Integration Points
- New describe block appended to the same file; no other test files or source files touched.

</code_context>

<specifics>
## Specific Ideas

All 20 target tokens were grep-verified present in the live workflow files on 2026-06-07 — the tests are confirmed GREEN guards, not red TDD specs.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Phases 61–63 cover the remaining coverage gaps: worktree safety, rubric inlining, security framing.)

</deferred>

---

*Phase: 60-Effort Wiring Coverage*
*Context gathered: 2026-06-07*
