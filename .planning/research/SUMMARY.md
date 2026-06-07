# Project Research Summary

**Project:** v2.1.0-f Testing Coverage Gaps
**Domain:** Test coverage gap closure — GSD prompt-engineered fork
**Researched:** 2026-06-07
**Confidence:** HIGH

## Executive Summary

Milestone v2.1.0-f is a focused test-coverage closure sprint targeting six gaps identified in the v2.1.0-e gap report. All six gaps are table stakes — none are optional or deferrable. The work is entirely additive test code: four existing test files receive new `test()` blocks or a single line edit, one receives a comment deletion, and none require new files, new imports, new dependencies, or changes to agent or workflow source files. The v2.1.0-e baseline stands at `npm test` 8,243 pass / 8,255 total; v2.1.0-f target is that same suite plus the new tests passing.

The recommended approach is a five-step sequence: start with the zero-risk comment deletion (GAP-M1), then add the 8 Group B effort-wiring tests (GAP-E), the submodule exclusion assertion (GAP-H), the user-profiler rubric assertion (GAP-L), and finally the combined skip-removal and assertion rewrite that closes both GAP-K and GAP-M2 in one physical edit. The sequence front-loads risk-free changes so a green baseline is confirmed before the single mutation that changes test status from skipped to active. Every pattern required already exists in the test files being extended — no new test idioms are introduced.

The principal risk is incorrect assertion content. Two gaps (GAP-K/M2 and GAP-H) involve skipped or content-mismatched tests where naively un-skipping would produce hard failures rather than passes. Mitigation is mechanical: grep the target file for the exact substring before writing the `content.includes()` call; scope GAP-H assertions within the `<task_commit_protocol>` XML block slice (not the full file); and replace GAP-K/M2's stale `DATA_START` assertion body with the fork's actual security language (`untrusted user input`, `evidence data only`) rather than simply removing the skip option.

## Key Findings

### Recommended Stack

All six gaps are closable with the existing Node.js built-in test APIs already imported in every target file. No new packages, no changes to `package.json`, no new helpers in `tests/helpers.cjs`. The runtime is Node.js 24.14.1 (all APIs stable and identical to Node.js 22 minimum).

**Core technologies:**
- `node:test` (`describe`, `test`) — test structure; all new tests use the flat `describe` + `test` convention already established in each target file
- `node:assert/strict` (`assert.ok`) — sole assertion form required; all content-presence checks are boolean `content.includes(...)` expressions
- `node:fs` (`fs.readFileSync`) — synchronous file read; GAP-E uses the existing `read(rel)` wrapper in `phase-56-effort-wiring.test.cjs`; other gaps read inline with `process.cwd()` path convention

### Expected Features

All 6 gaps are table stakes. Feature dependencies are minimal.

**Must have (table stakes — all of v2.1.0-f):**
- GAP-E: 8 new test entries in `phase-56-effort-wiring.test.cjs` for Group B workflows — regression guard for effort wiring added in v2.1.0-e Phase 56; assert both `resolve-model-effort <agent>` and `<agent>_model_effort_arg` for each workflow
- GAP-H: 1 new submodule-exclusion test in `bug-3097-3099-executor-worktree-path-safety.test.cjs` — guards the worktree/submodule disambiguation logic in `gsd-executor.md`; scope assertions within `<task_commit_protocol>` block slice
- GAP-K + GAP-M2 (one physical edit): replace skipped `DATA_START` test at lines 133–139 of `debug-session-management.test.cjs` with live assertions for fork's security language (`untrusted user input`, `evidence data only`)
- GAP-L: 1 new describe block in `debug-session-management.test.cjs` asserting `gsd-user-profiler.md` load_rubric step references the Eta-inlined rubric via `<reference>` block
- GAP-M1: Delete stale Phase 48 RED expectation comment (lines 18–26) from `step-numbering-scan.test.cjs` JSDoc; no test count change

**Defer (v2+):**
- Additional effort-wiring snapshot coverage beyond Group B
- Runtime execution tests for worktree/submodule guard (currently source-text assertions only)

