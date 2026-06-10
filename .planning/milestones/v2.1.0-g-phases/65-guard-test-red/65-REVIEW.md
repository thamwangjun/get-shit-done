---
phase: 65-guard-test-red
reviewed: 2026-06-09T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - tests/no-issue-citations.test.cjs
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 65: Code Review Report

**Reviewed:** 2026-06-09T00:00:00Z
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed `tests/no-issue-citations.test.cjs`, the corpus guard test for Phase 65. The file implements a scanner (`scanContent`) with three citation categories (inline, parenthetical, feat-form) plus exclusion state machines for frontmatter and code fences. The scan logic and corpus harness are generally sound. Two quality defects were found: one unit test cannot detect a regression in the feature it is named after (frontmatter exclusion), and the PLACEHOLDER_DIGITS allowlist exemption is applied to inline citations but silently omitted from the feat-form branch, creating an asymmetry. Two informational items cover module-level mutable regex globals and an implicit assumption about non-empty scan directories.

## Warnings

### WR-01: Frontmatter Exclusion Unit Test Cannot Detect Its Own Regression

**File:** `tests/no-issue-citations.test.cjs:222`
**Issue:** The test `'frontmatter exclusion (D-09): color: "#A78BFA" inside frontmatter produces zero hits'` uses `'#A78BFA'` as the value inside the frontmatter block. `INLINE_RE` is `/#(\d+)\b/g` — it only matches `#` followed immediately by one or more digits. `'A78BFA'` starts with the letter `A`, so `INLINE_RE` never matches `#A78BFA` regardless of frontmatter state. The assertion (`hits.length === 0`) will pass whether or not frontmatter exclusion code is present. A complete removal of the frontmatter toggling logic would leave this test green, hiding the regression.

Verified by direct execution: a version of `scanContent` with frontmatter exclusion stripped entirely also produces `[]` for the given content.

**Fix:** Replace the test value with one that `INLINE_RE` can actually match — an all-digit color-like value that would be caught if frontmatter exclusion were removed:
```js
test('frontmatter exclusion (D-09): numeric value inside frontmatter produces zero hits', () => {
  // '#7892' is matchable by INLINE_RE (all digits); only frontmatter exclusion prevents a hit.
  const content = '---\nname: gsd-agent\ncolor: \'#7892\'\n---\nbody text';
  const hits = scanContent(content);
  assert.equal(hits.length, 0, 'numeric-like value in frontmatter must not be flagged');
});
```

### WR-02: PLACEHOLDER_DIGITS Allowlist Not Applied to Feat-Form Citations

**File:** `tests/no-issue-citations.test.cjs:169`
**Issue:** The `PLACEHOLDER_DIGITS` allowlist (line 52) exempts illustrative placeholder numbers (`1`, `2`, `45`, `123`) from inline/parenthetical detection. The feat-form detection branch (lines 169–173) has no equivalent check: `feat-123` would be flagged as a `feat-form` citation even though `123` is in `PLACEHOLDER_DIGITS`. The comment on line 20 states allowlist policy applies to `inline` and `parenthetical` only, with no mention of feat-form, but the design intent is unclear. If any prompt file ever illustratively references `feat-123`, `feat-45`, etc., the corpus test will raise a false positive that cannot be resolved by adding to `PLACEHOLDER_DIGITS`.

Current corpus scan shows no `feat-NNN` hits where NNN is a PLACEHOLDER digit, so there is no live false-positive today. However the asymmetry is a latent defect.

**Fix:** Either document the intentional asymmetry with a comment, or extend the allowlist check to the feat-form branch:
```js
// ── Feat-form detection ───────────────────────────────────────────────────────────
FEAT_FORM_RE.lastIndex = 0;
while ((m = FEAT_FORM_RE.exec(line)) !== null) {
  const digit = parseInt(m[1], 10);
  // Apply same PLACEHOLDER_DIGITS allowlist for consistency (D-04).
  if (PLACEHOLDER_DIGITS.has(digit)) continue;
  hits.push({ lineNumber, text: m[0], category: 'feat-form', contextLine: trimmed });
}
```
If the asymmetry is intentional (feat-form is never used illustratively), add a comment:
```js
// Note: PLACEHOLDER_DIGITS exemption is intentionally not applied to feat-form citations —
// feat-NNN patterns are tracker-specific and should not appear as illustrative examples.
```

## Info

### IN-01: Module-Level Mutable Regex Globals with /g Flag

**File:** `tests/no-issue-citations.test.cjs:58`
**Issue:** `INLINE_RE` and `FEAT_FORM_RE` are module-level constants holding stateful regex objects (the `/g` flag makes `lastIndex` mutable). `scanContent` correctly resets `lastIndex = 0` before each use per line. However, declaring mutable-state objects at module scope is a code smell: a future caller that forgets the reset, or any concurrent execution path (e.g., parallel test workers), would produce incorrect results. The pattern is repeated for both regexes.

**Fix:** Either move the regex definitions inside `scanContent` (recreated fresh per call, negligible cost for a test file), or freeze the pattern as a source string and compile inside the function:
```js
function scanContent(content) {
  const INLINE_RE = /(?<![0-9a-fA-F#])#(\d+)\b/g;
  const FEAT_FORM_RE = /\bfeat-(\d{3,})\b/g;
  // ...
}
```

### IN-02: Empty-Corpus Silent Pass Risk in Corpus Describe Block

**File:** `tests/no-issue-citations.test.cjs:98`
**Issue:** `ALL_FILES` is populated at module scope from `SCAN_DIRS`. If all scan directories are absent (e.g., in an incomplete checkout or after accidental directory removal), `ALL_FILES` is empty and the `describe('corpus scan — no issue citations')` block registers zero subtests. The Node.js `--test` runner reports the describe as passed with 0 tests. This means the entire corpus guard silently becomes a no-op without any failure signal.

**Fix:** Add an explicit guard assertion after the corpus describe block, or at the top of the corpus describe:
```js
describe('corpus scan — no issue citations', () => {
  // Fail fast if no files were found — indicates a broken scan setup.
  test('corpus is non-empty (scan dirs must exist)', () => {
    assert.ok(ALL_FILES.length > 0,
      `No markdown files found in SCAN_DIRS: ${SCAN_DIRS.join(', ')}. Check project structure.`
    );
  });
  for (const file of ALL_FILES) {
    // ...
  }
});
```

---

_Reviewed: 2026-06-09T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
