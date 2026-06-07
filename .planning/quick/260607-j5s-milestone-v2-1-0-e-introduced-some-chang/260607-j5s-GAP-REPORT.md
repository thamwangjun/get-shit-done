# v2.1.0-e Prompt File Changes — Testing Gap Report

**Generated:** 2026-06-07
**Scope:** All `.md` prompt files (agents/, commands/gsd/, get-shit-done/workflows/) changed between `v2.1.0-a` and `v2.1.0-e`

---

## Summary

Coverage for the v2.1.0-e milestone is strong for the high-volume structural changes (Eta include
conversions, `@.planning/` conversions, effort wiring for Group A and B workflows, `effort=`
keyword prefix fixes, and null-omit comments). Three behavioral gaps remain open. The highest
priority gap (GAP-E) is a silent regression risk: eight workflows added effort wiring in quick task
260606-vf5 but none of them have regression tests in `tests/phase-56-effort-wiring.test.cjs`.
The other two gaps are medium and low priority respectively — the medium gap (GAP-H) concerns a
new guard branch in `gsd-executor.md` that could silently fire in submodule contexts if regressed,
and the low-priority gaps (GAP-K, GAP-L) are prose-quality changes with no behavioral test
(human review would catch regression). Two additional documentation gaps (GAP-M1, GAP-M2) exist
in test file comments but do not affect behavioral correctness.

---

## GAPS

| Gap ID | Changed File(s) | What Changed | Covering Test (if any) | Gap Type | Priority |
|--------|-----------------|--------------|------------------------|----------|----------|
| GAP-E | `get-shit-done/workflows/audit-fix.md`, `diagnose-issues.md`, `code-review.md`, `code-review-fix.md`, `explore.md`, `import.md`, `ingest-docs.md`, `discuss-phase-assumptions.md` | 8 workflows gained `resolve-model-effort` calls and `effort={..._model_effort_arg}` interpolation in Agent() spawns (quick task 260606-vf5) | None — `tests/phase-56-effort-wiring.test.cjs` contains zero entries for any of these 8 workflows | Type 1: No regression test exists | **High** |
| GAP-H | `agents/gsd-executor.md` | Pre-commit HEAD safety block now distinguishes worktree (`.git` file containing `gitdir:.../.git/worktrees/...`) from submodule (`.git` file containing `gitdir:.../.git/modules/...`); guard fires only for worktrees. The `GIT_CONTENT` / `modules.*gitdir` branch is new. | `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` tests cwd-drift detection but does NOT assert the submodule exclusion path | Type 2: Test exists but does not assert the new behavior | **Medium** |
| GAP-K | `agents/gsd-debugger.md` | Security prompt paragraph rewritten from one sentence referencing `DATA_START`/`DATA_END` markers to a hardened multi-line paragraph using "untrusted user input" and "treat every byte...as evidence data only." Test asserting `DATA_START` in the debugger was explicitly skipped ("fork intentionally diverges from upstream contract"). | `tests/debug-session-management.test.cjs` line 133: skipped. `tests/prompt-injection-scan.test.cjs` scans for injection IN files, not for the presence of a guard. | Type 4: Content/behavior gap (prompt text changed but no behavioral test) | **Low** |
| GAP-L | `agents/gsd-user-profiler.md` | `load_rubric` step rewritten from "Read the user-profiling reference document at `~/.claude/...`" to "The user-profiling rubric is included above in the `<reference>` block." (Reflects that Eta inlining now embeds the rubric.) | No test asserts the step text content. `tests/install-eta-regression.test.cjs` covers rubric inlining but not the step wording accuracy. | Type 4: Content/behavior gap (prompt text changed but no behavioral test) | **Low** |
| GAP-M1 | `tests/step-numbering-scan.test.cjs` | Module-level comment at lines 18–24 lists `gsd-phase-researcher.md (Step 1.3, 1.5, 2.5, 2.6)` and `gsd-intel-updater.md (Step 6.5)` as "Phase 48 RED expectation" failures. These steps were fixed in v2.1.0-e; the comment is stale and misleading. Not a behavioral gap — scanner logic is dynamic. | N/A (documentation in a test file) | Type 4: Content/behavior gap (stale comment in test file) | **Low** |
| GAP-M2 | `tests/debug-session-management.test.cjs` | Test at line 133 that checked for `DATA_START` in `gsd-debugger.md` is marked `skip: 'fork intentionally diverges from upstream contract'`. The fork's replacement paragraph ("untrusted user input") is not asserted anywhere. | N/A — the test is the documentation gap | Type 2: Test exists but does not assert the new behavior | **Low** |

---

## COVERED — Adequate Coverage Categories

