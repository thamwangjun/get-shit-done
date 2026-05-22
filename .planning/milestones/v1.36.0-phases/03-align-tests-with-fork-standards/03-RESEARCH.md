# Phase 3: Align Tests with Fork Standards - Research

**Researched:** 2026-04-16
**Domain:** Node.js test suite maintenance — aligning test assertions with fork-standard file content
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**ios-scaffold-safety.test.cjs (TEST-01, TEST-02)**

- **D-01:** Remove the 2 failing prohibition test assertions — `reference prohibits Package.swift as primary build system for iOS apps` and `reference prohibits .executableTarget for iOS apps`. The positive checks (`project.yml` and `xcodegen` presence) already verify the file provides correct guidance.
- **D-02:** Rationale: test assertions that check for prohibition language (`NEVER`, `prohibited`, `do not`) directly contradict the fork's positive framing standard. The test should validate what the file tells the AI to do, not how strongly it phrases what not to do.
- **D-03:** The remaining 5 assertions in `ios-scaffold-safety.test.cjs` stay unchanged (file existence, project.yml, xcodegen, deployment target, executor reference).

**ios-scaffold.md content**

- **D-04:** Replace the `// Package.swift — DO NOT USE for iOS apps` code comment with a positive equivalent — label it as the wrong pattern rather than issuing a prohibition directive. Suggested form: `// Incorrect — produces macOS CLI, not an iOS app`.
- **D-05:** The section heading `## Critical Rule: Never Use Package.swift as the Primary Build System for iOS Apps` is a valid safety heading — leave unchanged.
- **D-06:** The `**Prohibited pattern:**` subheading is out of scope for this phase (not a failing test assertion, and no REQUIREMENTS.md item targets it).

**bug-patterns-reference.test.cjs (TEST-03)**

- **D-07:** Remove the `content.startsWith('# Common Bug Patterns')` assertion entirely from the `has title and intro` test. The structural tests (at least 5 categories, bold bullets per section, `---` separator) are sufficient. The startsWith check is overly specific to one file format.
- **D-08:** The `content.includes('---')` check inside the same `has title and intro` test can be retained — the file still contains `---` separators.

### Claude's Discretion

- Exact wording for the replacement code comment in ios-scaffold.md (positive label for the wrong pattern)
- Whether to restructure the `has title and intro` test description now that startsWith is removed

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEST-01 | `get-shit-done/references/ios-scaffold.md` contains explicit prohibition language (`NEVER` or `prohibited`) for `Package.swift` as primary build system — passes `ios-scaffold-safety.test.cjs` assertions | D-01/D-02: Remove the 2 failing assertions instead; ios-scaffold.md heading `Never Use Package.swift` provides the safety intent without the rigid keyword check |
| TEST-02 | `get-shit-done/references/ios-scaffold.md` contains explicit prohibition language for `.executableTarget` in iOS app targets — passes second `ios-scaffold-safety.test.cjs` assertion | D-01/D-02: Same as TEST-01 — remove the assertion; the content already makes the correct point positively |
| TEST-03 | `tests/bug-patterns-reference.test.cjs` accepts XML `<task>` opener as a valid file start, not only the legacy `# Common Bug Patterns` heading | D-07: Remove `startsWith('# Common Bug Patterns')` assertion |
| TEST-04 | Full test suite passes (`npm test` — all 3932+ tests green) | All 4 failures identified; 3 addressed by D-01/D-07; 4th (`execute-phase-wave.test.cjs`) identified as additional Phase 2 regression requiring test update |
</phase_requirements>

---

## Summary

Phase 3 is a test-alignment phase. The failing tests are assertions that were written for upstream file content; Phase 2 applied fork standards to those files, making the old assertions incorrect. The correct fix is to update the tests to reflect fork-standard content — not to revert the fork-standard edits.

**Current state (verified by running `npm test`):** 4 tests fail. 3931 pass. The 4 failures are:

