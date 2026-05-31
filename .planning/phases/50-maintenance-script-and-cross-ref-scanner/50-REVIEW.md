---
phase: 50-maintenance-script-and-cross-ref-scanner
reviewed: 2026-05-31T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - scripts/normalize-step-numbers.cjs
  - tests/cross-file-step-refs.test.cjs
  - tests/step-numbering-scan.test.cjs
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 50: Code Review Report

**Reviewed:** 2026-05-31
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files were reviewed: the `normalize-step-numbers.cjs` maintenance script, and two test files (`cross-file-step-refs.test.cjs`, `step-numbering-scan.test.cjs`). The test files are structurally sound and the corpus scanning logic is correct. The normalize script contains two critical logic errors that make it produce incorrect output (duplicate step numbers and incomplete per-line renaming) regardless of whether `--dry-run` is passed. These must be fixed before the script is run against any real file.

## Critical Issues

### CR-01: `buildRenameMap` maps all decimal sub-steps of the same base to the same new number, producing duplicate step numbers

**File:** `scripts/normalize-step-numbers.cjs:163`
**Issue:** `newNum` is computed as `baseNum + 1` where `baseNum` is the integer part of the old label (e.g., `1` from `Step 1.3`). The `sectionCounter` variable is incremented on line 162 but is never used in the `newNum` calculation — it is dead code. The consequence is that every decimal sub-step sharing the same integer part maps to the same target:

- `Step 1.3` → `Step 2` (baseNum=1, newNum=2)
- `Step 1.5` → `Step 2` (baseNum=1, newNum=2) — same target

When `applyRenameMap` replaces these, both lines become `Step 2`, leaving the file with two consecutive `Step 2` headings. This is incorrect and exactly the opposite of the sequential whole-integer normalization the script promises. Files with patterns like `Step 1.3, Step 1.5, Step 2.5, Step 2.6` (the known real-world case from `gsd-phase-researcher.md`) would be corrupted to `Step 2, Step 2, Step 3, Step 3`.

**Fix:** Replace the `baseNum + 1` formula with `sectionCounter` (which is already incremented and tracks sequential position within the section):

```js
// Before (broken):
const newNum = baseNum + 1; // The step after the base integer gets the next number

// After (correct):
const newNum = sectionCounter; // sequential within section, already incremented above
```

With this fix, within a section:
- `Step 1.3` → `Step 1` (sectionCounter=1)
- `Step 1.5` → `Step 2` (sectionCounter=2)
- `Step 2.5` → `Step 3` (sectionCounter=3)

---

### CR-02: `buildRenameMap` only captures the first decimal step label per line

**File:** `scripts/normalize-step-numbers.cjs:156`
**Issue:** The inner match on line 156 uses `line.match(...)` without the `/g` flag, which returns only the first match. A line containing multiple decimal step references — e.g., `See **Step 1.5** and **Step 2.5** below` — will only add `Step 1.5` to the rename map. `Step 2.5` is silently ignored. The subsequent `applyRenameMap` call will replace `Step 1.5` correctly but leave `Step 2.5` untouched, resulting in a mixed-state file that still fails the decimal-step scanner.

**Fix:** Use a `/g` regex loop to collect all matches per line:

```js
// Replace the single match call with a loop:
const lineRe = /(?:^|\s|\*\*)(Step\s+(\d+)(?:\.(\d+)|([a-z])))/gi;
let match;
while ((match = lineRe.exec(line)) !== null) {
  const oldLabel = match[1];
  const baseNum  = parseInt(match[2], 10);
  sectionCounter++;
  const newNum = sectionCounter; // use sectionCounter, not baseNum+1
  const newLabel = oldLabel.replace(/Step\s+\d+(?:\.\d+|[a-z])/i, `Step ${newNum}`);
  if (oldLabel !== newLabel) {
    renameMap.set(oldLabel, newLabel);
  }
}
```

## Warnings

### WR-01: `newItem` variable in Pattern D branch is computed but never used (dead code)

**File:** `scripts/normalize-step-numbers.cjs:185`
**Issue:** `newItem` is assigned on line 185 (`const newItem = \`${newNum}.\`;`) but is never read. The condition check on line 186 uses `oldItem !== newItem` — which is always `true` when `intNum !== intNum+1` (i.e., always) — so it functions only as a constant-true guard. The variable `newItem` has no downstream consumer; the rename map stores `newFull` (line 189-190), not `newItem`.

**Fix:** Remove the dead variable and simplify the condition:

```js
// Remove:
const oldItem = `${integer}.`;
const newItem = `${newNum}.`;
if (oldItem !== newItem) {

// Replace with unconditional block (or a meaningful guard):
{
```

---

### WR-02: Line 349 — `oldStep.replace('.', '.')` is a no-op, making the `||` branch always redundant

