---
phase: quick-260604-tev
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/workflows/quick.md
  - tests/quick-commit-boundary.test.cjs
autonomous: true
requirements: [QUICK-260604-TEV]

must_haves:
  truths:
    - "In worktree mode, the executor commits SUMMARY.md to its per-agent branch so it survives worktree teardown (the root fix — committed work travels back on the branch, uncommitted work does not)"
    - "D-01: Positive-framing rule — the executor constraint states the correct behavior affirmatively (commit SUMMARY.md) rather than a 'Do NOT commit' prohibition"
    - "D-02: STATE.md and ROADMAP.md remain orchestrator-owned / excluded; PLAN.md remains committed pre-dispatch — only SUMMARY.md commit responsibility moves to the executor"
    - "Step 15 final commit remains an unconditional idempotent safety net for already-committed SUMMARY.md"
    - "tests/quick-commit-boundary.test.cjs asserts the new SUMMARY-commit contract and no longer asserts the removed 'Do NOT commit docs artifacts' string"
    - "npm test passes"
  artifacts:
    - path: "get-shit-done/workflows/quick.md"
      provides: "Executor-spawn constraint instructing the executor to commit SUMMARY.md"
      contains: "SUMMARY.md"
    - path: "tests/quick-commit-boundary.test.cjs"
      provides: "Regression test locking the executor SUMMARY-commit contract"
  key_links:
    - from: "get-shit-done/workflows/quick.md (executor constraints, ~line 782)"
      to: "executor per-agent branch commit"
      via: "executor commits SUMMARY.md; worktree.cleanup-wave merges branch back (Step 11, line 811)"
      pattern: "SUMMARY.md"
---

<objective>
Fix `/gsd-quick` losing `<quick_id>-SUMMARY.md` in worktree mode by making SUMMARY.md survival a property of git history rather than an unreachable working-tree rescue.

