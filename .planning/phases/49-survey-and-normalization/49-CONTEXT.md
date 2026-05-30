# Phase 49: Survey and Normalization - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Produce a cross-file step reference index (MAP-01), then rename every decimal and letter-suffix step label across all in-scope prompt content files to sequential whole integers. Same-file cross-references and co-located test assertions are updated in the same commit as each file rename. Cross-file prose references (e.g., `execute-plan.md`'s references to `execute-phase.md step 5.5`) are updated in a separate commit after all source file renames are complete. Phase 48 scanner goes GREEN.

**In scope:** `agents/`, `commands/gsd/`, `get-shit-done/workflows/` — exact same dirs as `tests/step-numbering-scan.test.cjs`
**Out of scope:** Pattern C files (`plan-phase.md`, `new-milestone.md`, `new-project.md`), `get-shit-done/references/`, `get-shit-done/templates/`, `sdk/`, `tests/` source

</domain>

<decisions>
## Implementation Decisions

### Letter-Suffix Sub-Steps (overrides Phase 48 D-09)
- **D-01:** Letter-suffix steps ARE violations and MUST be renumbered to sequential whole integers. This overrides Phase 48 CONTEXT.md D-09 which said execute-phase.md's Step 7.0–7.3 should become "lettered branches (7a, 7b, etc.)". All letter-suffix steps (Step 2a, 2b, 2c, Step 3b, Step 4b, Step 7b, Step 7c, Step 9b, Step 5a, Step A, Step B, etc.) are renamed to sequential whole integers in original order.
- **D-02:** After renaming, `agent-frontmatter.test.cjs` assertions for `Step 4b: Data-Flow Trace` and `Step 7b: Behavioral Spot-Checks` (in gsd-verifier.md) MUST be updated to reference the new whole-integer step labels. These are co-located test assertions — they are updated in the same commit as the gsd-verifier.md rename.

### Commit Strategy (overrides ROADMAP success criteria #4)
- **D-03:** Renames and cross-file references are in DIFFERENT commits. Source file rename commits are atomic (rename file + same-file cross-references + co-located test assertions). Cross-file prose reference updates (e.g., `execute-plan.md` references to `execute-phase.md step 5.5`, `autonomous.md` reference to `step 5.8`) happen in a separate final commit after all source renames are complete.
- **D-04:** MAP-01 cross-file reference index is produced FIRST (read-only survey plan) before any renaming begins.

### Plan Granularity
- **D-05:** One plan per violating source file. Each plan is atomic: rename that one file, update its same-file cross-references, update its co-located test assertions. The MAP-01 survey and the final cross-file refs update are each their own plans.

