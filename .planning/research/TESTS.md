# Test Suite Health Assessment — Post v1.36.0 Upstream Merge

**Branch:** `thamw-main`
**Merge:** upstream v1.36.0 (`041c2a5`)
**Run date:** 2026-04-15
**Node test runner:** built-in (`node --test`)

---

## Summary

| Metric | Count |
|--------|-------|
| Total tests | 3935 |
| Passing | 3932 |
| Failing | 3 |
| Skipped | 0 |

The merge commit (`041c2a5`) itself noted "5 upstream test failures deferred as follow-up" — so these failures were anticipated. All 3 current failures are accounted for.

---

## Failing Tests

| # | Test Name | Test File | Failure Assertion | Classification | Priority |
|---|-----------|-----------|-------------------|----------------|----------|
| 1 | `has title and intro` | `tests/bug-patterns-reference.test.cjs:43` | `File should start with "# Common Bug Patterns" title` | Fork-standards conflict | Medium |
| 2 | `reference prohibits Package.swift as primary build system for iOS apps` | `tests/ios-scaffold-safety.test.cjs:37` | `ios-scaffold.md must explicitly prohibit Package.swift as the primary build system for iOS apps` | Upstream regression | High |
| 3 | `reference prohibits .executableTarget for iOS apps` | `tests/ios-scaffold-safety.test.cjs:55` | `ios-scaffold.md must explicitly prohibit .executableTarget for iOS app targets` | Upstream regression | High |

---

## Detailed Analysis

### Failure 1 — `has title and intro` (bug-patterns-reference.test.cjs:43)

**Classification:** Fork-standards conflict

**Root cause:** The fork's revision plan commit `1e2849e` ("executed plans/01-REVISION_PLAN_V01.md and positive reframing") removed the `# Common Bug Patterns` Markdown heading from the top of `get-shit-done/references/common-bug-patterns.md` and replaced it with `<task>` / `<context>` XML wrapper blocks. This is a deliberate fork standard: reference files use XML wrapper elements rather than Markdown headings, matching the fork's convention for agent prompt fragments.

**What the test asserts:**
```js
assert.ok(
  content.startsWith('# Common Bug Patterns'),
  'File should start with "# Common Bug Patterns" title'
);
```

**What the file actually starts with (current fork state):**
```xml
<task>
Before forming any debugging hypothesis, scan this checklist for matching patterns...
</task>

<context>
Patterns are ordered by frequency...
</context>
```

**What upstream had (commit `820543e`):**
```
# Common Bug Patterns

Checklist of frequent bug patterns to scan before forming hypotheses...
```

**Other tests in this file:** Pass. `reference file exists`, `contains at least 5 of 10 expected categories`, `each pattern category has at least one bold bullet item`, and all debugger-agent cross-reference tests pass. Only the title assertion fails.

**Recommended action:** Update the test to remove the title assertion (or loosen it to accept either a `# Common Bug Patterns` heading OR a `<task>` opener). The fork standard of XML wrappers without Markdown headings applies to this file and is intentional. The test should not enforce upstream heading style. The simplest fix:

```js
// Replace the startsWith assertion with presence check:
assert.ok(
  content.includes('Common Bug Patterns') ||
  content.includes('<task>'),
  'File should have title or task wrapper'
);
```

Or remove the title sub-assertion and keep only the `---` separator check.

---

### Failure 2 — `reference prohibits Package.swift as primary build system` (ios-scaffold-safety.test.cjs:37)

**Classification:** Upstream regression

**Root cause:** The upstream commit `c8ab20b` introduced both `get-shit-done/references/ios-scaffold.md` and `tests/ios-scaffold-safety.test.cjs` together. The upstream file included a bold body sentence `**NEVER use \`Package.swift\`...` which satisfies `content.includes('NEVER')`. When the fork's merge commit (`041c2a5`) incorporated `ios-scaffold.md`, it applied the fork's positive-framing convention and transformed the content — dropping the `**NEVER use...` sentence and replacing the prohibition expression with a heading `## Critical Rule: Never Use Package.swift...`. The heading uses `Never` (capital N only), not `NEVER`, `never`, or any other string the test checks.

**What the test asserts (simplified):**
```js
const prohibitsPackageSwift =
  content.includes('Package.swift') &&
  (
    content.includes('NEVER') ||    // uppercase
    content.includes('never') ||    // lowercase
    content.includes('prohibited') ||
    content.includes('do not') ||   // lowercase
    content.includes('Do not') ||
    content.includes('must not')
  );
assert.ok(prohibitsPackageSwift, '...');
```

**What the current file contains re: prohibition:**
- Line 7: `## Critical Rule: Never Use Package.swift...` — `Never` (title case, matches none of the 6 checked strings)
- Line 11: `**Prohibited pattern:**` — `Prohibited` (capital P, does not match `prohibited` lowercase)
- Line 13: `// Package.swift — DO NOT USE for iOS apps` — `DO NOT` (not `do not`)

