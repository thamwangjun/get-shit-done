# Phase 61: Worktree Safety Coverage - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Add one test to `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` that slices the `<task_commit_protocol>` XML block from `gsd-executor.md` and asserts it contains both the worktree-positive condition (`.git/worktrees/`) and the submodule skip-branch mechanism (`GIT_CONTENT=` + `skip worktree guards`). All assertions are scoped to the sliced block, not the full file.

**In scope:** One new `describe` block with one `test()` in the existing test file.
**Out of scope:** Modifying any agent/workflow source file; adding new test files.

</domain>

<decisions>
## Implementation Decisions

### Test organization
- **D-01:** Append a new `describe('phase-61: submodule exclusion guard', () => { ... })` block after the existing `describe('bug #3097...')` and `describe('bug #3099...')` blocks. Matches cross-file phase precedent (phase-60 block appended to phase-56 file). TAP output names the guard correctly without misleading attribution to a closed bug number.

### Assertion tokens
- **D-02:** Use two separate `assert.ok` calls for the submodule skip-branch requirement:
  1. `protocol.includes('GIT_CONTENT=')` — asserts the behavioral reset mechanism that makes the worktree guard skip for non-worktree `.git` files.
  2. `protocol.includes('skip worktree guards')` — asserts the intent-documenting comment text. In this fork, comment text is part of the deployed agent contract ("source-text-is-the-product"), so this is a documentation-as-contract assertion.
- **D-03:** Also assert `protocol.includes('.git/worktrees/')` for the worktree-positive condition (SC-1). This may already be covered by existing tests in the file — planner should verify and skip if redundant.

### Block slicing pattern
- **D-04:** Use the same `indexOf('<task_commit_protocol>')` / `indexOf('</task_commit_protocol>')` / `.slice()` pattern established in existing tests. Do not assert on `executorSrc` directly — SC-3 requires assertions scoped to the block slice to prevent vacuous passes from documentation text elsewhere.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Test target & pattern
- `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` — the file to extend; existing `describe('bug #3097...')` and `describe('bug #3099...')` blocks define the exact slice/assert pattern to mirror.

### Source file under test
- `agents/gsd-executor.md` — read the `<task_commit_protocol>` block (lines ~407–538). The submodule-exclusion logic is at lines ~455–465: `GIT_CONTENT=` capture, `^gitdir:.*\.git/worktrees/` condition, and `# This is a submodule or other non-worktree .git file — skip worktree guards` else-branch comment.

### Requirements & success criteria
- `.planning/REQUIREMENTS.md` §Worktree Safety Coverage (WSC-01) — the locked requirement.
- `.planning/ROADMAP.md` "Phase 61: Worktree Safety Coverage" — 4 success criteria (SC-1 through SC-4), including the block-scoped assertion requirement (SC-3).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Block-slice pattern in `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs`:
  ```js
  const protocolIdx = executorSrc.indexOf('<task_commit_protocol>');
  const protocolEnd = executorSrc.indexOf('</task_commit_protocol>');
  const protocol = executorSrc.slice(protocolIdx, protocolEnd);
  ```
  Reuse directly — do not reimplement.
- `executorSrc` is already read at the top of the file (`fs.readFileSync(..., 'utf8')`). The new describe block can reference it without re-reading.
- `// allow-test-rule: reads markdown product files...` header already present — covers the new source-text assertions.

### Established Patterns
- One `test()` per logical assertion group; `assert.ok(condition, failureMessage)` with a descriptive message naming the file and token.
- Existing SC-1 token `.git/worktrees/` may already be asserted by `describe('bug #3097...')` test "sentinel uses git rev-parse --git-dir to detect worktree" — planner should check before adding a duplicate assertion.

### Integration Points
- New describe block appended to the same file; no other test or source files touched.

</code_context>

<specifics>
## Specific Ideas

- The existing test on line ~59 (`'cwd-drift detection does not use git rev-parse --git-dir or .git/worktrees/ pattern'`) already asserts `protocol.includes('worktrees/')` as a disjunction. The new test should make the `.git/worktrees/` assertion stand-alone and unconditional for SC-1 compliance — or confirm the existing assertion satisfies SC-1 and focus the new test only on SC-2.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 61-worktree-safety-coverage*
*Context gathered: 2026-06-08*
