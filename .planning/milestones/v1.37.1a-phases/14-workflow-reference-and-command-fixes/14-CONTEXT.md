# Phase 14: Workflow, Reference, and Command Fixes - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Rewrite 11 bare "do not" directives in workflow, reference, and command files with affirmative replacements, and update the one co-dependent test assertion in `tests/execute-phase-active-flags.test.cjs`. Each violation has an exact file path and line number in REQUIREMENTS.md.

Files in scope:
- `get-shit-done/workflows/analyze-dependencies.md` — line 100 (FRAMING-07)
- `get-shit-done/workflows/discuss-phase.md` — line 172 (FRAMING-08)
- `get-shit-done/workflows/execute-plan.md` — line 203 (FRAMING-09)
- `get-shit-done/workflows/import.md` — line 276 + list items below (FRAMING-10)
- `get-shit-done/workflows/transition.md` — lines 567–568 (FRAMING-11, FRAMING-12)
- `get-shit-done/workflows/verify-phase.md` — line 241 (FRAMING-13)
- `get-shit-done/references/planner-source-audit.md` — line 30 (FRAMING-14)
- `commands/gsd/docs-update.md` — line 42 (FRAMING-15)
- `commands/gsd/execute-phase.md` — line 54 (FRAMING-16)
- `commands/gsd/reapply-patches.md` — line 271 (FRAMING-17)
- `tests/execute-phase-active-flags.test.cjs` — line 50 (test update for FRAMING-16)

No structural changes beyond the targeted lines; no new capabilities added.

</domain>

<decisions>
## Implementation Decisions

### FRAMING-07 — analyze-dependencies.md:100
- **D-01:** Standard affirmative rewrite. `Do not reorder phases` → positive instruction to preserve phase order (e.g., "Preserve the existing phase order — relocate only the dependency field").

### FRAMING-08 — discuss-phase.md:172
- **D-02:** Standard affirmative rewrite. `Do not continue with the steps below` → positive stop instruction (e.g., "Stop here — power mode handles all remaining steps").

### FRAMING-09 — execute-plan.md:203
- **D-03:** Standard affirmative rewrite. `do not auto-fix pre-existing issues unrelated to current task` → positive scope boundary (e.g., "Scope auto-fixes to issues introduced by the current task only — leave pre-existing issues untouched").

### FRAMING-10 — import.md:276 + list items
- **D-04:** Convert the `Do NOT:` header AND all 7 list items below it to positive imperative form ("what to DO instead"). Style: positive imperative ("Use X format", "Apply Y pattern") not "omit/skip" framing. Example: "Use markdown tables..." → "Use plain-text [BLOCKER]/[WARNING]/[INFO] labels in the conflict detection report."

### FRAMING-11 — transition.md:567
- **D-05:** Delete the line entirely. No replacement. The `**Stop here.** The user must explicitly decide what to do next.` line that follows already covers the intent positively.

### FRAMING-12 — transition.md:568
- **D-06:** Delete the line entirely. No replacement. Same reason as FRAMING-11 — `**Stop here.**` covers it.

### FRAMING-13 — verify-phase.md:241
- **D-07:** Standard affirmative rewrite. `Do NOT invent example inputs` → positive instruction to source inputs from the codebase only (e.g., "Source inputs exclusively from actual test fixtures and codebase examples").

### FRAMING-14 — planner-source-audit.md:30
- **D-08:** Standard affirmative rewrite. `Do not flag these as MISSING:` → affirmative header (e.g., "Treat these as expected and exclude them from MISSING flags:").

### FRAMING-15 — commands/gsd/docs-update.md:42
- **D-09:** Standard affirmative rewrite. `Do not infer that a flag is active just because it is documented in this prompt` → `Treat a flag as active only if its literal token is present in \`$ARGUMENTS\``.

