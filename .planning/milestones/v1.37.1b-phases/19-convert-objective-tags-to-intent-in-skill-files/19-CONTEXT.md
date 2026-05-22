# Phase 19: Convert objective tags to intent in skill files - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Convert all 33 command files in `commands/gsd/` that still use `<objective>` as the primary directive block to use `<intent>` instead — making `tests/fork-intent-tag.test.cjs` go from 46/79 to 79/79 passing subtests. No new capabilities; no behavior changes to the GSD runtime.

</domain>

<decisions>
## Implementation Decisions

### Conversion Approach
- **D-01:** Tag rename only — replace `<objective>` with `<intent>` and `</objective>` with `</intent>`. Content inside each block is unchanged. This is a mechanical find-and-replace across 33 files.

### Test Gate
- **D-02:** Add `CONVERT-01` to REQUIREMENTS.md: all 79 `commands/gsd/*.md` files must pass `fork-intent-tag.test.cjs` (79/79 subtests pass, 0 failures). This closes the loop on INTENT-01 from Phase 18.
- **D-03:** Update the DESIGN NOTE in `tests/fork-intent-tag.test.cjs` to remove the "33 failures by design" language — after conversion the test should pass 100%.

### Collateral Updates
- **D-04:** Update `REQUIREMENTS.md` — add CONVERT-01 requirement and mark INTENT-01 context as completed.
- **D-05:** Update `tests/fork-intent-tag.test.cjs` DESIGN NOTE comment to reflect all files now use `<intent>`.
- **D-06:** Add entry to PROJECT.md Key Decisions table recording `<objective>` → `<intent>` conversion as a completed fork change.

### Claude's Discretion
- Whether to also update `.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md` (records all fork change categories) — Claude may update this guide if it improves the fork's documentation completeness, or defer to a housekeeping phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Fork Standards
- `.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md` — records all fork change categories; the `<task>` → `<intent>` rename is documented here; `<objective>` → `<intent>` may need a note added
- `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` — fork prompt engineering quality bar; `<intent>` tag usage is defined here

### Test Files
- `tests/fork-intent-tag.test.cjs` — the test that Phase 19 must make pass 79/79; DESIGN NOTE must be updated

### Requirements
- `.planning/REQUIREMENTS.md` — CONVERT-01 must be added; INTENT-01 context is the predecessor

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/fork-intent-tag.test.cjs`: existing test already scans `commands/gsd/*.md` for bare `<task>` and `<objective>` — no new test logic needed, just fixing the source files
- Existing 47 already-converted files serve as reference for what `<intent>` content looks like

### Established Patterns
- Tag rename is purely structural: the content inside `<objective>...</objective>` blocks matches what `<intent>` blocks contain in converted files (one-liner describing what the command does and what workflow it runs)
- The test strips code fences before scanning — no risk of false positives from documentation examples

### Integration Points
- All 33 files are in `commands/gsd/` — the scope is bounded and enumerable
- `npm test` is the verification gate after conversion

</code_context>

<specifics>
## Specific Ideas

No specific requirements — the conversion approach is clear from the existing test and the 47 already-converted files.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 19-convert-objective-tags-to-intent-in-skill-files*
*Context gathered: 2026-04-28*