1. `tests/ios-scaffold-safety.test.cjs:37` — `reference prohibits Package.swift as primary build system for iOS apps`
2. `tests/ios-scaffold-safety.test.cjs:55` — `reference prohibits .executableTarget for iOS apps`
3. `tests/bug-patterns-reference.test.cjs:43` — `has title and intro` (startsWith assertion)
4. `tests/execute-phase-wave.test.cjs:70` — `workflow has partial-wave completion guardrail`

The first 3 are explicitly addressed by CONTEXT.md decisions. The 4th is a Phase 2 regression not discussed in CONTEXT.md but is required by TEST-04 (all tests must pass). Its fix is clear and consistent with fork standards: update the 2 assertions in `execute-phase-wave.test.cjs` to match the positive-framing replacement text already in `execute-phase.md`.

**Primary recommendation:** Make 3 targeted edits — remove 2 assertion blocks in `ios-scaffold-safety.test.cjs`, remove 1 assertion line in `bug-patterns-reference.test.cjs`, update 2 assertion strings in `execute-phase-wave.test.cjs`, and replace 1 code comment in `ios-scaffold.md`. All 4 failures will resolve. No source files beyond these 4 need changing.

---

## Failure Analysis

### Failure 1 & 2: ios-scaffold-safety.test.cjs (lines 37–71)

**Root cause:** The test checks `content.includes('Package.swift') && (content.includes('NEVER') || ...)`. The fork's Phase 2 modified the body paragraph that originally read `**NEVER use \`Package.swift\` with \`.executableTarget\`...**` to positive framing: `**Use XcodeGen (or Xcode directly)...Package.swift with .executableTarget produces macOS command-line tools...**`.

**What the file currently contains (verified):**
- `content.includes('Package.swift')` — TRUE (line 13 code comment and heading)
- `content.includes('NEVER')` — FALSE (not present; heading has `Never` not `NEVER`)
- `content.includes('never')` — FALSE (heading is title-case `Never`)
- `content.includes('prohibited')` — FALSE (heading has `Prohibited` capital P)
- `content.includes('do not')` — FALSE (code comment has `DO NOT` all caps)
- `content.includes('Do not')` — FALSE
- `content.includes('must not')` — FALSE

The keyword set in the test (`NEVER`, `never`, `prohibited`, `do not`, `Do not`, `must not`) misses `Never` (title-case), `Prohibited` (title-case), and `DO NOT` (all-caps). None of these were in the original upstream NEVER string that was removed.

**D-04 requirement:** Also replace `// Package.swift — DO NOT USE for iOS apps` (line 13 in the Swift code block) with `// Incorrect — produces macOS CLI, not an iOS app`. This replaces the `DO NOT USE` code comment with a positive label, completing the fork-standards conversion for this file.

**Fix:** Remove the 2 failing `test(...)` blocks from `ios-scaffold-safety.test.cjs` (D-01). Replace the code comment in `ios-scaffold.md` (D-04).

### Failure 3: bug-patterns-reference.test.cjs (line 43–52)

**Root cause:** `common-bug-patterns.md` now starts with `<task>` (XML opener per fork standard) instead of `# Common Bug Patterns` (upstream markdown heading). The test's `content.startsWith('# Common Bug Patterns')` assertion fails.

**Verified file state:**
```
Line 1: <task>
Line 2: Before forming any debugging hypothesis...
```

The `content.includes('---')` assertion on line 48 continues to pass — the file contains `---` separators (verified: `contains at least 5 of 10 expected categories` and `each pattern category has at least one bold bullet item` both pass, confirming the file structure is intact).

**Fix:** Remove the `assert.ok(content.startsWith('# Common Bug Patterns'), ...)` assertion (lines 45–48 in the test file) per D-07. Retain the `content.includes('---')` assertion (D-08).

### Failure 4: execute-phase-wave.test.cjs (line 70–84)

**Root cause:** Phase 2 (commit `83f1d01`) converted 2 bare `Do NOT` lines in `execute-phase.md`'s `handle_partial_wave_execution` step from negative to positive framing. The test hardcodes the old text.

**Original text (removed by Phase 2):**
```
- Do NOT run phase verification
- Do NOT mark the phase complete in ROADMAP/STATE
```

