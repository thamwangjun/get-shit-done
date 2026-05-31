---
phase: 50-maintenance-script-and-cross-ref-scanner
reviewed: 2026-05-31T10:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - tests/step-numbering-scan.test.cjs
  - scripts/normalize-step-numbers.cjs
  - tests/cross-file-step-refs.test.cjs
findings:
  critical: 3
  warning: 4
  info: 2
  total: 9
status: issues_found
---

# Phase 50: Code Review Report

**Reviewed:** 2026-05-31T10:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files were reviewed: the `normalize-step-numbers.cjs` maintenance script, `step-numbering-scan.test.cjs`, and `cross-file-step-refs.test.cjs`. The two test files are structurally sound; their corpus-scan logic is correct and unit tests cover the material cases. The normalize script contains three critical logic errors that cause it to produce incorrect output when decimal steps share the same integer base, silently skip additional decimal steps on a single line, and miss the correct rename-map when multiple files share a basename. These defects must be fixed before the script is run against any real file.

## Critical Issues

### CR-01: `buildRenameMap` produces duplicate step numbers — `baseNum + 1` replaces all sub-steps of the same base with the same target

**File:** `scripts/normalize-step-numbers.cjs:163`
**Issue:** `newNum` is computed as `baseNum + 1`, where `baseNum` is the integer prefix of the old label (e.g., `1` from `Step 1.3`). The `sectionCounter` variable is incremented on line 162 but never used in the formula — it is dead code. Every decimal sub-step that shares the same integer prefix maps to the same target integer:

- `Step 1.3` → `Step 2` (baseNum=1, newNum=2)
- `Step 1.5` → `Step 2` (baseNum=1, newNum=2) — collision

The same failure occurs in the Pattern D branch (lines 180–190): `newNum = intNum + 1` means `5.5.`, `5.6.`, and `5.7.` all map to `6.` — the four items in the known `execute-phase.md` case (`5.5`–`5.8`) would all become `6.`.

Concrete trace for `gsd-phase-researcher.md` (`Step 1.3`, `Step 1.5`, `Step 2.5`, `Step 2.6` in one section):
```
Step 1.3 → Step 2  (baseNum=1, newNum=2)
Step 1.5 → Step 2  (baseNum=1, newNum=2)  ← collision in map
Step 2.5 → Step 3  (baseNum=2, newNum=3)
Step 2.6 → Step 3  (baseNum=2, newNum=3)  ← collision in map
```
The file would be left with two `Step 2` headings and two `Step 3` headings — corrupted, not normalized.

**Fix:** Replace `baseNum + 1` with `sectionCounter` (already incremented above) for Pattern A/B:
```js
// Before (broken):
const newNum = baseNum + 1; // The step after the base integer gets the next number

// After (correct):
const newNum = sectionCounter; // sequential within section, already incremented above
```
For Pattern D, maintain a parallel `patternDCounter` that resets on section headings and increments on each Pattern D match, then use it instead of `intNum + 1`.

---

### CR-02: `buildRenameMap` only captures the first decimal step label per line; additional labels on the same line are silently dropped

**File:** `scripts/normalize-step-numbers.cjs:156`
**Issue:** The inner `match()` on line 156 uses no `/g` flag, returning only the first match:
```js
const match = line.match(/(?:^|\s|\*\*)(Step\s+(\d+)(?:\.(\d+)|([a-z])))/i);
```
A line such as `See **Step 1.5** and **Step 2.5** below` adds only `Step 1.5` to the rename map; `Step 2.5` is skipped. After `applyRenameMap` runs, `Step 1.5` is corrected while `Step 2.5` remains, leaving the file in a mixed state that still fails the decimal-step scanner.