**Anti-features to reject:**
- Assertions that `gsd-debugger.md` does NOT contain `DATA_START` — negative assertions are fragile; assert the fork's replacement language instead
- Assertions against `DATA_START` in `debug.md` or `gsd-debug-session-manager.md` — both files legitimately contain `DATA_START` for specialist dispatch boundaries
- New test files outside `tests/` — all tests live in `tests/*.test.cjs`

### Architecture Approach

The architecture is strictly additive: four test files are extended, one receives a comment deletion, and zero agent or workflow files are changed. All new test content follows established file-local patterns with no cross-file shared state and no new helpers.

**Major components (test files modified):**
1. `tests/phase-56-effort-wiring.test.cjs` — receives 8 new `test()` blocks inside the existing GAP B `describe` block; uses the existing `read(rel)` helper; asserts both `resolve-model-effort <agent>` and `<agent>_model_effort_arg` for each of the 8 Group B workflows
2. `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` — receives 1 new `describe` + 1 `test` after line 103; reads from the already-loaded `executorSrc` module-level constant; slices within `<task_commit_protocol>` block boundaries
3. `tests/debug-session-management.test.cjs` — receives two changes: (a) lines 133–139 overwritten to remove skip and replace `DATA_START` assertion with fork security language (GAP-K/M2 combined), and (b) a new `describe('gsd-user-profiler agent content guards')` block appended at end of file (GAP-L)
4. `tests/step-numbering-scan.test.cjs` — lines 18–26 (Phase 48 RED expectation comment) deleted from JSDoc; test count and behavior unchanged

**Key placement decision for GAP-L:** `debug-session-management.test.cjs` rather than a new file, because that file already carries the `allow-test-rule: pending-migration-to-typed-ir` comment permitting source-text assertions on prompt content files, and all required imports (`fs`, `path`, `process.cwd()` convention) are already present.

### Critical Pitfalls

1. **GAP-K/M2: Un-skipping without replacing the assertion body causes immediate hard failure** — the fork's `gsd-debugger.md` does not contain `DATA_START`; it contains `"untrusted user input"` and `"evidence data only"`. Removing `{ skip: '...' }` from line 133 while keeping `content.includes('DATA_START')` produces `FAIL`, not a pass. Replace both the skip option and the assertion body in one edit.

2. **GAP-E: Multi-agent workflows need assertions for all spawn sites** — `code-review-fix.md` resolves two effort variables (`code_fixer_model_effort_arg` and `code_reviewer_model_effort_arg`); `ingest-docs.md` resolves `doc_synthesizer_model_effort_arg` and `roadmapper_model_effort_arg`. Assert every unique `_model_effort_arg` variable per workflow. Keep `const content = read(...)` inside each individual `test()` block to prevent copy-paste errors where the wrong agent name is asserted for the wrong file.

3. **GAP-H: Scope assertions within the `<task_commit_protocol>` XML block slice, not the full file** — `worktrees/` and `submodule` appear in documentation text elsewhere in `gsd-executor.md`. A full-file search passes vacuously if the guard logic is moved out of the protocol block. Slice from `executorSrc.indexOf('<task_commit_protocol>')` to `executorSrc.indexOf('</task_commit_protocol>')` before searching. Assert the worktree-positive condition (`.git/worktrees/`) and the skip-branch (`GIT_CONTENT=` or `skip worktree guards`) — not comment-only text.

4. **GAP-M1: Removing one line too many breaks the test file silently** — lines 18–26 end immediately before the `'use strict'` / `require()` declarations at line 28. Deleting into line 27 produces a parse error that causes 0 tests to run from the file (no explicit failure, just missing). Run `node --test tests/step-numbering-scan.test.cjs` after the edit and confirm the count is unchanged.

5. **GAP-L: Assert the precise rubric filename, not a generic word** — `content.includes('include')` and `content.includes('rubric')` both match unrelated text in `gsd-user-profiler.md`. Use two separate `assert.ok()` calls: `content.includes('<step name="load_rubric">` and `content.includes('user-profiling.md')`.

## Implications for Roadmap

Based on research, the build order front-loads risk-free changes to establish a green baseline before the single mutation that changes test status.

