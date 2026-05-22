---
phase: 17-working-tree-and-docs-housekeeping
fixed_at: 2026-04-23T00:00:00Z
review_path: .planning/phases/17-working-tree-and-docs-housekeeping/17-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 17: Code Review Fix Report

**Fixed at:** 2026-04-23
**Source review:** `.planning/phases/17-working-tree-and-docs-housekeeping/17-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 2
- Fixed: 2
- Skipped: 0

## Fixed Issues

### WR-01: Optional `not` group in broadened verb list silently whitelists real directives

**Files modified:** `tests/negative-framing-scan.test.cjs`
**Commits:** `706f84b`, `de80731`
**Applied fix:** Made `not` mandatory (removed `?` from `(not\s+)?`) in the `do/does/did` verb
check on line 91 of `isConditionalOrFactual()`. Additionally removed directive-adjacent verbs
(`include`, `require`, `start`, `end`, `implement`, `override`, `replace`, `modify`, `change`,
`align`, `correspond`, `extend`) from the verb list, restricting it to pure state-description
verbs (`match`, `exist`, `contain`, `have`, `apply`, `appear`, `expose`, `overwrite`, `support`,
`conflict`, `depend`). Mid-sentence factual uses such as `"These settings do not include X"` are
correctly handled by the subject+verb pattern on line 98 which requires a subject word before
`"do not"` and guards against clause-start position. A comment was added explaining the design
rationale for the restricted verb list.

### WR-02: Unit test for `isConditionalOrFactual()` uses only a verb not in the expanded list

**Files modified:** `tests/negative-framing-scan.test.cjs`
**Commit:** `de80731`
**Applied fix:** Added a new test case `'not conditional: directive with verb in factual list'`
inside the `isConditionalOrFactual()` describe block. The test verifies that `DO NOT modify`,
`Do not include`, and `Do not require` are correctly classified as directives (return `false`),
while factual mid-sentence uses (`'These settings do not include X.'` and `'Concurrent sessions
do not overwrite each other.'`) continue to pass (return `true`). This test directly validates
the WR-01 bug fix and would have caught the original regression.

---

_Fixed: 2026-04-23_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