**File:** `scripts/normalize-step-numbers.cjs:349`
**Issue:** The condition `oldStep.replace('.', '.') === labelNum` replaces `.` with `.` — a string identity operation. `String.prototype.replace(string, string)` replaces the first occurrence of the first argument with the second; replacing `'.'` with `'.'` changes nothing. The entire `||` clause is always equivalent to `oldStep === labelNum`, making it dead code that misleads readers into thinking a normalization step is happening.

**Fix:** Remove the redundant clause:

```js
// Before:
if (oldStep === labelNum || oldStep.replace('.', '.') === labelNum) {

// After:
if (oldStep === labelNum) {
```

---

### WR-03: `renamed` count on line 429 reports `renameMap.size` (distinct mappings), not replacements applied

**File:** `scripts/normalize-step-numbers.cjs:429`
**Issue:** `const renamed = renameMap.size > 0 && result !== original ? renameMap.size : 0;` counts the number of distinct label-to-label entries in the rename map, not the number of lines modified or occurrences replaced. A file with one unique decimal label that appears on 10 lines reports `renamed = 1`. A file where 3 labels each appear once also reports `renamed = 3`. Neither figure is the "rename count" suggested by the variable name and the stdout line on line 457. The stdout message `${renamed} rename(s)` is therefore misleading.

**Fix:** Count actual replacements during `applyRenameMap` and return that count:

```js
// In applyRenameMap, add a counter:
let replacementCount = 0;
// ...inside the loop:
if (line.includes(oldLabel)) {
  const newLine = line.split(oldLabel).join(newLabel);
  if (newLine !== line) replacementCount++;
  line = newLine;
}
// Return replacementCount from applyRenameMap and use it in processFile.
```

---

### WR-04: Test name in `cross-file-step-refs.test.cjs` does not match what is actually tested; NaN guard is unreachable

**File:** `tests/cross-file-step-refs.test.cjs:312`
**Issue:** The test is named `'skips decimal step refs (whole-integer only — NaN guard)'` and its comment explains that `XREF_PATTERNS` capture `(\d+)` only, so `step 5.5` would parse as step `5`. The test body, however, uses the content `'See execute-phase.md step 5 for this.'` — a plain integer ref, not a decimal ref. The test never actually exercises the decimal-ref scenario described in the name and comment.

Additionally, the `isNaN` guard on line 205 (`if (isNaN(stepNum)) continue;`) is unreachable dead code. `XREF_PATTERNS` use `(\d+)` which only matches one or more digits; `parseInt` on a non-empty digit string always returns a valid integer, never `NaN`. The guard was added as defense-in-depth per the comment, but since the regex prevents the guard from ever triggering, it is dead code.

**Fix (test name):** Rename the test to reflect what it actually verifies:
```js
test('detects plain integer step refs in cross-file references', () => {
```

**Fix (NaN guard):** Remove the unreachable guard or replace it with a comment explaining why it cannot be reached given `(\d+)` capture:
```js
// stepNum is always a valid integer; (\d+) in XREF_PATTERNS guarantees non-empty digit string.
const stepNum = parseInt(matchedStep, 10);
```

## Info

### IN-01: `applyRenameMap` string-split-join replace is not word-boundary aware

**File:** `scripts/normalize-step-numbers.cjs:234-235`
**Issue:** Labels are replaced using `line.split(oldLabel).join(newLabel)`, which is a plain substring replace with no word-boundary enforcement. If `oldLabel` is `Step 2.5` and that string appears as a substring in an unexpected context (e.g., `XStep 2.5`, or within a URL fragment), it would be replaced. In practice, decimal step labels in these markdown files are always surrounded by spaces or markdown delimiters, so this is low risk. However, it is worth noting the absence of boundary checking.

**Fix (optional):** Use a regex replace with word boundaries if precision is required:
```js
line = line.replace(
  new RegExp(oldLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
  newLabel
);
// Or add boundary assertions as appropriate.
```

---

### IN-02: Module-level `/gi` regexes are mutated in-place across `findCrossFileRefs` calls in the test file

**File:** `tests/cross-file-step-refs.test.cjs:182-184`
**Issue:** `XREF_PATTERNS` contains two `/gi` regexes defined at module scope. Inside `findCrossFileRefs`, the loop sets `re.lastIndex = 0` directly on the shared module-level regex objects before each `exec` loop. This works correctly in single-threaded Node.js (the test runner is synchronous here), but it is a fragile pattern: any future refactoring that calls `findCrossFileRefs` concurrently or wraps the patterns in async contexts would cause `lastIndex` corruption. The normalize script avoids this correctly by constructing a new `RegExp` on each call (line 299).

**Fix:** Follow the normalize script pattern — create a fresh `RegExp` on each iteration:
```js
for (const patternTemplate of XREF_PATTERNS) {
  const re = new RegExp(patternTemplate.source, patternTemplate.flags);
  let m;
  while ((m = re.exec(line)) !== null) { ... }
}
```

---

_Reviewed: 2026-05-31_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
