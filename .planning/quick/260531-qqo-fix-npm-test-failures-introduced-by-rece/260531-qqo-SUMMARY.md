---
phase: quick-260531-qqo
plan: 01
status: complete
tasks_completed: 2
files_modified:
  - tests/ai-evals.test.cjs
  - tests/context-enrichment.test.cjs
  - tests/install-eta-regression.test.cjs
commits:
  - 553e53fe
  - 4593ed5e
---

# Quick Task 260531-qqo — Summary

Fixed 6 `npm test` failures introduced by recent quick tasks. Test-only changes; no source/product file touched. Full suite green afterward (0 failures).

## Root Causes & Fixes

### Group A — tests/ai-evals.test.cjs (2 failures)
The "Batch 4" test refactor added `{ HOME: tmpDir, USERPROFILE: tmpDir }` to the two HEALTH describe blocks. With `HOME == cwd == tmpDir`, `cmdValidateHealth` (get-shit-done/bin/lib/verify.cjs ~L610) hits the long-standing E010 guard (`resolved === os.homedir()`) and returns early with empty warnings and no `repairs_performed`. So W016 never fired and the repair test read `undefined.find`.

Fix (per decision: separate HOME dir, following the `fakeHome` convention in tests/agent-skills.test.cjs): both HEALTH blocks now create `fakeHome = fs.mkdtempSync(...'gsd-qqo-home-')` in `beforeEach`, clean it in `afterEach`, and pass `{ HOME: fakeHome, USERPROFILE: fakeHome }` to all four `runGsdTools` calls. cwd stays `tmpDir`, so E010 no longer fires while config-defaults sandboxing is preserved. Source untouched.

### Group B — context-enrichment + eta regression (4 failures)
The `mvd` quick task (817348c7) deliberately removed all `CONTEXT_WINDOW` ternary gating from execute-phase.md in favor of need-based `@~` reference loading. Tests asserting the removed gating were obsolete.

Fix (per decision: delete): removed 3 tests from the `execute-phase.md context enrichment` block in tests/context-enrichment.test.cjs (kept the verifier `files_to_read` test and the entire `plan-phase.md` block), and removed the `TEST-02` block from tests/install-eta-regression.test.cjs (kept TEST-01/03/04/05).

## Verification
- `npm test` → 0 failures (3 pre-existing skips remain).
- `git diff` scope limited to the three `tests/` files.

## Notes
- Worktree-isolated execution; the worktree branch was fast-forward-merged into `dev` and the worktree removed by the orchestrator.