### Phase 1: GAP-M1 — Comment Deletion
**Rationale:** Zero behavioral risk; confirms file tooling and the test runner are working before any substantive changes. A green baseline after this step validates the environment.
**Delivers:** Removal of stale Phase 48 RED expectation comment (lines 18–26) from `step-numbering-scan.test.cjs` JSDoc. Test count unchanged, suite still green.
**Addresses:** GAP-M1
**Avoids:** Pitfall M1-1 — run `node --test tests/step-numbering-scan.test.cjs` after edit to confirm count is unchanged; verify the remaining file starts with `'use strict'` or `const { describe, test }` immediately after the removed block.

### Phase 2: GAP-E — Effort Wiring Tests (8 Group B Workflows)
**Rationale:** Highest line count but lowest assertion risk — the wiring already exists in all 8 workflow files; every new test passes immediately. Pure additions to `phase-56-effort-wiring.test.cjs` with no shared state mutations.
**Delivers:** 8 new passing subtests (10 assertions total for the two multi-agent workflows). Regression guard for all Group B effort wiring added in v2.1.0-e Phase 56.
**Addresses:** GAP-E
**Avoids:** Pitfall E-2 (assert all `_model_effort_arg` variables per multi-agent workflow); Pitfall E-3 (keep `read()` call inside each individual test block, not lifted to describe scope).

### Phase 3: GAP-H — Submodule Exclusion Assertion
**Rationale:** Appends a new `describe` + `test` to `bug-3097-3099-executor-worktree-path-safety.test.cjs`. Reads from the already-loaded `executorSrc` constant — no new file reads needed. Pure addition, no mutation.
**Delivers:** 1 new passing test asserting that the `<task_commit_protocol>` block explicitly distinguishes submodule `.git` files from worktree `.git` files and skips the worktree guards for the former.
**Addresses:** GAP-H
**Avoids:** Pitfall H-3 (scope within protocol block slice); Pitfall H-1 (assert the skip-path mechanism via `.git/worktrees/` positive condition and `GIT_CONTENT=` else-branch, not comment-only text like `.git/modules/`).

### Phase 4: GAP-L — User Profiler Rubric Assertion
**Rationale:** Appends a new `describe` block at end of `debug-session-management.test.cjs`. All imports already present; no structural changes to the file before this point. Placing this before GAP-K/M2 prevents any line-number interference from the overwrite.
**Delivers:** 1 new passing test asserting that `gsd-user-profiler.md` load_rubric step references the Eta-inlined rubric via a `<reference>` block rather than a bare file read instruction.
**Addresses:** GAP-L
**Avoids:** Pitfall L-2 (assert `user-profiling.md` not generic `include`); Pitfall L-3 (assert `<step name="load_rubric">` and `user-profiling.md` as two separate `assert.ok()` calls).