Root cause (already investigated, anchors verified): `get-shit-done/workflows/quick.md` line 782 instructs the executor `Do NOT commit docs artifacts (SUMMARY.md, STATE.md, PLAN.md)`. The intended safety net — `rescueSummaryArtifacts` in `worktree-safety.cjs` — never runs because the cleanup manifest stays empty (the executor's `<completion_format>` returns no `worktree_path`/`branch`), so `planWorktreeWaveCleanup` returns `action: skip` and the rescue is unreachable. Claude Code's native worktree teardown then deletes the uncommitted SUMMARY.md before Step 15 can stage it.

Fix: the executor commits SUMMARY.md to its per-agent branch. Committed work merges back via `worktree.cleanup-wave` (Step 11, line 811) and survives teardown. The PLAN.md pre-dispatch commit already uses this exact pattern.

Purpose: Stop silent SUMMARY.md loss in the most common quick-task execution mode.
Output: Updated workflow constraint + regression test.
</objective>

<context>
@get-shit-done/workflows/quick.md
@tests/quick-commit-boundary.test.cjs
@CLAUDE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Move SUMMARY.md commit responsibility to the executor in quick.md</name>
  <files>get-shit-done/workflows/quick.md</files>
  <read_first>
get-shit-done/workflows/quick.md lines 777-792 (the `<constraints>` block in the executor-spawn step) and lines 983-1008 (Step 15 final commit).
  </read_first>
  <action>
Edit the `<constraints>` block in the executor-spawn step (currently line 782). Replace the negative directive `- Do NOT commit docs artifacts (SUMMARY.md, STATE.md, PLAN.md) — the orchestrator handles the docs commit in Step 15` with an affirmative instruction (per D-01, the fork positive-framing rule): instruct the executor to commit its SUMMARY.md as a `docs(quick-${quick_id}): ...` commit so it travels back on the per-agent branch and survives worktree teardown. Per D-02, the affirmative instruction must explicitly scope what the executor commits vs. leaves to the orchestrator: executor commits ONLY SUMMARY.md (not STATE.md, not ROADMAP.md); PLAN.md is already committed pre-dispatch; STATE.md and ROADMAP.md remain orchestrator-owned in Step 15. Reference that Step 15 is an idempotent safety net (line 985 already states `gsd-sdk query commit` handles already-committed files gracefully) — do not weaken or remove Step 15. Keep line 783 (`Do NOT update ROADMAP.md`) unchanged; that directive is about scope (quick tasks vs. planned phases), not the SUMMARY commit boundary, and is out of scope for this fix.
  </action>
  <verify>
    <automated>grep -n "SUMMARY.md" get-shit-done/workflows/quick.md | grep -i "commit" ; ! grep -q "Do NOT commit docs artifacts" get-shit-done/workflows/quick.md &amp;&amp; echo "OLD DIRECTIVE REMOVED"</automated>
  </verify>
  <done>The executor constraint affirmatively instructs committing SUMMARY.md; the `Do NOT commit docs artifacts` string is gone; STATE.md/ROADMAP.md ownership and Step 15 idempotent safety net are preserved.</done>
</task>

<task type="auto">
  <name>Task 2: Update commit-boundary regression test to assert the SUMMARY-commit contract</name>
  <files>tests/quick-commit-boundary.test.cjs</files>
  <read_first>
tests/quick-commit-boundary.test.cjs (full file, 53 lines).
  </read_first>
  <action>
Update the `executor constraints prohibit committing docs artifacts` test (lines 26-31), which currently asserts `content.includes('Do NOT commit docs artifacts')` — now an obsolete assertion of the removed behavior. Rename/rewrite it to lock the NEW contract: assert that the quick.md executor constraints affirmatively instruct committing SUMMARY.md (e.g. assert the constraints region references committing `SUMMARY.md`), AND assert the removed string is absent (`!content.includes('Do NOT commit docs artifacts')`) so the fix cannot silently regress. Keep the other three tests (Step 15 `git add ${file_list}`, PLAN.md in file list, `MUST always run`) intact — they still hold. Update the file-level docblock comment (lines 1-7) to reflect that SUMMARY.md is now committed by the executor while PLAN.md/STATE.md remain orchestrator-handled, and cite the issue inline per repo convention.
  </action>
  <verify>
    <automated>node --test tests/quick-commit-boundary.test.cjs 2>&amp;1 | tail -15</automated>
  </verify>
  <done>The test no longer asserts the removed directive, asserts the executor commits SUMMARY.md, and the full test file passes.</done>
</task>

<task type="auto">
  <name>Task 3: Verify full suite and note the dead rescue path</name>
  <files>get-shit-done/bin/lib/worktree-safety.cjs</files>
  <read_first>
get-shit-done/bin/lib/worktree-safety.cjs lines 437-560 (rescueSummaryArtifacts and its caller guard at line 481/549).
  </read_first>
  <action>
Run the full test suite to confirm no other test asserted the old behavior. Then add a single concise comment above `rescueSummaryArtifacts` (line 437) documenting it as defense-in-depth only: the primary SUMMARY.md survival guarantee is now the executor's branch commit (see quick.md executor constraints); this rescue path remains as a fallback for the cleanup-wave manifest case but is not the primary mechanism. Cite the issue inline per repo convention (CLAUDE.md comments style). Do NOT change rescue behavior or signatures — minimal blast radius (comment only).
  </action>
  <verify>
    <automated>npm test 2>&amp;1 | tail -20</automated>
  </verify>
  <done>Full suite passes; rescueSummaryArtifacts has a comment marking it defense-in-depth with the primary mechanism noted; no behavioral change to worktree-safety.cjs.</done>
</task>

</tasks>

<verification>
- `! grep -q "Do NOT commit docs artifacts" get-shit-done/workflows/quick.md`
- `grep -i "commit" get-shit-done/workflows/quick.md | grep -q "SUMMARY.md"`
- `npm test` passes (includes tests/quick-commit-boundary.test.cjs and tests/worktree-cleanup.test.cjs)
</verification>

<success_criteria>
- Executor commits SUMMARY.md in worktree mode (affirmative constraint); old negative directive removed
- STATE.md/ROADMAP.md ownership and Step 15 idempotent safety net preserved
- Regression test locks the new contract; full suite green
- Positive-framing rule honored; no frontmatter changes to any agent file
</success_criteria>

<output>
Create `.planning/quick/260604-tev-fix-gsd-quick-losing-summary-md-in-workt/260604-tev-SUMMARY.md` when done
</output>
