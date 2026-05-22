---
phase: 10-test-suite-green
reviewed: 2026-04-19T00:00:00Z
depth: standard
files_reviewed: 26
files_reviewed_list:
  - hooks/gsd-check-update-worker.js
  - agents/gsd-advisor-researcher.md
  - agents/gsd-ai-researcher.md
  - agents/gsd-assumptions-analyzer.md
  - agents/gsd-codebase-mapper.md
  - agents/gsd-code-fixer.md
  - agents/gsd-code-reviewer.md
  - agents/gsd-debugger.md
  - agents/gsd-debug-session-manager.md
  - agents/gsd-doc-verifier.md
  - agents/gsd-doc-writer.md
  - agents/gsd-domain-researcher.md
  - agents/gsd-eval-auditor.md
  - agents/gsd-eval-planner.md
  - agents/gsd-executor.md
  - agents/gsd-framework-selector.md
  - agents/gsd-intel-updater.md
  - agents/gsd-pattern-mapper.md
  - agents/gsd-phase-researcher.md
  - agents/gsd-plan-checker.md
  - agents/gsd-planner.md
  - agents/gsd-research-synthesizer.md
  - agents/gsd-security-auditor.md
  - agents/gsd-ui-checker.md
  - agents/gsd-verifier.md
  - tests/secure-phase.test.cjs
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-04-19T00:00:00Z
**Depth:** standard
**Files Reviewed:** 26
**Status:** issues_found

## Summary

Reviewed one JavaScript hook file, 24 agent markdown files, and one test file. The agent markdown files are source code (prompt templates consumed by Claude) and were reviewed for structural correctness, logic errors, and quality issues.

The hook file (`gsd-check-update-worker.js`) has multiple silent error-swallowing catch blocks that mask failures across its key operations. The test file has a minor reliability concern with unprotected `readFileSync` calls following existence assertions. One agent (`gsd-intel-updater.md`) has a missing XML closing tag. The `gsd-doc-writer.md` has a mis-numbered critical rule that could confuse agents executing against it. No security vulnerabilities or data loss risks were found.

## Warnings

### WR-01: Pervasive Silent Error Swallowing in Update Worker

**File:** `hooks/gsd-check-update-worker.js:31`
**Issue:** Four separate `catch (e) {}` blocks silently discard errors across the file's core operations: reading the version file (line 31), reading each hook file for version headers (line 74), a second catch for the hook directory scan (line 77), and writing the cache result (line 94). When any of these fail — e.g., permission denied, corrupted file, disk full — the worker silently produces incorrect output (`installed: 'unknown'`, missing stale hooks, or no cache written) with no observable signal. This makes the update check appear to succeed when it has actually malfunctioned.
**Fix:** At minimum, log errors to stderr (which the parent process can capture) rather than discarding them. For the cache write failure specifically, a silent fail means the parent hook will never show update status:

```javascript
// Line 31 — version file read
try {
  if (fs.existsSync(projectVersionFile)) {
    installed = fs.readFileSync(projectVersionFile, 'utf8').trim();
    configDir = path.dirname(path.dirname(projectVersionFile));
  } else if (fs.existsSync(globalVersionFile)) {
    installed = fs.readFileSync(globalVersionFile, 'utf8').trim();
    configDir = path.dirname(path.dirname(globalVersionFile));
  }
} catch (e) {
  process.stderr.write('[gsd-check-update-worker] version read error: ' + e.message + '\n');
}

// Line 94 — cache write
try {
  fs.writeFileSync(cacheFile, JSON.stringify(result));
} catch (e) {
  process.stderr.write('[gsd-check-update-worker] cache write error: ' + e.message + '\n');
}
```

---

### WR-02: `writeResult` Captures `latest` by Reference Before Assignment

**File:** `hooks/gsd-check-update-worker.js:85-96`
**Issue:** The `writeResult` function at line 85 references the outer variable `latest` (declared `let latest = null` at line 98). Due to JavaScript hoisting, `let` variables are not hoisted to their initializer — `latest` is in the temporal dead zone until line 98 executes. In practice this works because `writeResult` is only *called* after line 98, but the function closure captures a mutable binding that has no value at function-definition time. More critically, `writeResult` is called both in `res.on('end', ...)` (line 119, after `latest` is set) and in the error/timeout handlers (lines 123–124, where `latest` remains `null`). This is the intended behavior, but it relies on implicit temporal ordering that is fragile and non-obvious.