| Category | Change Description | Tests Covering It | Status |
|----------|--------------------|-------------------|--------|
| A | Eta include conversions (`@~/...` → `<%~ include(...) %>`) in 9 agents and workflow files | `tests/install-eta-regression.test.cjs` (full-install walk), `tests/bug-phase45-eta-wiring.test.cjs` (INTG-02, INTG-03, INTG-06), `tests/eta-template-syntax.test.cjs` | COVERED |
| B | `@.planning/X` → `!cat .planning/X` conversion in `agents/gsd-planner.md` | `tests/bug-phase45-eta-wiring.test.cjs` INTG-03 scans agents/ for bare-line `@.planning/` | COVERED |
| C | Effort wiring — Group A init-fed workflows (execute-phase, execute-plan, plan-phase, quick, new-project, new-milestone, verify-work, map-codebase) | `tests/phase-56-effort-wiring.test.cjs` GAP A section, one test per workflow | COVERED |
| D | Effort wiring — Group B standalone-resolve workflows (audit-milestone, scan, secure-phase, ui-phase, ui-review, validate-phase, discuss-phase/modes/advisor, debug, gsd-debug-session-manager, docs-update) | `tests/phase-56-effort-wiring.test.cjs` GAP B section | COVERED |
| F | `effort=` keyword prefix fix — bare `{*_effort_arg}` tokens in Agent() calls got `effort=` prefix | `tests/bare-effort-arg-scan.test.cjs` scans all three dirs, fails on any bare token | COVERED |
| G | Null-omit comments — standalone `effort={*_effort_arg}` lines inside Agent() calls got `# omit this line when` comment | `tests/null-omit-comment-scan.test.cjs` scans all three dirs | COVERED |
| I | `gsd-executor.md` final_commit positive rephrasing — "Do not fall back to raw git add..." → "When the SDK returns `skipped: true`, accept the skip and move on." | `tests/bug-3678-executor-commit-docs-respect.test.cjs` A1 (checks for `committed: false` and `skipped: true` strings, which remain present in new wording) | COVERED |
| J | Step renumbering in `gsd-phase-researcher.md`, `gsd-intel-updater.md`, `gsd-verifier.md` — decimal/letter-suffix labels fixed to whole integers | `tests/step-numbering-scan.test.cjs` (dynamic scanner — fails if decimal/letter-suffix steps return) | COVERED (by scanner) |

---

## Recommended Next Tasks

### GAP-E (High) — Add effort wiring tests for 8 Group B workflows from quick task 260606-vf5

Create a new quick task to extend `tests/phase-56-effort-wiring.test.cjs` with one test per
missing workflow:

- `audit-fix.md` — assert `resolve-model-effort gsd-executor` and `effort={executor_model_effort_arg}`
- `diagnose-issues.md` — assert `resolve-model-effort gsd-debugger` and `effort={debugger_model_effort_arg}`
- `code-review.md` — assert `resolve-model-effort gsd-code-reviewer` and `effort={code_reviewer_model_effort_arg}`
- `code-review-fix.md` — assert `resolve-model-effort gsd-code-fixer` / `gsd-code-reviewer` and effort args
- `explore.md` — assert `resolve-model-effort gsd-phase-researcher` and `effort={phase_researcher_model_effort_arg}`
- `import.md` — assert `resolve-model-effort gsd-plan-checker` and `effort={plan_checker_model_effort_arg}`
- `ingest-docs.md` — assert `resolve-model-effort gsd-doc-synthesizer` / `gsd-roadmapper` and effort args
- `discuss-phase-assumptions.md` — assert `resolve-model-effort gsd-assumptions-analyzer` and `effort={assumptions_analyzer_model_effort_arg}`

**Impact:** Prevents silent regression where effort drops to null (not visible at spawn time).

### GAP-H (Medium) — Add submodule exclusion test to worktree safety test file

Extend `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` with a test that:
- Constructs a mock `.git` file containing `gitdir: /path/.git/modules/mymod` (submodule pattern)
- Reads the executor's pre-commit HEAD block
- Asserts the guard logic would NOT apply for the submodule case (the `GIT_CONTENT` / `modules.*gitdir` branch should short-circuit the worktree guard)

**Impact:** Prevents a regression that would re-apply the HEAD guard to submodule contexts,
potentially halting valid commits in mono-repos with submodules.

### GAP-K (Low) — Assert new debugger security guard paragraph text

Create a test (or un-skip / update the existing skipped test in `tests/debug-session-management.test.cjs`)
that asserts `gsd-debugger.md` contains "untrusted user input" or "treat every byte" — the new
hardened security paragraph language replacing the old `DATA_START` reference.

**Impact:** Prevents undetected regression to the old security framing (caught only by human review currently).

### GAP-L (Low) — Assert gsd-user-profiler load_rubric step text accuracy

Add a test in or near `tests/agent-skills.test.cjs` or a new file that asserts
`agents/gsd-user-profiler.md` contains the phrase "included above in the `<reference>` block"
(or equivalent) in its rubric-loading step, confirming the Eta-inlined rubric is correctly
referenced in the agent's instructions.

**Impact:** Prevents regression where the step text diverges from the actual rubric delivery
mechanism (caught only by human review currently).

### GAP-M1 (Low) — Update stale comment in step-numbering-scan.test.cjs

Update the module-level comment in `tests/step-numbering-scan.test.cjs` lines 18–24 to remove
the "Phase 48 RED expectation" list (the steps were fixed in v2.1.0-e) and replace with a note
that the scanner is now green by design (no fixed file list expected to fail).

**Impact:** Documentation quality — prevents future developer confusion about scanner intent.