**What upstream had (commit `c8ab20b`):**
```
**NEVER use `Package.swift` with `.executableTarget` (or `.target`) to scaffold an iOS app.**
```

**Recommended action:** The file content must be updated to re-add explicit prohibition language that the test can detect. Since the test was written in the same commit as the file, it was clearly the author's intent for the file to contain `NEVER`. The least-invasive fix is to restore the bold `NEVER` sentence that was removed during the fork merge, as it is accurate safety guidance regardless of framing preference:

Add to the file body (immediately after the `---` on line 5, before the heading):

```
**NEVER use `Package.swift` with `.executableTarget` for iOS apps — it produces a macOS command-line binary, not an iOS `.app` bundle.**
```

This satisfies `content.includes('NEVER')` without changing the file's structural heading style.

---

### Failure 3 — `reference prohibits .executableTarget for iOS apps` (ios-scaffold-safety.test.cjs:55)

**Classification:** Upstream regression (same root cause as Failure 2)

**Root cause:** Identical to Failure 2. The file contains `.executableTarget` (passes that part of the check) but does not contain any of the 6 prohibition strings in a case-sensitive match. The current file has `DO NOT USE` in a code comment but that does not match `do not` (lowercase) or `Do not`.

**What the test asserts (simplified):**
```js
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
assert.ok(prohibitsExecutableTarget, '...');
```

**Recommended action:** Same fix as Failure 2. Once `NEVER` is added to the file, both tests 2 and 3 will pass with a single content change (both check the same prohibition string set).

---

## Recommended Fix Order

### Fix 1 (High priority) — Restore `NEVER` prohibition language to `ios-scaffold.md`

Both ios-scaffold failures (tests 2 and 3) are resolved by a single content change to `get-shit-done/references/ios-scaffold.md`. Add a bold `NEVER` sentence near the top of the prohibition section. This is accurate content — the file's intent is explicitly to prohibit this pattern — so the fix restores safety guidance that was accidentally dropped during the merge reformat.

**File to edit:** `get-shit-done/references/ios-scaffold.md`

**Change:** After line 5 (`---`) add:

```markdown
**NEVER use `Package.swift` with `.executableTarget` for iOS apps — it produces a macOS CLI binary, not an iOS `.app` bundle, and cannot be deployed to any iOS device or the App Store.**
```

Or restore it inline on line 9 (the bold intro sentence) as the upstream had it.

**Expected outcome:** Tests 2 and 3 both pass. The `Prohibited` keyword on line 11 also becomes redundant but harmless.

---

### Fix 2 (Medium priority) — Update `bug-patterns-reference.test.cjs` title assertion

The fork intentionally replaced the Markdown heading with XML wrapper blocks in `common-bug-patterns.md`. The test's `startsWith('# Common Bug Patterns')` assertion enforces upstream structure that the fork does not use. The test should be updated to reflect the fork's convention.

**File to edit:** `tests/bug-patterns-reference.test.cjs`

**Change:** In the `has title and intro` test (lines 43–53), replace the `startsWith` assertion so it accepts the fork's `<task>` wrapper as a valid opener:

```js
test('has title and intro', () => {
  const content = fs.readFileSync(REFERENCE_PATH, 'utf-8');
  assert.ok(
    content.startsWith('# Common Bug Patterns') || content.startsWith('<task>'),
    'File should start with "# Common Bug Patterns" title or <task> wrapper'
  );
  assert.ok(
    content.includes('---') || content.includes('</task>'),
    'File should contain --- separator or closing </task> tag after intro'
  );
});
```

**Expected outcome:** Test 1 passes. All other tests in the file (which already pass) are unaffected.

---

## Tests That Already Pass (Notable Context)

These ios-scaffold and bug-patterns tests pass cleanly, confirming partial content alignment:

- `reference file exists at get-shit-done/references/ios-scaffold.md` — PASS
- `reference requires project.yml (XcodeGen spec)` — PASS
- `reference requires xcodegen generate command` — PASS
- `reference documents iOS deployment target compatibility` — PASS
- `executor agent references ios-scaffold.md` — PASS
- `universal-anti-patterns.md documents Package.swift misuse for iOS apps` — PASS
- `reference file exists` (common-bug-patterns) — PASS
- `contains at least 5 of 10 expected categories` — PASS
- `each pattern category has at least one bold bullet item` — PASS
- `gsd-debugger.md references common-bug-patterns.md` — PASS
- `reference is inside <required_reading> block` — PASS

No frontmatter regressions detected. All `agent-frontmatter.test.cjs` tests pass.

---

## Notes on "5 Deferred Failures"

The merge commit message states "5 upstream test failures deferred as follow-up". Only 3 failures exist now. Either two were resolved during merge conflict resolution, or the count in the message was approximate. No further investigation needed — the 3 current failures are fully explained above.