The specific risk: if a future refactor moves `let latest = null` or calls `writeResult` in a different order, `latest` could be `undefined` (pre-declaration) rather than `null`, and `isNewer(undefined, installed)` would return `false` via `!!undefined` — silently showing no update available when the network call was never attempted.
**Fix:** Pass `latest` as an explicit parameter to `writeResult` to make the dependency explicit:

```javascript
function writeResult(latestSha) {
  const result = {
    update_available: latestSha && isNewer(latestSha, installed),
    installed,
    latest: latestSha || 'unknown',
    checked: Math.floor(Date.now() / 1000),
    stale_hooks: staleHooks.length > 0 ? staleHooks : undefined,
  };
  if (cacheFile) {
    try { fs.writeFileSync(cacheFile, JSON.stringify(result)); } catch (e) {}
  }
}

// Callers:
res.on('end', () => {
  // ... set latestSha from parse ...
  writeResult(latestSha);
});
req.on('error', () => writeResult(null));
req.on('timeout', () => { req.destroy(); writeResult(null); });
```

---

### WR-03: `gsd-doc-writer.md` Critical Rules Mis-numbered — Rule 8 Appears Between Rules 3 and 4

**File:** `agents/gsd-doc-writer.md:601-611`
**Issue:** The `<critical_rules>` section lists rules numbered 1, 2, 3, 8, 4, 5, 6, 7. Rule 8 ("Only use the Write tool with the full file content as a string parameter") is inserted between rules 3 and 4, breaking the sequential numbering. An agent reading these rules encounters rule 8 mid-list, which may cause it to skip or misinterpret the rule as belonging to a different section. The numbering gap (4-7 missing before the out-of-order 8) suggests the rule was inserted manually and the list was not renumbered.
**Fix:** Renumber the rules sequentially. Move rule 8 to its correct position as rule 4 (or append it as rule 8 after rule 7), and renumber the remaining rules accordingly:

```markdown
<critical_rules>

1. Generated docs describe the target project exclusively; ...
2. Treat CHANGELOG.md as out of scope; ...
3. ALWAYS include the GSD marker ...
4. Only use the Write tool with the full file content as a string parameter.
5. ALWAYS explore the actual codebase before writing ...
6. Use `<!-- VERIFY: {claim} -->` markers ...
7. In update mode, PRESERVE user-authored content ...
8. In supplement mode, only append missing sections. ...

</critical_rules>
```

---

### WR-04: `gsd-intel-updater.md` Missing Closing `</success_criteria>` XML Tag

**File:** `agents/gsd-intel-updater.md:290`
**Issue:** The `<success_criteria>` block is opened at line 290 but is never closed with `</success_criteria>`. The `<structured_returns>` section begins at line 298 without a preceding closing tag. Agents that parse XML-delimited sections (which the executor and planner do for `<execution_flow>`, `<task>`, etc.) may consume the `<structured_returns>` content as part of the `<success_criteria>` block, causing the completion markers (`## INTEL UPDATE COMPLETE`, `## INTEL UPDATE FAILED`) to be misattributed.
**Fix:** Add the closing tag before `<structured_returns>`:

```markdown
<success_criteria>
- [ ] All 5 intel files written to .planning/intel/
- [ ] All JSON files are valid, parseable JSON
- [ ] All entries reference actual file paths verified by Glob/Read
- [ ] .last-refresh.json written with hashes
- [ ] Completion marker returned
</success_criteria>

<structured_returns>
```

---

## Info

### IN-01: Test File Uses Unguarded `readFileSync` After Existence Assertion

