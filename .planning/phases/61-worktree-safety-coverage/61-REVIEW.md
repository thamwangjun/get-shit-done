---
phase: 61-worktree-safety-coverage
reviewed: 2026-06-08T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - tests/bug-3097-3099-executor-worktree-path-safety.test.cjs
findings:
  critical: 1
  warning: 3
  info: 1
  total: 5
status: issues_found
---

# Phase 61: Code Review Report

**Reviewed:** 2026-06-08T00:00:00Z
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

The test file `bug-3097-3099-executor-worktree-path-safety.test.cjs` adds regression guards for worktree path safety bugs #3097 and #3099. All 8 tests pass against the current source. The test structure is broadly sound — it reads real product files and performs string-search assertions — but four defects were found: one critical (a path-prefix sibling bypass in the reference document that no test detects), two warnings (a regex metacharacter bug and an insufficient ordering-guard), and one info item.

The critical finding is in the reference document `worktree-path-safety.md`, not in the test file itself, but the test file is responsible for verifying that document's guard is correct and fails to do so.

---

## Critical Issues

### CR-01: `worktree-path-safety.md` absolute-path guard uses a sibling-bypass-vulnerable prefix check — test does not detect this

**File:** `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs:94-102`
**Cross-reference:** `get-shit-done/references/worktree-path-safety.md:81`

**Issue:** The test at lines 94-102 verifies `worktree-path-safety.md` contains `WT_ROOT` and `absolute` — keyword presence only, not guard correctness. The reference document's absolute-path check is:

```bash
if [[ "$ABS_PATH" != "$WT_ROOT"* ]]; then
```

The unquoted glob `$WT_ROOT*` uses shell prefix matching, not path-boundary matching. When `WT_ROOT=/home/user/repo`, a path like `/home/user/repo-sibling/evil.js` passes the guard because the string starts with `/home/user/repo`. This is a path-traversal bypass: an executor agent working in `/home/user/repo-worktree` would silently write to a sibling directory.

`gsd-executor.md` uses the correct boundary-safe check (line 442):
```bash
if [[ "$ABS_PATH" != "$WT_ROOT" && "$ABS_PATH" != "$WT_ROOT/"* ]]; then
```
with an explicit trailing slash separator. The reference document disagrees with the executor, and the test verifies neither form.

Additionally, the reference document uses `echo "WARNING:"` without `exit 1`, while the executor uses `echo "FATAL:"` with `exit 1`. The test does not verify severity or that execution halts on violation.

**Fix:** Add an assertion to the `worktree-path-safety.md contains cwd-drift and absolute-path guards` test that verifies the boundary-safe form is present in the reference document:

```javascript
test('worktree-path-safety.md contains cwd-drift and absolute-path guards', () => {
  const safetySrc = fs.readFileSync(
    path.join(ROOT, 'get-shit-done', 'references', 'worktree-path-safety.md'), 'utf8',
  );
  assert.ok(safetySrc.includes('gsd-spawn-toplevel') || safetySrc.includes('cwd-drift'),
    'worktree-path-safety.md missing cwd-drift sentinel content');
  // Must use boundary-safe check (trailing slash) to avoid sibling-directory bypass
  assert.ok(
    safetySrc.includes('WT_ROOT/"*') || safetySrc.includes('WT_ROOT/"*') ||
    safetySrc.includes('"$WT_ROOT/"'),
    'worktree-path-safety.md uses glob-prefix check without trailing-slash boundary — sibling paths bypass guard',
  );
  // Reference severity must halt execution, not merely warn
  assert.ok(safetySrc.includes('exit 1'),
    'worktree-path-safety.md absolute-path guard must exit 1 (FATAL), not merely warn');
});
```

And fix `worktree-path-safety.md` line 81 to:
```bash
if [[ "$ABS_PATH" != "$WT_ROOT" && "$ABS_PATH" != "$WT_ROOT/"* ]]; then
  echo "FATAL: $ABS_PATH is outside the worktree ($WT_ROOT)" >&2
  exit 1
fi
```

---

## Warnings

### WR-01: Unescaped `.` metacharacter in ordering-test regex

**File:** `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs:56`

**Issue:** The `cwd-drift check precedes HEAD assertion` test uses:
```javascript
const driftIdx = protocol.search(/cwd.drift|gsd-spawn-toplevel|drift.*assertion/i);
```