### Phase 5: GAP-K + GAP-M2 — Debugger Security Test Rewrite (One Edit)
**Rationale:** The only mutation that changes an existing test's skip status and assertion body. Comes last because (a) confirming a green baseline from Phases 1–4 ensures any new failure is attributable only to this change, and (b) the edit requires care — naively removing the skip produces a hard `FAIL`.
**Delivers:** The skipped test at lines 133–139 of `debug-session-management.test.cjs` transitions to active and passing. Two assertions verify the fork's affirmative security paragraph: `content.includes('untrusted user input')` and `content.includes('evidence data only')`.
**Addresses:** GAP-K and GAP-M2 (same physical location — one edit closes both)
**Avoids:** Pitfall K-1 (replace assertion body together with removing `{ skip: '...' }`; `DATA_START` is not present in the fork's `gsd-debugger.md`).

### Phase Ordering Rationale

- The sequence front-loads risk-free changes (comment deletion, pure test additions) so any regression introduced in Phase 5 is immediately attributable to that single edit.
- GAP-L is placed before GAP-K/M2 because both touch `debug-session-management.test.cjs` — appending a new block is less error-prone before overwriting an existing block.
- GAP-E, GAP-H, and GAP-L have no dependency between them; the recommended order groups them by file (GAP-H touches a different file from GAP-L/K/M2) and by risk (ascending).
- GAP-K and GAP-M2 are coupled to the same 7-line block and are treated as one phase to prevent a partial edit that leaves the test in a broken state (removed skip, still-stale assertion).

### Research Flags

All phases use standard patterns. No phase needs `/gsd-plan-phase --research-phase` during planning.

Phases with verified patterns (standard — skip research):
- **Phase 1 (GAP-M1):** JSDoc comment deletion — zero API involvement, zero behavioral change.
- **Phase 2 (GAP-E):** Append inside existing `describe` block following exact existing test shape — FEATURES.md contains the exact code to write for all 8 tests.
- **Phase 3 (GAP-H):** Append inside existing `describe` block using module-level `executorSrc` — identical pattern to tests at lines 42–62 of the same file.
- **Phase 4 (GAP-L):** Append new `describe` block at end of file — same import set as GAP-K/M2's surrounding context.
- **Phase 5 (GAP-K/M2):** Overwrite 7 lines — straightforward but requires reading lines 133–139 of current file before editing to confirm exact replacement boundaries.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All patterns read directly from existing test files; Node.js 24.14.1 APIs confirmed in use; no new imports needed in any target file |
| Features | HIGH | All 6 gaps verified against actual product source files via grep; exact strings confirmed present or absent; multi-agent workflow token counts verified |
| Architecture | HIGH | All integration points read directly from source; `executorSrc` module-level load confirmed at lines 23–25 of bug-3097 file; one ARCHITECTURE.md discrepancy on GAP-K/M2 identity resolved by FEATURES.md and PITFALLS.md (both correctly identify it as one physical location at line 133) |
| Pitfalls | HIGH | All pitfalls grounded in actual file content; failure modes confirmed by examining what skipped tests currently assert vs what fork files contain |

**Overall confidence:** HIGH

### Gaps to Address

- **ARCHITECTURE.md describes GAP-K and GAP-M2 as two separate edits (lines 133 and 184) while FEATURES.md and PITFALLS.md correctly identify them as the same physical location (line 133).** Resolution: the FEATURES.md and PITFALLS.md accounts are authoritative. Lines 133–139 close both GAP-K and GAP-M2. Line 184 (`test.skip` for the anti-heredoc rule in `gsd-debug-session-manager.md`) is a separate issue that is out of scope for v2.1.0-f.
- **GAP-L file placement naming mismatch:** Placing a `gsd-user-profiler` assertion in `debug-session-management.test.cjs` is a naming mismatch, but is the minimum-friction option. All three research files concur on this placement. A future cleanup milestone may move it to a dedicated agent-structural-contract test file.

## Sources

### Primary (HIGH confidence)
- `agents/gsd-debugger.md` (lines 32–36) — confirmed `untrusted user input` and `evidence data only` present; `DATA_START` absent
- `agents/gsd-executor.md` (lines 454–465) — confirmed `.git/worktrees/` positive condition and `skip worktree guards` else-branch inside `<task_commit_protocol>`; confirmed `.git/modules/` appears in comment text at line 455
- `agents/gsd-user-profiler.md` (lines 41, 54–55) — confirmed `user-profiling.md` include tag and `included above in the` text near `load_rubric` step; confirmed `<reference>` block present
- `tests/phase-56-effort-wiring.test.cjs` (lines 1–228) — confirmed `allow-test-rule: source-text-is-the-product`, `read(rel)` helper, and GAP B `describe` block end position
- `tests/debug-session-management.test.cjs` (lines 133–139) — confirmed current skip form `{ skip: 'fork intentionally diverges from upstream contract' }` and stale `DATA_START` assertion body
- `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` (lines 23–25, 42–62, 103) — confirmed `executorSrc` module-level load and existing `describe` block extent
- `tests/step-numbering-scan.test.cjs` (lines 18–26) — confirmed Phase 48 RED expectation comment boundary and that `'use strict'` / `require()` begins at line 28
- `get-shit-done/workflows/{audit-fix,diagnose-issues,code-review,code-review-fix,explore,import,ingest-docs,discuss-phase-assumptions}.md` — all 8 Group B workflows verified to contain their respective `resolve-model-effort` and `_model_effort_arg` tokens

### Secondary (MEDIUM confidence)
- ARCHITECTURE.md — integration point descriptions; one discrepancy on GAP-K/M2 identity resolved by deferring to FEATURES.md and PITFALLS.md

---
*Research completed: 2026-06-07*
*Ready for roadmap: yes*
