# Phase 13: Agent Fixes - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Rewrite 6 specific bare "do not" directives in 4 agent files with affirmative replacements. Each violation has an exact line number in REQUIREMENTS.md. No structural changes to the files beyond the targeted lines; no new agent capabilities added.

Files in scope:
- `agents/gsd-assumptions-analyzer.md` — line 111
- `agents/gsd-code-fixer.md` — lines 138, 240, 344
- `agents/gsd-doc-verifier.md` — line 92
- `agents/gsd-user-profiler.md` — line 88

After edits, `npm test -- --test-name-pattern="agent-frontmatter"` must pass to confirm no YAML corruption.

</domain>

<decisions>
## Implementation Decisions

### FRAMING-01 — gsd-assumptions-analyzer.md:111
- **D-01:** Rewrite `- Do NOT generate more areas than the calibration tier specifies` to reference the existing `<calibration_tiers>` block already defined above in the same file. Do NOT inline the tier counts — direct the reader to the block (e.g., "Keep area count within the tier limit defined in `<calibration_tiers>` above").

### FRAMING-03 — gsd-code-fixer.md:240
- **D-02:** Delete the `- Do NOT create REVIEW-FIX.md` bullet entirely. It is redundant inside an exit block — the surrounding instruction already tells the agent to exit, which implies nothing is created.

### Remaining fixes (FRAMING-02, FRAMING-04, FRAMING-05, FRAMING-06)
- **D-03:** Apply straightforward affirmative rewrites per REQUIREMENTS.md guidance:
  - FRAMING-02 (code-fixer:138): Positive instruction to always apply the fix regardless of syntax checker availability.
  - FRAMING-04 (code-fixer:344): Positive instruction to commit all changes before continuing (rollback context).
  - FRAMING-05 (doc-verifier:92): Replace list header with affirmative equivalent (e.g., "Skip verification for the following:").
  - FRAMING-06 (user-profiler:88): Positive sequencing gate — load the rubric before proceeding to message analysis.

### Claude's Discretion
- Exact wording for FRAMING-02, FRAMING-04, FRAMING-06 within the affirmative-instruction constraint — the user has not prescribed word-for-word text for these; follow the REQUIREMENTS guidance and keep language consistent with the surrounding file style.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — FRAMING-01 through FRAMING-06 with exact line numbers and fix descriptions for each violation

### Agent files to edit
- `agents/gsd-assumptions-analyzer.md` — check `<calibration_tiers>` block (lines 39-56) before writing FRAMING-01 rewrite; the reference the rewrite must point to
- `agents/gsd-code-fixer.md` — read surrounding context at lines 135-145, 237-245, 341-350 before editing
- `agents/gsd-doc-verifier.md` — read surrounding list context at lines 88-100 before editing
- `agents/gsd-user-profiler.md` — read surrounding step context at lines 84-95 before editing

### Test
- `tests/negative-framing-scan.test.cjs` — DO NOT corpus scan; must stay green after all edits
- Run: `npm test -- --test-name-pattern="agent-frontmatter"` to verify YAML integrity

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `<calibration_tiers>` block in `agents/gsd-assumptions-analyzer.md` (lines 39-56) — the FRAMING-01 rewrite must reference this block, not duplicate it

### Established Patterns
- Positive framing style already used in the `<rules>` section of gsd-assumptions-analyzer.md (rules 1-8) — match that tone for rewrites
- REQUIREMENTS.md provides sample positive phrasings for FRAMING-05 ("Skip verification for the following:") and FRAMING-06 ("load rubric first, then proceed") — use these as style anchors for all rewrites

### Integration Points
- Test suite: `tests/negative-framing-scan.test.cjs` scans for remaining DO NOT violations — all 6 fixed lines must no longer match the scanner after editing

</code_context>

<specifics>
## Specific Ideas

- FRAMING-01: Exact shape of reference: "Keep area count within the tier limit defined in `<calibration_tiers>` above" (or equivalent — planner may adjust wording to fit the surrounding bullet style)
- FRAMING-03: Hard delete — no replacement text needed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-agent-fixes*
*Context gathered: 2026-04-22*