**File:** `tests/secure-phase.test.cjs:39`
**Issue:** Multiple `describe` blocks follow the pattern: one `test` asserts the file exists with `fs.existsSync`, then a separate `test` calls `fs.readFileSync` without a guard. If the existence test is skipped or a test runner runs them out of order, the `readFileSync` calls will throw an uncaught exception rather than failing with the assertion message. This does not affect sequential node:test execution but reduces test reliability in other contexts.
**Fix:** Either combine existence check with content reading in a single test, or wrap `readFileSync` calls defensively:

```javascript
test('has valid frontmatter with name, description, tools, color', () => {
  if (!fs.existsSync(agentPath)) {
    assert.fail('agent file does not exist — run existence test first');
  }
  const content = fs.readFileSync(agentPath, 'utf-8');
  // ...
});
```

---

### IN-02: `gsd-check-update-worker.js` — `cacheFile` Undefined Path Not Validated Early

**File:** `hooks/gsd-check-update-worker.js:16`
**Issue:** `cacheFile` is assigned from `process.env.GSD_CACHE_FILE` with no fallback (unlike `projectVersionFile` and `globalVersionFile` which default to `''`). If the env var is not set, `cacheFile` is `undefined`. The `if (cacheFile)` guard at line 93 correctly handles this, but the undefined propagates silently through the entire execution. A developer invoking the worker directly without setting env vars will see no output and no error — a confusing failure mode.
**Fix:** Add an early guard or default at the top of the file to make the missing env var explicit:

```javascript
const cacheFile = process.env.GSD_CACHE_FILE;
if (!cacheFile) {
  process.stderr.write('[gsd-check-update-worker] GSD_CACHE_FILE not set — results will not be cached\n');
}
```

---

### IN-03: `gsd-advisor-researcher.md` Tool Strategy References Non-Existent MCP Method

**File:** `agents/gsd-advisor-researcher.md:123`
**Issue:** The `<tool_strategy>` section references `mcp__context7__query-docs` as step 2 in the Context7 flow (line 123), but the `<documentation_lookup>` section at line 35 correctly specifies `mcp__context7__get-library-docs` as the method name. The tool strategy block uses an inconsistent method name (`query-docs` vs `get-library-docs`). An agent following the tool strategy section would invoke a non-existent tool and silently fail.
**Fix:** Update line 123 to match the correct method name:

```markdown
**Context7 flow:**
1. `mcp__context7__resolve-library-id` with libraryName
2. `mcp__context7__get-library-docs` with resolved ID + specific query
```

---

### IN-04: `gsd-security-auditor.md` — `Edit` Tool Listed But Not Addressed in Critical Rules

**File:** `agents/gsd-security-auditor.md:6`
**Issue:** The agent's `tools` frontmatter includes `Edit` (line 6), but the `<critical_rules>` section only contains one rule: "Only use the Write tool with the full file content as a string parameter." This creates an implicit inconsistency — the agent is allowed to use `Edit` by its tool grant but the only write rule restricts to `Write`. Other agents with `Edit` access typically either explicitly permit both or clarify which is preferred. For a security-auditor that is supposed to be READ-ONLY on implementation files, the presence of `Edit` in the tool list contradicts the persona rule "Implementation files are READ-ONLY."
**Fix:** Either remove `Edit` from the tools list (since the agent is read-only on implementation files) or add an explicit rule clarifying that `Edit` is only permitted for updating SECURITY.md:

```yaml
tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
```

---

### IN-05: `gsd-intel-updater.md` — Missing Closing `</execution_flow>` Tag

**File:** `agents/gsd-intel-updater.md:200`
**Issue:** The `<execution_flow>` tag is opened at line 200 ("`<execution_flow>`") as a heading, but the section ends with `## Partial Updates` and `## Output Budget` subsections — none of which are enclosed in a closing `</execution_flow>` tag. Other agents (e.g., `gsd-executor.md`, `gsd-debugger.md`) close their `<execution_flow>` sections with `</execution_flow>`. The missing close tag means the execution flow section bleeds into `<critical_rules>` and `<anti_patterns>`, potentially confusing XML-aware parsers.
**Fix:** Add `</execution_flow>` before the `<success_criteria>` block:

```markdown
## Output Budget

| File | Target | Hard Limit |
...

</execution_flow>

<success_criteria>
```

---

_Reviewed: 2026-04-19T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
