---
phase: 17-working-tree-and-docs-housekeeping
reviewed: 2026-04-23T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - tests/negative-framing-scan.test.cjs
  - mise.toml
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 17: Code Review Report

**Reviewed:** 2026-04-23
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Two files were reviewed: `tests/negative-framing-scan.test.cjs` (scanner logic improvements) and `mise.toml` (new tool version file). `mise.toml` is valid and unproblematic. The test file has one significant logic bug introduced by the broadened verb list in `isConditionalOrFactual()` — making the `not` group optional causes `DO NOT modify`, `Do not include`, and similar real directives to be silently whitelisted, undermining the purpose of the scanner. The case-insensitive DO NOT regex change is correct and appropriate. The relative clause pattern is sound. The subject+verb factual pattern has reasonable guards.

## Warnings

### WR-01: Optional `not` group in broadened verb list silently whitelists real directives

**File:** `tests/negative-framing-scan.test.cjs:91`

**Issue:** The regex on line 91 was changed to make the `not` group optional — `(not\s+)?` — while simultaneously adding a much broader list of action verbs (`modify`, `change`, `include`, `require`, `start`, `implement`, `override`, `replace`, `align`, `correspond`, etc.). Because `not` is optional, the pattern `\b(do|does|did)\s+(not\s+)?...\b` matches `do modify`, `does include`, `did require` — but it also matches `DO NOT modify`, `Do not include`, `Do not require` and classifies them as factual filter lines rather than directives. This means real bare prohibitions like `DO NOT modify source files.`, `Do not include sensitive data.`, and `Do not implement this without review.` pass through `isConditionalOrFactual()` as `true` and are never flagged.

Verified via evaluation:
- `isConditionalOrFactual('DO NOT modify source files.')` → `true` (should be `false`)
- `isConditionalOrFactual('Do not include sensitive information.')` → `true` (should be `false`)
- `isConditionalOrFactual('Do not start a new session.')` → `true` (should be `false`)

The existing unit test for this function only uses `'DO NOT commit REVIEW-FIX.md'` as its directive case — `commit` is not in the expanded verb list, so the test passes while the bug goes undetected.

**Fix:** Require `not` in the factual verb list check (remove the `?` from `(not\s+)?`). Additionally, evaluate whether newly added generic action verbs (`modify`, `change`, `include`, `require`, `implement`, `override`, `replace`) belong in this list at all — these are common directive verbs. The subject+verb factual pattern on line 98 already handles the `"X do not Y" in mid-sentence` case correctly with proper clause-start guards, making the verb list check redundant for those verbs.

```js
// Line 91 — change from:
if (/\b(do|does|did)\s+(not\s+)?(already\s+)?(match|exist|contain|have|include|apply|appear|start|end|expose|overwrite|require|support|conflict|depend|extend|implement|override|replace|modify|change|align|correspond)\b/i.test(line)) return true;

// To (not is required; restrict verb list to state-description verbs):
if (/\b(do|does|did)\s+not\s+(already\s+)?(match|exist|contain|have|include|apply|appear|start|end|expose|overwrite|require|support|conflict|depend)\b/i.test(line)) return true;
```

The broader factual mid-sentence cases (`concurrent sessions do not overwrite each other`) are already handled by the subject+verb pattern on line 98 and do not need to be in this verb list.

### WR-02: Unit test for `isConditionalOrFactual()` uses only a verb not in the expanded list

**File:** `tests/negative-framing-scan.test.cjs:276-278`

**Issue:** The test that verifies directive lines are not whitelisted uses `'DO NOT commit REVIEW-FIX.md'`. The verb `commit` is not in the verb list on line 91, so this test passes regardless of the bug in WR-01. The test suite does not cover any directive line whose verb appears in the expanded list (`modify`, `change`, `include`, `require`, `start`, `implement`, `override`, `replace`). This means the regression introduced in WR-01 is not caught by any test.

**Fix:** Add test cases that use verbs present in the factual verb list to verify they are still flagged as directives when they appear at clause start:

```js
test('not conditional: directive with verb in factual list', () => {
  assert.ok(!isConditionalOrFactual('DO NOT modify source files.'));
  assert.ok(!isConditionalOrFactual('Do not include sensitive data.'));
  assert.ok(!isConditionalOrFactual('Do not require manual steps.'));
  // Factual mid-sentence uses should still pass:
  assert.ok(isConditionalOrFactual('These settings do not include X.'));
  assert.ok(isConditionalOrFactual('Concurrent sessions do not overwrite each other.'));
});
```

## Info

### IN-01: File header comment is stale after case-insensitive DO NOT change

**File:** `tests/negative-framing-scan.test.cjs:13`

**Issue:** The file docblock on line 13 still reads `DO NOT / Do NOT / do NOT [verb]` — listing the three specific case forms the old regex matched. The detection was changed to `/\bdo not\b/i` (case-insensitive), so this description is now narrower than reality. Any casing combination (`Do Not`, `do not`, `DO not`, etc.) is now matched.

**Fix:** Update the comment to reflect the new behavior:

```js
//   - `do not [verb]` (any capitalisation) used as a primary directive with no positive
//     complement on the same line
```

### IN-02: `mise.toml` pins Node to a floating `lts` alias

**File:** `mise.toml:2`

**Issue:** `node = "lts"` resolves to whatever the current LTS release is at install time, which changes as new LTS versions are promoted. This is consistent with many mise setups that prefer staying on latest LTS, but it means two developers installing at different times may get different Node versions (e.g., 20 vs 22).

**Fix:** Pin to a specific LTS version if reproducibility across the team matters:

```toml
[tools]
node = "22"
```

This is a low-priority housekeeping note — `lts` is a deliberately supported alias in mise and is a valid choice.

---

_Reviewed: 2026-04-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