The `.` between `cwd` and `drift` is an unescaped regex metacharacter that matches any character. This matches `cwd-drift` (intended) but also matches `cwd drift`, `cwdXdrift`, or any single-character separator. The intent is clearly a hyphen literal.

While the current source content only contains `cwd-drift` so the test passes correctly, this is a latent defect: if the product text were changed to a slightly different form (`cwd drift`) the regex would still match and the test would not catch the change.

**Fix:**
```javascript
const driftIdx = protocol.search(/cwd-drift|gsd-spawn-toplevel|drift.*assertion/i);
```

---

### WR-02: cwd-drift presence test accepts `drift` anywhere in the protocol — false-pass risk

**File:** `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs:37-39`

**Issue:** The first test in the `#3097` suite asserts the cwd-drift fix is present via:
```javascript
assert.ok(
  protocol.includes('cwd') || protocol.includes('drift') || protocol.includes('gsd-spawn-toplevel'),
  'task_commit_protocol missing cwd-drift assertion step — #3097 fix not applied',
);
```

`protocol.includes('drift')` will match any occurrence of "drift" in the entire `task_commit_protocol` block, including the pre-existing step 0 prose: "If HEAD has drifted onto a protected ref" (line 452 of `gsd-executor.md`). If step 0a were deleted but step 0 remained, this test would still pass because "drifted" contains the substring "drift".

Similarly, `protocol.includes('cwd')` would match any cwd-related comment that might survive a partial revert.

**Fix:** Require the specific sentinel form — the most precise token unique to the #3097 fix is `gsd-spawn-toplevel`, which appears only in the step 0a code block. Replace the weak OR with a targeted assertion:

```javascript
assert.ok(
  protocol.includes('gsd-spawn-toplevel'),
  'task_commit_protocol missing gsd-spawn-toplevel sentinel — #3097 fix not applied',
);
```

---

### WR-03: Test verifies `worktree-path-safety.md` is referenced in execute-phase.md but not that the reference is in the correct block

**File:** `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs:76-84`

**Issue:** The test checks:
1. `<parallel_execution>` block exists in `execute-phase.md` — OK.
2. The full file `executePhaseSrc.includes('worktree-path-safety.md')` — checked against the entire file, not within the `parallel_execution` block or `execution_context` block.

The comment in the test says "loaded via @ reference rather than inlined — the safe extract pattern." But if `worktree-path-safety.md` were moved outside the worktree execution path (e.g., into a sequential-only section), this test would still pass. The two assertions are structurally decoupled.

Additionally: `parallel_execution` block exists check (`assert.ok(parallelIdx !== -1)`) correctly validates block presence, but the subsequent `executePhaseSrc.includes('worktree-path-safety.md')` searches the entire source — the reference could appear in a comment or the sequential path and the test would not distinguish.

**Fix:** Scope the reference check to the content that follows `<parallel_execution>`:

```javascript
test('execute-phase.md parallel_execution block references path safety', () => {
  const parallelIdx = executePhaseSrc.indexOf('<parallel_execution>');
  assert.ok(parallelIdx !== -1, 'parallel_execution block not found in execute-phase.md');
  // Verify the reference appears after the parallel_execution open tag (in its context)
  const fromParallel = executePhaseSrc.slice(parallelIdx);
  assert.ok(
    fromParallel.includes('worktree-path-safety.md'),
    'execute-phase.md does not reference worktree-path-safety.md after parallel_execution block',
  );
});
```

---

## Info

### IN-01: Module-level JSDoc comment absent

**File:** `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs:1-2`

**Issue:** CLAUDE.md conventions specify "module-level JSDoc at the top of every lib file." While test files may be exempt from strict JSDoc requirements, the file has only a single-line comment `// allow-test-rule: reads markdown product files (...)` rather than a JSDoc block. Other test files in this repo (check `tests/*.test.cjs`) use a consistent preamble style. The file comment is also inline-only and does not use `/** ... */` form.

This is a minor style inconsistency — the inline comment does explain the test rule override, which is useful, but the convention is JSDoc for module-level documentation.

**Fix:** If the project convention applies to test files, prefix with:
```javascript
/**
 * Regression guards for bugs #3097 and #3099 — worktree cwd-drift and
 * absolute-path safety in gsd-executor.md.
 *
 * @see agents/gsd-executor.md <task_commit_protocol>
 * @see get-shit-done/references/worktree-path-safety.md
 */
```

---

_Reviewed: 2026-06-08T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
