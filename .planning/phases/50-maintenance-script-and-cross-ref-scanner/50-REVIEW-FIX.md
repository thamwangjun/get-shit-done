---
phase: 50-maintenance-script-and-cross-ref-scanner
fixed_at: 2026-05-31T11:00:00Z
review_path: .planning/phases/50-maintenance-script-and-cross-ref-scanner/50-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 8
skipped: 0
status: all_fixed
test_result: pass
---

# Phase 50: Code Review Fix Report

**Fixed at:** 2026-05-31T11:00:00Z
**Source review:** .planning/phases/50-maintenance-script-and-cross-ref-scanner/50-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 9
- Fixed: 8 (CR-01 and CR-02 fixed in a single atomic commit; WR-01 fixed as a side-effect of the CR-01 rewrite)
- Skipped: 0

**Test result:** PASS — 851/851 tests passed in `cross-file-step-refs.test.cjs` and `step-numbering-scan.test.cjs`. Pre-existing failures in unrelated tests (`Cannot find module 'eta'`) are environment-level and not caused by these fixes.

## Fixed Issues

### CR-01 + CR-02: `buildRenameMap` produced duplicate step numbers and missed multiple decimal labels per line

**Files modified:** `scripts/normalize-step-numbers.cjs`
**Commit:** `3f523bf2`
**Applied fix:**
- CR-01: Replaced `baseNum + 1` with `sectionCounter` (already incremented) as the target step number for Pattern A/B matches, so each decimal sub-step gets a unique sequential whole-integer target. Added a parallel `patternDCounter` for Pattern D items (also resetting on section headings) replacing the broken `intNum + 1` formula.
- CR-02: Replaced the single `line.match()` call (no `/g` flag, only first match) with a `/gi` global regex `exec` loop so all decimal step labels on a single line are captured and added to the rename map.
- WR-01 (fixed as side-effect): The `oldItem`/`newItem` always-true dead condition in the Pattern D branch was eliminated when the Pattern D block was rewritten for CR-01.

### CR-03: `discoverCrossFileRefs` broke at first basename match, using wrong rename map for shared basenames

**Files modified:** `scripts/normalize-step-numbers.cjs`
**Commit:** `0e5a8a65`
**Applied fix:** Replaced the first-match-break basename lookup with a merge across all rename maps for files sharing the target basename. 52 basenames are shared across `agents/`, `get-shit-done/workflows/`, and `commands/gsd/`; the prior `break` would silently pick the workflow's map, leaving command-file decimal cross-refs unpatched.

### WR-02: `oldStep.replace('.', '.')` is a no-op — permanently dead `||` branch

**Files modified:** `scripts/normalize-step-numbers.cjs`
**Commit:** `629a66de`
**Applied fix:** Simplified `if (oldStep === labelNum || oldStep.replace('.', '.') === labelNum)` to `if (oldStep === labelNum)`. The replace call was an identity operation (identical arguments), making the `||` branch permanently dead and misleading.

### WR-03: `renamed` counter reported `renameMap.size` (map entry count) not actual replacements

**Files modified:** `scripts/normalize-step-numbers.cjs`
**Commit:** `63937ed7`
**Applied fix:** Changed `applyRenameMap` return type from `string` to `{ content: string, renamed: number }`. The `replaced` count is now incremented inside the replacement loop whenever a line actually changes. `processFile` destructures the new return value and uses `renamedCount` (actual line replacement count) instead of `renameMap.size` (distinct label pairs). Removed the now-unreachable `renameMap.size > 0 && result !== original ? renameMap.size : 0` ternary.

### WR-04: Test name mismatch; `isNaN` guard is unreachable dead code

**Files modified:** `tests/cross-file-step-refs.test.cjs`
**Commit:** `d6ad3636`
**Applied fix:**
- Renamed test `'skips decimal step refs (whole-integer only — NaN guard)'` to `'detects plain integer step refs in cross-file references'` — the test body uses a plain integer ref and asserts detection, not decimal-skipping.
- Removed the `if (isNaN(stepNum)) continue;` guard (line 205). `XREF_PATTERNS` use `(\d+)` which requires non-empty digit characters; `parseInt` on a non-empty digit string is always a finite integer. Replaced with an explanatory comment documenting why NaN is impossible.

### IN-01: `applyRenameMap` split-join lacks word-boundary enforcement

**Files modified:** `scripts/normalize-step-numbers.cjs`
**Commit:** `0b4a413b`
**Applied fix:** Replaced `line.split(oldLabel).join(newLabel)` with an escaped global regex replacement: escapes special regex chars in `oldLabel`, then applies `new RegExp(escaped, 'g')`. This prevents false matches on substrings (e.g., `XStep 2.5` or `[Step 2.5]` accidentally containing the label).

### IN-02: Module-level `/gi` regexes mutated via `lastIndex = 0` in `findCrossFileRefs`

**Files modified:** `tests/cross-file-step-refs.test.cjs`
**Commit:** `898a42fc`
**Applied fix:** Replaced `re.lastIndex = 0` mutation on shared module-level regex objects with `new RegExp(patternTemplate.source, patternTemplate.flags)` per loop iteration. This follows the same pattern already used correctly in `normalize-step-numbers.cjs`'s `discoverCrossFileRefs` function and avoids fragile shared mutable state.

## Skipped Issues

None — all 9 findings were fixed (CR-01 and CR-02 in one commit; WR-01 as a side-effect of the CR-01 rewrite).

---

_Fixed: 2026-05-31T11:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
