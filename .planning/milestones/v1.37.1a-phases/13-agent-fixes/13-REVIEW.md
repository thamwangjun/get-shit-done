---
phase: 13-agent-fixes
reviewed: 2026-04-22T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - agents/gsd-assumptions-analyzer.md
  - agents/gsd-doc-verifier.md
  - agents/gsd-user-profiler.md
  - agents/gsd-code-fixer.md
  - tests/negative-framing-scan.test.cjs
findings:
  critical: 1
  warning: 2
  info: 0
  total: 3
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-04-22T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Phase 13 made positive-framing text replacements in four agent markdown files and added a new `describe` block in the regression test. Three issues were found:

1. One unconverted bare "do not" directive remains in `gsd-assumptions-analyzer.md` — it was not touched by any of the phase 13 commits, and the new corpus-scan test will flag it and fail.
2. The newly added `describe` block in the test file uses an **identical name** to a pre-existing block added later in the same file, creating duplicate test suite entries that cover the same scope.
3. A meaningful behavioral instruction was deleted from `gsd-code-fixer.md` rather than being reworded; the semantics are partially preserved by a nearby sentence but the deletion weakens the directive in the early-exit path.

---

## Critical Issues

### CR-01: Unconverted bare "do not" in gsd-assumptions-analyzer.md causes new test to fail

**File:** `agents/gsd-assumptions-analyzer.md:110`
**Issue:** Line 110 contains `- Do NOT include time estimates or complexity assessments`. This line has no positive complement (no em-dash, no double-dash, no parenthetical, no follow-on sentence), so `scanForNegativeFraming()` classifies it as a bare "DO NOT" violation. The phase 13 pass converted only line 111 (`Do NOT generate more areas`) — line 110 was skipped. The new corpus-scan test added by commit `03fccff` (`'no bare DO NOT directives in agent files'`) will encounter this line and fail.

**Fix:**
```markdown
- Exclude time estimates and complexity assessments from your output
```

or following the constraint-pair pattern already used on adjacent lines:

```markdown
- Do NOT include time estimates or complexity assessments -- scope output to the dimensions defined above
```

---

## Warnings

### WR-01: Duplicate describe block name in test file causes silent test duplication

**File:** `tests/negative-framing-scan.test.cjs:400`
**Issue:** The new `describe('corpus scan — DO NOT primary directives (case-insensitive)', ...)` block added at line 400 uses the **exact same description string** as the pre-existing block at line 542. Node's built-in test runner does not enforce unique names — both blocks run, with both named identically in output. This makes test results ambiguous (two separate pass/fail entries with the same label) and the agent-only subtest at line 406 (`'no bare DO NOT directives in agent files'`) is a strict duplicate of the same-named subtest at line 548 inside the later block, which also scans agent files. The new block adds no coverage beyond what the later block already provides.

**Fix:** Remove the new `describe` block at lines 400-427. The later, broader block at lines 542-635 already scans agent files with the same logic:

```diff
-// ─── Corpus scan: DO NOT primary directive (agent files) ─────────────────────
-//
-// After the v1.37.1a positive framing pass (phase 13), all bare "DO NOT"
-// ...
-describe('corpus scan — DO NOT primary directives (case-insensitive)', () => {
-  ...
-});
-
 // ─── Corpus scan: NEVER primary directive ──────────────────────────────────
```

If the phase 13 intent was specifically to add an agent-only guard as a stepping-stone before phase 14 adds the remaining subtests, rename the new block to distinguish it:

```js
describe('corpus scan — DO NOT primary directives in agent files (phase 13)', () => {
```

### WR-02: Deletion of "Do NOT create REVIEW-FIX.md" removes an explicit guard without substitution

**File:** `agents/gsd-code-fixer.md:237` (pre-edit line)
**Issue:** The early-exit path in `<step name="load_context">` previously had three instructions for the clean/skipped case:
1. Exit with message
2. **Do NOT create REVIEW-FIX.md**  ← deleted
3. Exit code 0

The deleted line was the only directive in that step telling the agent not to create the output artifact on early exit. After the deletion the step reads:

```markdown
If status is `"clean"` or `"skipped"`:
- Exit with message: "No issues to fix -- REVIEW.md status is {status}."
- Exit code 0 (not an error, just nothing to do)
```

An equivalent instruction does exist at the bottom of `<step name="write_fix_report">` — `DO NOT commit REVIEW-FIX.md — orchestrator handles commit` — but that instruction governs *committing*, not *creating*, the file. An agent following the early-exit path will not reach the write_fix_report step at all, so if it produces REVIEW-FIX.md before exiting, nothing stops it. The original explicit prohibition was the correct guard.

**Fix:** Re-add the instruction as an affirmative constraint pair rather than a bare "do not":

```markdown
If status is `"clean"` or `"skipped"`:
- Exit with message: "No issues to fix -- REVIEW.md status is {status}."
- Exit code 0 (not an error, just nothing to do)
- Skip REVIEW-FIX.md creation entirely — the orchestrator expects no artifact when status is clean or skipped.
```

---

_Reviewed: 2026-04-22T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