### FRAMING-16 — commands/gsd/execute-phase.md:54 + test
- **D-10:** Same rewrite as FRAMING-15 — apply identical phrasing for consistency: `Treat a flag as active only if its literal token is present in \`$ARGUMENTS\``.
- **D-11:** Update `tests/execute-phase-active-flags.test.cjs` line 50 assertion to assert the new positive text only: `content.includes('Treat a flag as active only if its literal token is present in \`$ARGUMENTS\`')`. Remove the old `Do not infer...` assertion string entirely — no transition safety net.

### FRAMING-17 — commands/gsd/reapply-patches.md:271
- **D-12:** Standard affirmative rewrite. `Do not proceed to cleanup until the user confirms they have resolved all unverified hunks.` → positive sequencing gate (e.g., "Proceed to Step 6 only after the user confirms all unverified hunks are resolved").

### Claude's Discretion
- Exact wording for FRAMING-07, FRAMING-08, FRAMING-09, FRAMING-13, FRAMING-14, FRAMING-17 within the affirmative-instruction constraint — keep language consistent with the surrounding file style.
- For FRAMING-10 list items, apply the most natural positive imperative for each item — exact phrasing not prescribed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — FRAMING-07 through FRAMING-17 with exact file paths, line numbers, and fix descriptions for each violation

### Workflow files to edit
- `get-shit-done/workflows/analyze-dependencies.md` — read lines 98–103 for surrounding context before FRAMING-07 edit
- `get-shit-done/workflows/discuss-phase.md` — read lines 169–175 for surrounding context before FRAMING-08 edit
- `get-shit-done/workflows/execute-plan.md` — read lines 200–207 for surrounding context before FRAMING-09 edit
- `get-shit-done/workflows/import.md` — read lines 273–285 for full `Anti-Patterns` block before FRAMING-10 edits
- `get-shit-done/workflows/transition.md` — read lines 562–575 for full stop block before FRAMING-11/12 deletions
- `get-shit-done/workflows/verify-phase.md` — read lines 238–245 for surrounding context before FRAMING-13 edit

### Reference files to edit
- `get-shit-done/references/planner-source-audit.md` — read lines 27–35 for surrounding context before FRAMING-14 edit

### Command files to edit
- `commands/gsd/docs-update.md` — read lines 39–46 for surrounding context before FRAMING-15 edit
- `commands/gsd/execute-phase.md` — read lines 50–58 for surrounding context before FRAMING-16 edit
- `commands/gsd/reapply-patches.md` — read lines 268–275 for surrounding context before FRAMING-17 edit

### Test file to update
- `tests/execute-phase-active-flags.test.cjs` — read lines 44–65 before updating line 50 assertion for FRAMING-16

### Corpus scanner (gate)
- `tests/negative-framing-scan.test.cjs` — run after all edits to verify no new violations introduced
- Run: `npm test 2>&1 | grep "execute-phase-active-flags"` to verify test passes after FRAMING-16 fix

</canonical_refs>

<code_context>
## Existing Code Insights

### Established Patterns
- Phase 13 applied the same affirmative-rewrite pass to agent files — same methodology applies here
- Conversion patterns documented in `.planning/research/VIOLATIONS.md` (affirmative conversion table at bottom)
- FRAMING-15 and FRAMING-16 are identical violations in parallel blocks — apply identical fix text for consistency

### Integration Points
- `tests/execute-phase-active-flags.test.cjs` asserts specific strings from `commands/gsd/execute-phase.md` — test and source file must be updated in the same plan to stay in sync

</code_context>

<specifics>
## Specific Ideas

- FRAMING-10: Convert the full `Anti-Patterns` block (header + all 7 list items) to positive imperative form, not just the header line
- FRAMING-11 + FRAMING-12: Delete both lines — no replacement text. `**Stop here.**` covers the intent.
- FRAMING-16 test: Assert new positive text only (`Treat a flag as active only if its literal token is present in \`$ARGUMENTS\``) — no transition safety net with the old string

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 14-workflow-reference-and-command-fixes*
*Context gathered: 2026-04-22*
