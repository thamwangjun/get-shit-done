# Phase 66: Citation Cleanup - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove all issue/PR citations from 45 Markdown files across 5 scoped directories (`commands/`, `get-shit-done/workflows/`, `agents/`, `get-shit-done/references/`, `get-shit-done/templates/`), so that the Phase 65 guard test `tests/no-issue-citations.test.cjs` passes GREEN and every cleaned sentence reads naturally.

Deliverables:
1. 45 Markdown files cleaned of all citation forms (`#NNN`, parenthetical `(#NNN)`, `feat-NNNN`)
2. Guard test `tests/no-issue-citations.test.cjs` passing GREEN (0 failures)
3. `agent-frontmatter.test.cjs` passing with same count as before Phase 66

Scope is fixed: the same 5 dirs as Phase 65. YAML frontmatter blocks and fenced code blocks are excluded from cleanup (they are excluded from the guard test by design).

</domain>

<decisions>
## Implementation Decisions

### Cleanup Approach
- **D-01:** Executor agent per file — not a script. The prose repair needed (contextual rewriting, connector cleanup) requires agent judgment, not regex-only automation.
- **D-02:** No new `scripts/remove-citations.cjs` is written. The cleanup is done by an executor agent reading each file and making targeted edits.

### Plan Structure
- **D-03:** 5 plans, one per scoped directory: `commands/`, `get-shit-done/workflows/`, `agents/`, `get-shit-done/references/`, `get-shit-done/templates/`. This gives granular rollback if a directory's cleanup introduces a problem.
- **D-04:** Each plan's executor handles all failing files in that directory. The guard test is run after each plan to confirm no regressions.

### Sentence Repair Depth
- **D-05:** Contextual repair — rewrite the surrounding clause so it flows naturally. Connectors (`—`, `,`, `see`, `by`, `in`, `from`) that have nothing to point to after citation removal are also removed. The goal is sentences that read as if the citation was never there.
- **D-06:** If a clause exists solely to cite an issue number (e.g., `(see #1486)`, `— #2015`) and has no independent informational content beyond the reference, drop the entire clause. If the clause has independent meaning beyond the citation, keep the prose and strip only the citation token.
- **D-07:** Keep the rationale/explanation when it has independent meaning. E.g., "prevents destructive HEAD-on-master recovery" is kept — only the `(#2924)` citation is dropped.

### Exclusions (locked from Phase 65)
- **D-08:** YAML frontmatter blocks (lines between opening and closing `---` at line 1) are excluded — do not touch these.
- **D-09:** Fenced code blocks (triple-backtick fences) are excluded — do not touch citations inside code examples.
- **D-10:** Allowlist: `#1`, `#2`, `#45`, `#123` are illustrative placeholders — do not remove these. Hex colors (`#e8c170`, `#22c55e`, etc.) and heading markers (`##`) are not citations — do not touch them.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 65 Guard Test (primary success gate)
- `tests/no-issue-citations.test.cjs` — The guard test that must pass GREEN after Phase 66. Read this to understand detection regexes, allowlist values, and exclusion logic.

### Phase 64 Findings (citation inventory)
- `.planning/phases/64-citation-pattern-exploration/64-FINDINGS.md` — 103-hit findings table listing every citation by file:line. Use this as the cleanup target list. Files with citations that are NOT in the guard test's 45-file failing list may already be exempt (code blocks, frontmatter).

### Phase 65 Context (exclusion decisions)
- `.planning/phases/65-guard-test-red/65-CONTEXT.md` — D-04 through D-11 define the allowlist and exclusion logic that the guard test implements. The cleanup must respect the same rules.

### Milestone Requirements
- `.planning/REQUIREMENTS.md` — CITE-06, CITE-07, CITE-08, CITE-09 define Phase 66 acceptance criteria.
- `.planning/ROADMAP.md` §Phase 66 — Goal, success criteria, 4 specific pass/fail conditions.

### Frontmatter Safety Gate
- `tests/agent-frontmatter.test.cjs` — Must pass with same count before and after Phase 66. Run this after cleanup to confirm no YAML frontmatter was accidentally modified.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/no-issue-citations.test.cjs` — Run this after editing each file to verify a clean result: `node --test tests/no-issue-citations.test.cjs 2>&1 | grep "✖"`.
- `scripts/normalize-step-numbers.cjs` — Structural analog for in-place file cleanup scripts (not used here, but illustrates the project's cleanup script pattern for reference).

### Established Patterns
- Cleanup phases in this project edit files in-place via executor agent Edit calls — no intermediate temp files.
- Commit strategy: one atomic commit per plan after all files in that plan are clean.
- `npm test` runs all `tests/*.test.cjs` automatically — the guard test is included.

### Integration Points
- The guard test's `SCAN_DIRS` and exclusion logic define exactly what "clean" means. Any file not in the 45-failure list is already clean or exempt.

### Failing Files by Directory (45 total)
**commands/gsd/ (9 files):**
`config.md`, `graphify.md`, `ns-context.md`, `ns-ideate.md`, `ns-manage.md`, `ns-project.md`, `ns-review.md`, `ns-workflow.md`, `plan-phase.md`

**get-shit-done/workflows/ (17 files):**
`add-backlog.md`, `ai-integration-phase.md`, `discuss-phase.md`, `discuss-phase/modes/advisor.md`, `discuss-phase/modes/chain.md`, `discuss-phase/templates/context.md`, `execute-phase/steps/codebase-drift-gate.md`, `execute-phase/steps/per-plan-worktree-gate.md`, `execute-plan.md`, `forensics.md`, `help/modes/full.md`, `ingest-docs.md`, `new-milestone.md`, `new-project.md`, `plan-phase.md`, `quick.md`, `reapply-patches.md`, `settings-integrations.md`, `settings.md`, `update.md`, `verify-phase.md`

**agents/ (6 files):**
`gsd-code-fixer.md`, `gsd-codebase-mapper.md`, `gsd-executor.md`, `gsd-intel-updater.md`, `gsd-plan-checker.md`, `gsd-verifier.md`

**get-shit-done/references/ (10 files):**
`checkpoints.md`, `git-integration.md`, `model-profiles.md`, `mvp-concepts.md`, `planner-graphify-auto-update.md`, `planner-human-verify-mode.md`, `planning-config.md`, `scout-codebase.md`, `thinking-partner.md`, `worktree-path-safety.md`

**get-shit-done/templates/ (3 files — confirm via guard test):**
*(Verify by running guard test — templates/ failures not explicitly listed in Phase 64 findings)*

</code_context>

<specifics>
## Specific Ideas

- After each plan's edits, the plan executor should run `node --test tests/no-issue-citations.test.cjs 2>&1 | grep "✖"` to confirm the directory's files are now clean before committing.
- Run `node --test tests/agent-frontmatter.test.cjs` after all 5 plans complete to confirm the frontmatter count is unchanged.
- `get-shit-done/workflows/execute-plan.md` line 111 is a dense multi-citation paragraph — the most complex cleanup case. The executor should handle this by removing all `#NNN` citations and their surrounding connectors/parentheticals while preserving the technical instructions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 66-Citation Cleanup*
*Context gathered: 2026-06-09*
