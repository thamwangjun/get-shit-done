# Quick Task 260608-fwg: Adapt failing content-assertion tests to rewritten execute-phase.md - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Task Boundary

execute-phase.md was rewritten during an upstream merge (eb4f074b, then partial restores be61b9a7 / 9ca19401). Orchestration behavior is intact, but many content-assertion tests assert exact strings/regexes/snippets that no longer match. Update the TEST EXPECTATIONS to match what the new file actually says while preserving each test's behavioral INTENT. Do NOT restore old content into execute-phase.md.

Project rule: source-text-is-the-product — these are intentionally content-assertion tests, so adapting expected strings to match real workflow content is the correct fix, not a hack.

EXCLUDE tests/null-omit-comment-scan.test.cjs (handled by a separate restore task).
</domain>

<decisions>
## Implementation Decisions

### Vanished contract handling
- If a guarded guarantee genuinely no longer exists anywhere in the rewritten execute-phase.md: re-point the assertion to the closest surviving wording that preserves the spirit (flag + adapt to nearest), AND flag the reinterpretation loudly in the commit message. Keep the suite green. Do NOT silently delete or weaken assertions just to pass.

### Workflow-edit scope guard
- Strictly tests-only. Never edit execute-phase.md (or any workflow/source file). If editing the workflow ever looks like the better fix, flag it for a separate task and do not act on it here.

### Per-assertion method (Claude's Discretion)
- For each failing assertion: read current execute-phase.md, locate where the new wording/structure expresses the same guarantee the test intended, update the expected string/regex/snippet accordingly.
- Work file-by-file. After each file: `node --test <that file>` must go green before moving on.
</decisions>

<specifics>
## Specific Ideas

Failing test files and the contract each guards:
- tests/ask-user-questions-fallback.test.cjs:52 — TEXT_MODE plain-text fallback for AskUserQuestion.
- tests/bug-2410-stream-checkpoint-heartbeats.test.cjs (33,99,126,137) — wave-start/plan-start/plan-complete/wave-complete heartbeat markers in the correct steps, preceding "Describe what's being built".
- tests/bug-2772-gitmodules-path-intersection.test.cjs (365,374,383) — dispatch gates read per-plan USE_WORKTREES_FOR_PLAN (not project-level USE_WORKTREES); worktree + sequential gates; per-plan "worktrees disabled" rule.
- tests/bug-3212-execute-phase-stall-safe-resume.test.cjs (63,74) — partial-plan drift verified before dispatch; configurable executor stall surveillance after dispatch.
- tests/bug-3360-codex-execute-phase-worktrees.test.cjs:53 — reads runtime before worktree dispatch, fails closed (blocks) for Codex unsupported worktree isolation.
- tests/enh-2433-todo-phase-linking.test.cjs:73 — auto-close never blocking phase completion / todo-phase linking.
- tests/execute-phase-step-7-deviation-doc.test.cjs (61-147) — step 7 deviation doc: standard wave contract, cross-wave dependency deviation mode, cross-wave cleanup (#3264), cleanup-tail snippet (git worktree prune / remove --force / unlock / branch -D) using the wave manifest, skip conditions (empty-WAVE_WORKTREE_PLANS, custom-merge-deviation).
- tests/execute-phase-wave.test.cjs (58,64,76) — wave filtering.
- tests/execute-phase-worktree-artifacts.test.cjs (29,45,77,101,117) — shared artifact ownership (#1571), intra-wave files_modified overlap check, orchestrator file protection during merge (#1756).
- tests/parallel-dependent-plans.test.cjs:123 — dependent-plan parallelization contract.
- tests/worktree-cleanup.test.cjs (480,543,661,691,703) — lock-aware cleanup, cleanup-tail pinning CWD to primary worktree + EXPECTED_BRANCH (#3425), locked-worktree errors (bug-2431), cleanup contracts (#3384).
- tests/worktree.test.cjs (436,474) — lock-aware detection block + user-visible warning on worktree removal failure.

Final gate: `npm test 2>&1 | tee /tmp/gsd-test-output.txt` shows 0 failures except null-omit (handled separately).
</specifics>

<canonical_refs>
## Canonical References

- get-shit-done/workflows/execute-phase.md (the rewritten source-of-truth all assertions must match)
- .planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md / PROMPT_ENGINEERING_GUIDE_V09.md (fork standards)
</canonical_refs>
