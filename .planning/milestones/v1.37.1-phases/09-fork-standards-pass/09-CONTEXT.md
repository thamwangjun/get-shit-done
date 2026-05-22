# Phase 9: Fork Standards Pass - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply the fork's positive framing and XML structure standards to all 20 new prompt files added by v1.37.1 and to the subset of upstream-modified files where quality degraded during the merge. Phase 9 closes when every in-scope file passes the negative-framing scanner AND the PROMPT_ENGINEERING_GUIDE V09 quality bar, with no regressions in the full test suite.

Templates (`get-shit-done/templates/`) and bin files (`get-shit-done/bin/`) remain out of scope — established precedent from prior milestones.

</domain>

<decisions>
## Implementation Decisions

### Plan 01: New Files Standards Pass (20 files)

- **D-01:** Run the negative-framing scanner on all 20 new files first to confirm the baseline (currently green at 34/34). Then perform a full structural audit of each file against PROMPT_ENGINEERING_GUIDE V09 — not just framing, but XML block presence, context placement, priority ordering, persona, CoT gating, constraint pairing, and compression. Fix all quality gaps found.

- **D-02:** XML structure standard = full PROMPT_ENGINEERING_GUIDE V09 review. This is the highest bar and the same standard applied during the original improvement pass. Each of the 20 new files is reviewed against all V09 quality dimensions — not just the lightweight task→intent rename check.

The 20 new files in scope:
- commands/gsd: inbox.md, sketch.md, sketch-wrap-up.md, spec-phase.md, spike.md, spike-wrap-up.md
- get-shit-done/references: autonomous-smart-discuss.md, debugger-philosophy.md, mandatory-initial-read.md, project-skills-discovery.md, sketch-interactivity.md, sketch-theme-system.md, sketch-tooling.md, sketch-variant-patterns.md
- get-shit-done/workflows: sketch.md, sketch-wrap-up.md, spec-phase.md, spike.md, spike-wrap-up.md
- (get-shit-done/templates/spec.md is exempt)

### Plan 02: Modified Files Standards Pass (193 files)

- **D-03:** Use a diff-based triage approach rather than scanner-only. For each of the 193 upstream-modified files, compare the fork's pre-merge version (from `git log --diff-filter=M` or equivalent) to the post-merge state to detect framing or structural quality that was silently degraded. This catches cases where the scanner exempts a line (e.g., em-dash complement) but the underlying quality regressed. Fix only confirmed degraded files — scanner-first discovery still applies for scope.

The 5 refactored agents (gsd-debugger, gsd-planner, gsd-executor, gsd-verifier, gsd-phase-researcher) must be verified: their `<role>` block restructuring from Phase 7 must be preserved in the final state.

### Test Suite Gate

- **D-04:** No regressions gate. After all Phase 9 edits, `npm test` must return at least 4098/4112 (the current pass count). The negative-framing scanner must remain 34/34. Phase 9 is not responsible for advancing the 14-failure baseline — that belongs to Phase 10 — but Phase 9 edits must not decrease the count.

### Claude's Discretion

- Order in which the 20 new files are reviewed in Plan 01
- Specific V09 quality dimensions to prioritize within each file
- How to extract pre-merge file versions for the diff-based triage (git show, merge-base, etc.)
- Whether to group Plan 02 fixes by file category (agents, workflows, references) or process all together

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Fork Standards
- `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` — The V09 quality bar. Phase 9 applies this guide to all 20 new files. Read fully before auditing.
- `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` — The 8-step improvement process (task spec, XML structure, context placement, priority ordering, persona, CoT gating, constraint pairing, compression). Structural baseline for the audit.

### Scanner
- `tests/negative-framing-scan.test.cjs` — The fork's framing scanner. Currently passes 34/34. Must remain green after all Phase 9 edits.

### Phase Requirements
- `.planning/REQUIREMENTS.md` §Fork Standards — NEW-01 through NEW-20 and MOD-01 through MOD-04 define the per-file requirements for this phase.
- `.planning/ROADMAP.md` §Phase 9 — Success criteria with scanner verification commands and the 5-agent preservation check.

### Prior Phase Context
- `.planning/phases/07-merge-and-conflict-resolution/07-02-SUMMARY.md` §BASELINE FAILURES — Documents the 4 upstream-introduced failures; Phase 9 must not make these worse.
- `.planning/PROJECT.md` §Constraints — Frontmatter preservation rules, no `skills:` in agent frontmatter, positive framing replacement rule.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/negative-framing-scan.test.cjs` — Run directly (`node --test tests/negative-framing-scan.test.cjs`) to validate framing at any point during the pass. Currently 34/34.
- `npm test` — Full test suite gate. Must stay at or above 4098/4112 after all edits.

### Established Patterns
- **Positive framing replacement rule:** Negative directives (`NEVER X`, `DO NOT X`) are replaced with affirmative instructions specifying what to do instead — the replacement must name the correct behavior, not merely delete the prohibition.
- **Valid constraint pairs (scanner-exempt):** `DO NOT X — use Y instead` (em-dash), `DO NOT X (use Y)` (parenthetical with substance), `DO NOT X. Use Y.` (period + sentence). These are not violations.
- **V09 review precedent:** See `.planning/phases/` from v1.36.0 milestone for how prior structural audits were executed.

### Integration Points
- All edits go to: `agents/`, `commands/gsd/`, `get-shit-done/workflows/`, `get-shit-done/references/`
- `tests/agent-frontmatter.test.cjs` validates YAML frontmatter for all agents — frontmatter must not be touched during content edits
- `tests/agent-size-budget.test.cjs` — All 31 fork agents must stay within tier budgets after any expansions

</code_context>

<specifics>
## Specific Ideas

- The scanner is already green (34/34) entering Phase 9. This is the key asymmetry vs. the roadmap expectation — violations noted in the roadmap's success criteria are already handled (either via Phase 7 FORK-CORRUPTION triage or because they're valid constraint pairs the scanner exempts). Plan 01 opens with scanner confirmation, not scanner remediation.
- Diff-based triage for Plan 02: use `git show <merge-base>:<file>` or compare to a pre-merge commit to identify what actually changed in each of the 193 modified files.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 09-fork-standards-pass*
*Context gathered: 2026-04-18*