**Fix:** Use a `/g` regex loop to collect all matches per line:
```js
const lineRe = /(?:^|\s|\*\*)(Step\s+(\d+)(?:\.(\d+)|([a-z])))/gi;
let match;
while ((match = lineRe.exec(line)) !== null) {
  const oldLabel = match[1];
  sectionCounter++;
  const newNum = sectionCounter; // use sectionCounter, not baseNum+1
  const newLabel = oldLabel.replace(/Step\s+\d+(?:\.\d+|[a-z])/i, `Step ${newNum}`);
  if (oldLabel !== newLabel) {
    renameMap.set(oldLabel, newLabel);
  }
}
```

---

### CR-03: `discoverCrossFileRefs` picks the first matching file by basename; cross-file refs to files that appear later in iteration order use the wrong rename map

**File:** `scripts/normalize-step-numbers.cjs:330-335`
**Issue:** The target rename-map lookup iterates `renameMaps` and breaks at the first basename match:
```js
for (const [filePath, rMap] of renameMaps) {
  if (path.basename(filePath) === targetBasename) {
    targetRenameMap = rMap;
    break; // stops at first match
  }
}
```
There are 52 basenames shared across `agents/`, `get-shit-done/workflows/`, and `commands/gsd/` (e.g., `execute-phase.md`, `quick.md`, `plan-phase.md`, and 49 others verified by inspection). `SCAN_DIRS` inserts `get-shit-done/workflows/` before `commands/gsd/`, so the workflow's rename map is always chosen. Cross-file refs that specifically point at a command file's decimal steps would silently use the workflow's rename map (a different map or an empty one), producing no cross-file update where one is needed.

**Fix:** Merge rename maps across all files sharing the basename, or resolve the target file using the full path from the reference context:
```js
// Collect all rename maps for files matching targetBasename, merge them
const mergedMap = new Map();
for (const [filePath, rMap] of renameMaps) {
  if (path.basename(filePath) === targetBasename) {
    for (const [k, v] of rMap) mergedMap.set(k, v);
  }
}
if (mergedMap.size === 0) continue;
// Use mergedMap instead of targetRenameMap below
```

## Warnings

### WR-01: `newItem` in Pattern D branch is computed but never read — always-true constant guard

**File:** `scripts/normalize-step-numbers.cjs:184-186`
**Issue:** `newItem` is assigned (`const newItem = \`${newNum}.\`;`) then immediately used only in the condition `oldItem !== newItem`. Since `newNum = intNum + 1`, `oldItem` (`"5."`) and `newItem` (`"6."`) can never be equal for any valid integer — this condition is permanently true and functions as an unconditional block. The variable `newItem` has no other consumer.

**Fix:** Remove the dead variable and the constant-true condition:
```js
// Before:
const oldItem = `${integer}.`;
const newItem = `${newNum}.`;
if (oldItem !== newItem) {
  const oldFull = ...

// After — unconditional:
const oldFull = `${integer}.${patternDMatch[3]}.`;
const newFull = `${newNum}.`;
renameMap.set(oldFull, newFull);
```

---

### WR-02: Line 349 — `oldStep.replace('.', '.')` is a no-op, making the `||` branch permanently dead

**File:** `scripts/normalize-step-numbers.cjs:349`
**Issue:** `String.prototype.replace(string, string)` with identical first and second arguments changes nothing. `oldStep.replace('.', '.')` always equals `oldStep`. The entire `||` branch reduces to the left-hand condition:
```js
if (oldStep === labelNum || oldStep.replace('.', '.') === labelNum)
// is exactly equivalent to:
if (oldStep === labelNum)
```
The dead clause misleads readers into believing some normalization is applied before the comparison.

**Fix:**
```js
// Before:
if (oldStep === labelNum || oldStep.replace('.', '.') === labelNum) {

// After:
if (oldStep === labelNum) {
```

---

### WR-03: `renamed` count in `processFile` reports `renameMap.size` (distinct label pairs), not actual replacements applied