### out-of-order Fix for discuss-phase-assumptions.md
- **D-06 (Claude's discretion):** `discuss-phase-assumptions.md` has two independent Step 1/2/3 sequences without a section heading between them. Fix by adding a markdown section heading (`###`) before the second Step 1 group so the scanner's per-section step counter resets. Minimal content change — no renumbering of steps needed for this file. The section heading content is Claude's choice.

### Claude's Discretion
- MAP-01 index format and storage location within `.planning/phases/49-survey-and-normalization/` (Markdown table or JSON, Claude decides)
- Exact new step numbers for each file (sequential whole integers starting from Step 1, per section)
- Whether discuss-phase-assumptions.md's fix is a standalone plan or bundled with another file's plan

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scanner (the GREEN target)
- `tests/step-numbering-scan.test.cjs` — the Phase 48 scanner; all corpus subtests must pass GREEN after Phase 49; read it to understand exactly what patterns are detected and which files currently fail

### Violation Inventory (current scanner failures — 15 files)
Files with actual decimal/letter-suffix step HEADINGS (need rename plans, one plan per file):
1. `agents/gsd-intel-updater.md` — Step 6.5
2. `agents/gsd-phase-researcher.md` — Step 1.3, 1.5, 2.5, 2.6
3. `agents/gsd-verifier.md` — Step 2a, 2b, 2c, 3b, 4b, 7b, 7c, 9b (letter-suffix)
4. `get-shit-done/workflows/execute-phase.md` — Step 7.0, 7.1, 7.2, 7.3 (Pattern A/B) + ordered-list items 2.5., 5.5., 5.6., 5.7., 5.8. (Pattern D)
5. `get-shit-done/workflows/execute-phase/steps/post-merge-gate.md` — Step A, Step B (letter-suffix)
6. `get-shit-done/workflows/plan-review-convergence.md` — `step 5a` (prose reference to own step)
7. `get-shit-done/workflows/progress.md` — Step 1.5, 1.6, 2.5, 4.5, 4.75, 5.5, 5.6, 6.25, 6.5
8. `get-shit-done/workflows/quick.md` — Step 2.5, 4.5, 4.75, 5.5, 5.6, 6.25, 6.5
9. `get-shit-done/workflows/reapply-patches.md` — Step 2a, 2b, 2c (letter-suffix)
10. `commands/gsd/graphify.md` — Step 5a (letter-suffix)
11. `get-shit-done/workflows/discuss-phase-assumptions.md` — out-of-order (structure fix, see D-06)

Files with only cross-file prose references (go in the final cross-file refs plan):
- `get-shit-done/workflows/execute-plan.md` — 3 prose refs to `execute-phase.md step 5.5` (lines 143, 369, 475)
- `get-shit-done/workflows/autonomous.md` — prose refs to `step 3a`, `step 3a.5`
- `get-shit-done/workflows/profile-user.md` — prose refs to `step 4a`, `step 4b`
- `get-shit-done/workflows/execute-phase/steps/post-merge-gate.md` — also has prose ref to `step 5.8` (cross-file ref update after execute-phase.md rename)

### Test Files with Co-Located Assertions (must update in same commit as source file rename)
- `tests/quick-branching.test.cjs` — asserts `Step 2.5: Handle quick-task branching` in `quick.md`
- `tests/bug-2432-quick-plan-predispatch-commit.test.cjs` — asserts `Step 5.5`, `Step 5.6`, `Step 6` ordering in `quick.md`
- `tests/execute-phase-step-5-5-deviation-doc.test.cjs` — entire test is about step 5.5 in `execute-phase.md`; test file name and assertions need updating
- `tests/agent-frontmatter.test.cjs` — asserts `Step 4b: Data-Flow Trace` and `Step 7b: Behavioral Spot-Checks` in `gsd-verifier.md`; and `Step 2.6: Environment Availability Audit` in `gsd-phase-researcher.md`

### Project Context
- `.planning/ROADMAP.md` §Phase 49 — success criteria; note D-03 overrides success criterion #4 (cross-file refs now in separate commit)
- `.planning/REQUIREMENTS.md` — MAP-01 and NORM-01 requirement definitions
- `.planning/phases/48-tdd-red-gate/48-CONTEXT.md` — Phase 48 decisions; D-01 above overrides D-09 from this file

### Canonical Scanner Pattern
- `tests/negative-framing-scan.test.cjs` — the scanner test structure template (file collection, per-directory describe blocks, code-fence skip)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/negative-framing-scan.test.cjs` — direct structural template for understanding the scanner pattern; Phase 48 mirrored it exactly
- `tests/step-numbering-scan.test.cjs` — the scanner to turn GREEN; read it to understand `scanContent()`, `scanForOutOfOrder()`, and the file collection pattern before deciding renumbering strategy per file

### Established Patterns
- Per-section step counter reset: scanner resets the step counter on `##` or `###` markdown headings — adding a heading before an independent step sequence is a valid structural fix (used for discuss-phase-assumptions.md D-06)
- Code-fence exclusion: scanner skips content inside ` ``` ` fences — steps inside code blocks are never violations
- Same-file cross-reference pattern: after renaming `Step 5.5` to `Step 6`, grep the same file for prose like "step 5.5", "Step 5.5", "5.5 step" and update them in the same commit

### Integration Points
- `tests/` files reference step labels by string match (`indexOf('Step 2.5: ...')`) — string match assertions must be updated to the new whole-integer label
- `tests/execute-phase-step-5-5-deviation-doc.test.cjs` filename itself encodes the old step number — the file likely needs renaming after execute-phase.md step 5.5 is renamed; verify whether the test infrastructure cares about filenames
- `execute-plan.md` references to `execute-phase.md step 5.5` need updating after execute-phase.md's rename — cross-file refs plan handles this

</code_context>

<specifics>
## Specific Ideas

- One plan per source file — each plan is a single atomic commit (rename + same-file refs + test assertions for that file)
- MAP-01 survey plan is the first plan — read-only, produces the cross-file reference index before any renaming
- Final plan is cross-file refs — updates execute-plan.md, autonomous.md, profile-user.md, and post-merge-gate.md's cross-file prose references after all source file renames are done

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 49-Survey and Normalization*
*Context gathered: 2026-05-30*