**Current text in execute-phase.md (lines 1020–1021):**
```
- Proceed to the next step — phase verification is handled separately
- Leave ROADMAP.md and STATE.md unchanged — the orchestrator handles that update
```

**Test assertions that now fail:**
- `content.includes('Do NOT run phase verification')` — FALSE (text was replaced)
- `content.includes('Do NOT mark the phase complete')` — FALSE (text was replaced)

The `<step name="handle_partial_wave_execution">` assertion continues to pass (step tag still exists at line 1007).

**Fix:** Update the 2 failing `assert.ok` calls in `execute-phase-wave.test.cjs` to match the current positive-framing text. Suggested replacements:
- `content.includes('Do NOT run phase verification')` → `content.includes('phase verification is handled separately')`
- `content.includes('Do NOT mark the phase complete')` → `content.includes('ROADMAP.md and STATE.md unchanged')`

These strings are unique in the file (verified) and correctly characterize the behavior (partial wave runs do not complete phase verification/state).

**Scope note:** This failure was not discussed in CONTEXT.md (which was written before the full test run analysis). It is required by TEST-04 and the fix is consistent with fork standards (updating test to match positive framing, not reverting the framing change).

---

## Standard Stack

No new libraries. All changes are file edits using existing patterns.

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js built-in `node:test` | >=20 | Test runner already in use |
| `node:assert/strict` | built-in | Assertions already in use |
| `npm test` | from package.json | Full test suite runner |

**Run a single test file:**
```bash
node --test tests/ios-scaffold-safety.test.cjs
node --test tests/bug-patterns-reference.test.cjs
node --test tests/execute-phase-wave.test.cjs
```

---

## Architecture Patterns

### Test pattern in use
All affected tests follow the same Node.js built-in pattern:
```javascript
const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

describe('...', () => {
  test('...', () => {
    const content = fs.readFileSync(SOME_PATH, 'utf-8');
    assert.ok(content.includes('some string'), 'failure message');
  });
});
```

Changes are deletion/substitution of `assert.ok(...)` calls. No structural refactoring of test files is needed.

### Minimal-change principle
All 4 fixes are surgical: remove or replace specific assertion lines. Adjacent assertions in the same `test(...)` block must not be disturbed.

---

## Exact Changes Required

This section provides all information the planner needs — no further investigation required.

### Change 1: `tests/ios-scaffold-safety.test.cjs` — Remove 2 test blocks

**File:** `tests/ios-scaffold-safety.test.cjs`

Remove the entire test block at lines 37–53 (inclusive):
```javascript
  test('reference prohibits Package.swift as primary build system for iOS apps', () => {
    const content = fs.readFileSync(IOS_SCAFFOLD_REF, 'utf-8');
    const prohibitsPackageSwift =
      content.includes('Package.swift') &&
      (
        content.includes('NEVER') ||
        content.includes('never') ||
        content.includes('prohibited') ||
        content.includes('do not') ||
        content.includes('Do not') ||
        content.includes('must not')
      );
    assert.ok(
      prohibitsPackageSwift,
      'ios-scaffold.md must explicitly prohibit Package.swift as the primary build system for iOS apps'
    );
  });
```

Remove the entire test block at lines 55–71 (inclusive):
```javascript
  test('reference prohibits .executableTarget for iOS apps', () => {
    const content = fs.readFileSync(IOS_SCAFFOLD_REF, 'utf-8');
    const prohibitsExecutableTarget =
      content.includes('executableTarget') &&
      (
        content.includes('NEVER') ||
        content.includes('never') ||
        content.includes('prohibited') ||
        content.includes('do not') ||
        content.includes('Do not') ||
        content.includes('must not')
      );
    assert.ok(
      prohibitsExecutableTarget,
      'ios-scaffold.md must explicitly prohibit .executableTarget for iOS app targets'
    );
  });
```

**Remaining assertions (must not be disturbed):**
- Line 30: `reference file exists at get-shit-done/references/ios-scaffold.md`
- Line 73: `reference requires project.yml (XcodeGen spec) for iOS app scaffolding`
- Line 81: `reference requires xcodegen generate command`
- Line 89: `reference documents iOS deployment target compatibility`
- Line 107 (describe block): `executor agent references ios-scaffold.md`
- Line 117 (describe block): `universal-anti-patterns.md documents iOS SPM anti-pattern`