**File:** `scripts/normalize-step-numbers.cjs:429`
**Issue:** After the early-return check on line 425, the code computes:
```js
const renamed = renameMap.size > 0 && result !== original ? renameMap.size : 0;
```
`renameMap.size` is the number of distinct old→new label pairs, not the number of occurrences replaced. If `Step 1.5` appears on 10 lines in a file, `renameMap.size` is still `1`, but 10 replacements were made. The per-file stdout line (`${renamed} rename(s)`) therefore undercounts actual replacements. Additionally, the condition `result !== original` is always true at line 429 (the early return on line 425 already handled the `result === original` case), making the ternary always return `renameMap.size`, never `0` — the `0` branch is dead code.

**Fix:** Count actual replacements inside `applyRenameMap` and return that count:
```js
// In applyRenameMap, add a counter and return it:
let replacementCount = 0;
// Inside the loop:
if (line.includes(oldLabel)) {
  const newLine = line.split(oldLabel).join(newLabel);
  if (newLine !== line) replacementCount++;
  line = newLine;
}
// Change applyRenameMap to return { content, renamed: replacementCount }
// and use that in processFile.
```

---

### WR-04: Test name does not match what is tested; `isNaN` guard is unreachable dead code

**File:** `tests/cross-file-step-refs.test.cjs:312`
**Issue:** The test is named `'skips decimal step refs (whole-integer only — NaN guard)'` and its comment explains that `XREF_PATTERNS` capture `(\d+)` only so `step 5.5` would parse as `5`. However, the test body uses content `'See execute-phase.md step 5 for this.'` — a plain integer reference, not a decimal. The named scenario is never exercised.

Separately, the `isNaN` guard on line 205 (`if (isNaN(stepNum)) continue;`) is unreachable. `XREF_PATTERNS` use `(\d+)` which requires one or more digit characters; `parseInt` on a non-empty digit string always returns a finite integer. `NaN` is structurally impossible here.

**Fix (test name):** Rename to match what is actually tested:
```js
test('detects plain integer step refs in cross-file references', () => {
```

**Fix (NaN guard):** Remove the unreachable guard or replace with an explanatory comment:
```js
// stepNum is always a valid integer: XREF_PATTERNS use (\d+) which guarantees non-empty digits.
const stepNum = parseInt(matchedStep, 10);
```

## Info

### IN-01: `applyRenameMap` uses split-join (plain substring replace) with no word-boundary enforcement

**File:** `scripts/normalize-step-numbers.cjs:234-235`
**Issue:** Label replacement uses `line.split(oldLabel).join(newLabel)` — a plain substring replace. If `oldLabel` is `Step 2.5`, it would also replace any accidental occurrence such as `XStep 2.5` or `[Step 2.5]`. In practice, decimal step labels in these markdown files appear with surrounding delimiters (spaces, `**`, colons), making false matches extremely unlikely. However, the absence of any boundary check is worth noting.

**Fix (optional):** If precision is needed, use a boundary-aware regex:
```js
// Escape the label for use in a regex
const escaped = oldLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
line = line.replace(new RegExp(escaped, 'g'), newLabel);
```

---

### IN-02: Module-level `/gi` regexes in `findCrossFileRefs` are mutated in-place via `lastIndex = 0`

**File:** `tests/cross-file-step-refs.test.cjs:182-184`
**Issue:** `XREF_PATTERNS` contains two `/gi` regexes defined at module scope. Inside `findCrossFileRefs`, the loop resets `re.lastIndex = 0` directly on the shared module-level objects before each `exec` loop. This is safe in single-threaded synchronous Node.js test execution, but is a fragile pattern. The normalize script correctly constructs a fresh `RegExp` per call (line 299), avoiding shared mutable state.

**Fix:** Follow the normalize script pattern:
```js
for (const patternTemplate of XREF_PATTERNS) {
  const re = new RegExp(patternTemplate.source, patternTemplate.flags);
  let m;
  while ((m = re.exec(line)) !== null) { ... }
}
```

---

_Reviewed: 2026-05-31T10:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
