---
phase: 48-tdd-red-gate
reviewed: 2026-05-30T10:29:43Z
depth: quick
files_reviewed: 1
files_reviewed_list:
  - tests/step-numbering-scan.test.cjs
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 48: Code Review Report

**Reviewed:** 2026-05-30T10:29:43Z
**Depth:** quick
**Files Reviewed:** 1
**Status:** issues_found

## Summary

One test file reviewed: `tests/step-numbering-scan.test.cjs`. No secrets, dangerous functions, debug artifacts, or empty catch blocks found. Two logic/reliability warnings surfaced via targeted verification of the detection regexes. One info item on assertion style.

## Warnings

### WR-01: `STEP_DECIMAL_RE` produces false positives on mid-sentence cross-references

**File:** `tests/step-numbering-scan.test.cjs:71`
**Issue:** The boundary group `(?:^|\s|\*\*)` in `STEP_DECIMAL_RE` matches a preceding space, so prose like `"see Step 2b for details"` is flagged as a violation even though it is a reference, not a step label. The corpus tests will fail on any file that uses `"see Step 7a"` or similar cross-reference prose because `\s` before `Step` is sufficient to trigger the pattern. The unit tests do not cover this edge case.

A quick manual test confirms:
```
/(?:^|\s|\*\*)Step\s+\d+(?:\.\d|[a-z])/i.test('see Step 2b for details') // → true (false positive)
/(?:^|\s|\*\*)Step\s+\d+(?:\.\d|[a-z])/i.test('(Step 2b)')                // → false
```

**Fix:** Anchor the heading/label context more tightly. Require the match to start at the beginning of a logical line rather than allowing an arbitrary preceding space. One approach is to test `trimmed` (already computed) with a `^`-anchored variant of the pattern, or add `|>` (blockquote) and `|\(` to the boundary group while removing the bare `\s` alternative:

```js
// Replace the bare \s boundary with explicit non-word prefix characters
const STEP_DECIMAL_RE = /(?:^|(?<=\*\*))Step\s+\d+(?:\.\d|[a-z])/i;
// Or simpler: test the trimmed line with a ^ anchor
if (/^(?:\*\*|>|\s)*Step\s+\d+(?:\.\d|[a-z])/i.test(trimmed)) {
```

Alternatively, add a unit test that asserts `"see Step 2b for details"` does NOT flag, so the false-positive is at least documented as a known gap if the regex is intentionally broad.

---

### WR-02: Unclosed code fence leaves `inCodeBlock = true` for remainder of file, silently suppressing all findings

**File:** `tests/step-numbering-scan.test.cjs:83-94` (also `129-133`)
**Issue:** Both `scanContent()` and `scanForOutOfOrder()` toggle `inCodeBlock` on every ` ``` ` line. If a scanned file contains an unclosed (or unbalanced) code fence — which is a valid Markdown authoring mistake — `inCodeBlock` gets stuck at `true` after the fence, and every subsequent line is silently skipped. The corpus tests would pass (zero violations found) for such a file, masking real violations below the unclosed fence.

This is a silent-failure mode, not merely an edge case: a file with a real decimal step label after an unclosed fence would emit a clean result.

**Fix:** After the line loop, check the final state and emit a warning or throw if `inCodeBlock` is still `true`:

```js
// After the for loop in scanContent / scanForOutOfOrder:
if (inCodeBlock) {
  // Unclosed code fence — results may be incomplete; surface rather than silently pass
  throw new Error(`Unclosed code fence detected while scanning content`);
}
```

Or, in the corpus test wrapper, validate fence balance before calling the scan functions:

```js
const fenceCount = (content.match(/^```/gm) || []).length;
assert.ok(fenceCount % 2 === 0, `${relPath} has an unbalanced code fence`);
```

---

## Info

### IN-01: `assert.equal` used instead of `assert.strictEqual` in unit tests

**File:** `tests/step-numbering-scan.test.cjs:193-269` (all unit test assertions)
**Issue:** All unit test numeric assertions use `assert.equal` (loose equality, `==`) rather than `assert.strictEqual` (`===`). The file imports from `node:assert/strict`, which makes `assert.equal` an alias for strict equality in that module — so this is not a correctness bug in practice. However, it is inconsistent with the explicit `assert.deepStrictEqual` used in the corpus tests (lines 281, 296, 311) and with the codebase convention of preferring explicit strict checks. A reader unfamiliar with `node:assert/strict` aliasing may believe the tests are weaker than they are.

**Fix:** Replace `assert.equal` with `assert.strictEqual` throughout the unit test blocks for self-documenting clarity:

```js
// Before
assert.equal(patternAB.length, 1, 'should detect one Pattern A/B violation');
// After
assert.strictEqual(patternAB.length, 1, 'should detect one Pattern A/B violation');
```

---

_Reviewed: 2026-05-30T10:29:43Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: quick_