### Change 2: `get-shit-done/references/ios-scaffold.md` — Replace code comment

**File:** `get-shit-done/references/ios-scaffold.md`

**Current (line 13):**
```swift
// Package.swift — DO NOT USE for iOS apps
```

**Replace with (D-04, Claude's discretion on exact wording):**
```swift
// Incorrect — produces macOS CLI, not an iOS app
```

**Lines to leave unchanged:**
- Line 7: `## Critical Rule: Never Use Package.swift as the Primary Build System for iOS Apps` (D-05)
- Line 11: `**Prohibited pattern:**` (D-06 — out of scope)

### Change 3: `tests/bug-patterns-reference.test.cjs` — Remove startsWith assertion

**File:** `tests/bug-patterns-reference.test.cjs`

**Current `has title and intro` test (lines 43–53):**
```javascript
  test('has title and intro', () => {
    const content = fs.readFileSync(REFERENCE_PATH, 'utf-8');
    assert.ok(
      content.startsWith('# Common Bug Patterns'),
      'File should start with "# Common Bug Patterns" title'
    );
    assert.ok(
      content.includes('---'),
      'File should contain --- separator after intro'
    );
  });
```

**After change (remove lines 45–48 only):**
```javascript
  test('has title and intro', () => {
    const content = fs.readFileSync(REFERENCE_PATH, 'utf-8');
    assert.ok(
      content.includes('---'),
      'File should contain --- separator after intro'
    );
  });
```

The `content.includes('---')` assertion is retained per D-08. The test description `has title and intro` may be updated to something like `has separator` if the planner exercises Claude's discretion on test naming.

### Change 4: `tests/execute-phase-wave.test.cjs` — Update 2 assertion strings

**File:** `tests/execute-phase-wave.test.cjs`

**Current test block (lines 70–84):**
```javascript
  test('workflow has partial-wave completion guardrail', () => {
    const content = fs.readFileSync(WORKFLOW_PATH, 'utf-8');
    assert.ok(
      content.includes('<step name="handle_partial_wave_execution">'),
      'workflow should have a partial wave handling step'
    );
    assert.ok(
      content.includes('Do NOT run phase verification'),
      'partial wave step should skip phase verification'
    );
    assert.ok(
      content.includes('Do NOT mark the phase complete'),
      'partial wave step should skip phase completion'
    );
  });
```

**After change (update 2 string literals):**
```javascript
  test('workflow has partial-wave completion guardrail', () => {
    const content = fs.readFileSync(WORKFLOW_PATH, 'utf-8');
    assert.ok(
      content.includes('<step name="handle_partial_wave_execution">'),
      'workflow should have a partial wave handling step'
    );
    assert.ok(
      content.includes('phase verification is handled separately'),
      'partial wave step should skip phase verification'
    );
    assert.ok(
      content.includes('ROADMAP.md and STATE.md unchanged'),
      'partial wave step should skip phase completion'
    );
  });
```

**Why these strings:** Both are unique substrings from the positive-framing replacement text already in `execute-phase.md` at lines 1020–1021. Verified unique by grep. The test intent is preserved — it confirms partial wave runs do not trigger phase verification or state updates.

---

## Common Pitfalls

### Pitfall 1: Modifying ios-scaffold.md content beyond D-04
**What goes wrong:** Over-zealous edits that change `**Prohibited pattern:**` subheading or the section heading violate D-05/D-06 and go out of scope.
**Prevention:** Only change line 13 (the code comment inside the Swift code block). Leave everything else unchanged.

### Pitfall 2: Removing the `includes('---')` assertion
**What goes wrong:** D-07 says remove `startsWith` but D-08 explicitly retains `includes('---')`. Removing the entire `has title and intro` test block breaks more than the plan requires.
**Prevention:** Only remove the `content.startsWith(...)` call and its message string — the 4 lines of lines 45–48. Keep the `assert.ok(content.includes('---'), ...)` assertion.

### Pitfall 3: Overlooking the 4th failing test
**What goes wrong:** CONTEXT.md was written before running the test suite. It addresses tests 1–3 but not the `execute-phase-wave.test.cjs` failure. TEST-04 requires ALL tests to pass.
**Prevention:** Change 4 (`execute-phase-wave.test.cjs`) is required for TEST-04 compliance and must be included in the plan.

### Pitfall 4: Reverting execute-phase.md
**What goes wrong:** Restoring `Do NOT run phase verification` to make the old test pass would violate the fork standard — fixing a test by reverting fork changes. This violates the phase goal.
**Prevention:** Update the test assertions, not the workflow file. The workflow's positive framing is the source of truth.

---

## Verification

After all 4 changes, confirm:

```bash
# Individual test files
node --test tests/ios-scaffold-safety.test.cjs
node --test tests/bug-patterns-reference.test.cjs
node --test tests/execute-phase-wave.test.cjs

# Full suite
npm test
```

Expected: `ℹ pass 3935` (was 3931; 4 previously failing tests now pass), `ℹ fail 0`.

Note: `ℹ pass` count increases by 4 because:
- ios-scaffold-safety: 2 failing tests removed (they no longer run, so they don't count as failures; the test count decreases by 2)
- bug-patterns: 1 failing test fixed (assertion removed within test; test still runs, now passes)
- execute-phase-wave: 1 failing test fixed (assertions updated; test still runs, now passes)

Actual pass count after removal of 2 full test blocks: 3931 - 2 removed + 2 now-passing = 3931. The planner should not fixate on the exact pass count — `ℹ fail 0` is the success signal.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The strings `phase verification is handled separately` and `ROADMAP.md and STATE.md unchanged` are unique in `execute-phase.md` | Change 4 | Low — verified by grep during research; test would be overly broad if not unique |

**All other claims verified directly** by reading the files and running `npm test`.

---

## Open Questions

1. **4th failing test scope**
   - What we know: `execute-phase-wave.test.cjs` failure is caused by Phase 2 conversion of `execute-phase.md` — confirmed by `git show 83f1d01`. CONTEXT.md was written before this was identified.
   - What is unclear: Whether the user wants this addressed in Phase 3 Plan 03-01 or as a separate micro-plan. TEST-04 requires it, so it must be in scope.
   - Recommendation: Include Change 4 in Plan 03-01. It is a 2-line test update consistent with the pattern of all other Phase 3 changes.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely file edits (test files and one reference file). No external dependencies.

---

## Sources

### Primary (HIGH confidence)
- `tests/ios-scaffold-safety.test.cjs` — Read directly; lines 37–71 are the failing assertions
- `tests/bug-patterns-reference.test.cjs` — Read directly; line 45 is the failing `startsWith` assertion
- `tests/execute-phase-wave.test.cjs` — Read directly; lines 77–83 are the assertions whose strings no longer exist in the workflow
- `get-shit-done/references/ios-scaffold.md` — Read directly; verified keyword presence with `node -e`
- `get-shit-done/references/common-bug-patterns.md` — Read first 10 lines; confirmed `<task>` opener
- `get-shit-done/workflows/execute-phase.md` — Read lines 1007–1036; confirmed positive-framing replacement text
- `npm test` — Run directly; output: 3931 pass, 4 fail, exact test names confirmed
- `git show 83f1d01` — Confirmed Phase 2 commit that changed execute-phase.md lines 1020–1021

### Secondary (MEDIUM confidence)
- `.planning/phases/03-align-tests-with-fork-standards/03-CONTEXT.md` — User decisions D-01 through D-08
- `.planning/REQUIREMENTS.md` — TEST-01 through TEST-04 definitions

---

## Metadata

**Confidence breakdown:**
- Failure identification: HIGH — run npm test, read source; no ambiguity
- Fix specification: HIGH — exact line numbers, exact strings, verified in files
- Change 4 (execute-phase-wave): HIGH — git history confirms cause; fix strings verified in current file

**Research date:** 2026-04-16
**Valid until:** Until any of the 4 affected files is modified again (stable; no fast-moving dependencies)
