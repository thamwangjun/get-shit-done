---
phase: 018-fork-tag-corpus-tests
reviewed: 2026-04-28T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - tests/fork-persona-tag.test.cjs
  - tests/fork-intent-tag.test.cjs
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 018: Code Review Report

**Reviewed:** 2026-04-28
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Two new regression-guard test files for the fork's `<persona>` and `<intent>` tag corpus. Both files are structurally sound and serve a clear purpose. No security issues or data-loss risks were found.

Two warnings require attention: one is a false-positive bug in `fork-intent-tag.test.cjs` where bare `<objective>` lines inside triple-backtick code fences are reported as violations (confirmed in `commands/gsd/research-phase.md`). The other is a detection gap in `fork-persona-tag.test.cjs` where orphaned `</role>` closing tags would survive an upstream partial revert undetected.

Three informational items cover a stale count in a comment, an inconsistent sort between the two test files, and a minor inline-code-span gap in the persona test.

---

## Warnings

### WR-01: Intent test flags `<objective>` inside code fences as false positives

**File:** `tests/fork-intent-tag.test.cjs:43-51`
**Issue:** The bare-line detection loop checks every line of the raw file content without first stripping triple-backtick code fences. `commands/gsd/research-phase.md` contains two `<objective>` blocks inside ` ```markdown ` fences (lines 91 and 151 of that file) — these are documentation examples, not actual directive blocks. The test currently reports them as violations. This means the test produces false positives for at least one file in the current corpus, and the problem will recur for any future command file that documents `<objective>` in an example code block.

**Fix:** Strip code fence regions before scanning lines, mirroring the approach already used in `fork-persona-tag.test.cjs`:
```javascript
test(`${file} does not use bare <task> or <objective> as primary directive block`, () => {
  const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
  // Strip code fence content to avoid false positives on documentation examples
  const withoutFences = content.replace(/```[\s\S]*?```/g, '');
  const lines = withoutFences.split('\n');
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === '<task>') {
      violations.push(`line ${i + 1}: bare <task> block — replace with <intent>`);
    }
    if (trimmed === '<objective>') {
      violations.push(`line ${i + 1}: bare <objective> block — replace with <intent>`);
    }
  }
  assert.deepEqual(
    violations,
    [],
    `${file} uses bare directive block(s) that should be <intent>:\n${violations.join('\n')}`
  );
});
```

Note: After stripping fences the line numbers in violation messages will no longer correspond to original file line numbers. If accurate line numbers are important, a two-pass approach (track fence regions, skip those lines) is preferable.

---

### WR-02: Persona test does not detect orphaned `</role>` closing tags

**File:** `tests/fork-persona-tag.test.cjs:35-44`
**Issue:** The `<role>` absence check uses the regex `/<role>/`, which only matches the opening tag. A partial upstream merge that removes `<persona>` and restores `<role>` as the opening tag would be caught — but a partial revert that only replaces `</persona>` with `</role>` (leaving the opening `<persona>` intact) would pass both tests silently. The block would be malformed: opened with `<persona>` and closed with `</role>`.

**Fix:** Extend the absence check to also reject `</role>`:
```javascript
test(`${file} does not use <role> as persona XML tag`, () => {
  const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
  const withoutFences = content.replace(/```[\s\S]*?```/g, '');
  assert.ok(
    !/<role>/.test(withoutFences),
    `${file} must not use <role> opening tag (outside code fences) — use <persona> instead`
  );
  assert.ok(
    !/<\/role>/.test(withoutFences),
    `${file} must not use </role> closing tag (outside code fences) — use </persona> instead`
  );
});
```

---

## Info

### IN-01: DESIGN NOTE comment states 32 files with `<objective>` but actual count is 33

**File:** `tests/fork-intent-tag.test.cjs:11`
**Issue:** The comment reads "32 command files still use `<objective>`" but the current corpus has 33 files with bare `<objective>` blocks (verified by enumeration). The stale count will mislead maintainers tracking progress on the `<objective>` → `<intent>` migration.

**Fix:** Update the comment to reflect the accurate count, or make it dynamic:
```javascript
// As of 2026-04-28, 33 command files still use <objective> (older upstream convention)
```
Alternatively, remove the specific count from the comment entirely since it will change as the migration proceeds.

---

### IN-02: Agent list in persona test is not sorted; command list in intent test is

**File:** `tests/fork-persona-tag.test.cjs:22-23`
**Issue:** The agents array is produced by `fs.readdirSync()` without `.sort()`. The command list in `fork-intent-tag.test.cjs` (line 34) applies `.sort()` for deterministic ordering. Unsorted test output makes it harder to locate a specific failing agent in CI logs when multiple agents fail simultaneously. Filesystem readdir order is platform-dependent.

**Fix:** Add `.sort()` to the agents array construction:
```javascript
const agents = fs.readdirSync(AGENTS_DIR)
  .filter(f => f.startsWith('gsd-') && f.endsWith('.md'))
  .sort();
```

---

### IN-03: Persona test does not strip inline backtick spans when checking for `<role>`

**File:** `tests/fork-persona-tag.test.cjs:38`
**Issue:** The code-fence stripping regex (`/```[\s\S]*?```/g`) removes triple-backtick blocks but not inline backtick spans (e.g., `` `<role>` ``). If an agent file documents the upstream tag in an inline code span rather than a fenced block — e.g., "Upstream uses `<role>` as the persona wrapper" — the test would report a false positive. No current agent file triggers this, but the gap exists by design asymmetry with the fence-only stripping.

**Fix:** Also strip inline code spans before testing:
```javascript
const withoutFences = content
  .replace(/```[\s\S]*?```/g, '')   // remove fenced blocks
  .replace(/`[^`]+`/g, '');          // remove inline code spans
```

---

_Reviewed: 2026-04-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
