---
phase: 07-merge-and-conflict-resolution
reviewed: 2026-04-17T18:53:44Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - hooks/gsd-check-update-worker.js
  - bin/install.js
  - tests/agent-frontmatter.test.cjs
  - agents/gsd-codebase-mapper.md
  - agents/gsd-debugger.md
  - agents/gsd-executor.md
  - agents/gsd-intel-updater.md
  - agents/gsd-phase-researcher.md
  - agents/gsd-planner.md
  - agents/gsd-research-synthesizer.md
  - agents/gsd-verifier.md
  - get-shit-done/workflows/execute-phase.md
  - get-shit-done/workflows/map-codebase.md
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 7: Code Review Report

**Reviewed:** 2026-04-17T18:53:44Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

This review covers the Phase 7 merge of upstream v1.37.1 into the fork, including three
JavaScript files (the fork's patched critical files preserved during merge) and ten agent/workflow
Markdown files that were restored from upstream and then had NEVER-to-positive-framing fixes applied.

The JavaScript files are clean with no security vulnerabilities or logic errors. The hook worker
correctly handles SHA normalization, stale-hook detection, and network failures. The installer
handles edge cases (WSL detection, JSONC parsing, null-return from `readSettings`) well.

The test file is generally solid but contains one logic gap in the heredoc detection test.
The agent files and workflow files are well-structured; the positive framing changes (removing
"NEVER use heredoc" → "Only use the Write tool") are consistent across all reviewed files.
Three warnings and three info items were found; none are blockers.

## Warnings

### WR-01: Heredoc-detection test incorrectly skips lines containing "NEVER"

**File:** `tests/agent-frontmatter.test.cjs:53`
**Issue:** The "no active heredoc patterns" test skips any line that includes the word `NEVER`
before checking for `^cat\s+<<\s*'?EOF'?\s*>`. This was designed to avoid false positives from
the old anti-heredoc instruction text ("NEVER use `cat << 'EOF'`"). However, the Phase 7 change
replaced "NEVER" phrasing with positive framing ("Only use the Write tool"). The skip guard now
has no beneficial effect against the anti-heredoc instruction text but would still silently allow
an actual heredoc line like `cat << 'EOF' > file.txt` to pass if someone added the word "NEVER"
elsewhere on the same line (e.g., a comment). More critically: if a future agent reintroduces
the old "NEVER use heredoc" anti-instruction verbatim, the guard would again prevent detection of
heredocs that appear on lines containing "NEVER", even if those heredocs are real instructions
rather than references. The guard has become a dormant false-negative risk.

**Fix:** Remove the `line.includes('NEVER')` guard — it is no longer needed given positive
framing is now the standard. The `line.trim().startsWith('``\`')` guard correctly handles
code-fence lines.

```javascript
// Before (line 53):
if (line.includes('NEVER') || line.trim().startsWith('```')) continue;

// After:
if (line.trim().startsWith('```')) continue;
```

---

### WR-02: `readSettings` null return not handled in `getCommitAttribution`

**File:** `bin/install.js:682-700` (approximately)
**Issue:** `readSettings()` returns `null` when the settings file is malformed (parse failure),
and returns `{}` when the file is absent. The code in `getCommitAttribution` checks
`if (!settings || ...)` which correctly handles the `null` case. However, in the `gemini` branch
(line ~687) the check is `if (!settings || !settings.attribution || ...)` — this is correct.
But for the `opencode`/`kilo` branch (lines ~679-683), the pattern is:

```javascript
const config = readSettings(resolveConfigPath(getGlobalDir(runtime, null)));
result = (config && config.disable_ai_attribution === true) ? null : undefined;
```

If `readSettings` returns `null` (malformed file), `config` is falsy, so the ternary evaluates
to `undefined`. This silently falls through to the default (attribution enabled), hiding the
malformed-file warning that `readSettings` already printed. The behavior is defensively correct
but the code does not document this intent, creating a subtle maintenance hazard where someone
might later tighten the condition and break the null path.

**Fix:** Add a brief comment to document the intentional null handling:

```javascript
// readSettings returns null on parse error (already warned); treat as "no config" (attribution on by default).
const config = readSettings(resolveConfigPath(getGlobalDir(runtime, null)));
result = (config && config.disable_ai_attribution === true) ? null : undefined;
```

---

### WR-03: `gsd-intel-updater.md` has a malformed `<required_reading>` block

**File:** `agents/gsd-intel-updater.md:9-13`
**Issue:** The `<required_reading>` block contains prose instructions rather than a file list.
Every other agent that uses `<required_reading>` (e.g., `gsd-debugger.md`, `gsd-verifier.md`)
lists actual `@~/.claude/...` file references inside the block. The intel-updater's block
instead contains a plain-text instruction:

```
<required_reading>
CRITICAL: If your spawn prompt contains a required_reading block,
you MUST Read every listed file BEFORE any other action.
Skipping this causes hallucinated context and broken output.
</required_reading>
```

This is semantically backwards: the block is the standard location where required files are
listed, but this agent uses it to explain _what_ the block means rather than to list files.
The instruction is also misleading — it tells the agent "if your spawn prompt contains a
required_reading block" but the agent IS the spawn prompt, so the instruction can never be
applied as written. The `mandatory-initial-read.md` reference in other agents (via
`@~/.claude/get-shit-done/references/mandatory-initial-read.md`) provides the canonical version
of this instruction. This block should either be replaced with an `@` reference to that file or
removed entirely if the intel-updater genuinely has no required reading.

**Fix:** Replace the prose block with the canonical `@` reference pattern used by other agents,
or remove if no required files exist:

```markdown
<required_reading>
@~/.claude/get-shit-done/references/mandatory-initial-read.md
</required_reading>
```

## Info

### IN-01: `gsd-check-update-worker.js` — `latest` variable declared after `writeResult` uses it

**File:** `hooks/gsd-check-update-worker.js:86,97`
**Issue:** `writeResult()` (defined at line 84) references the variable `latest`, which is
declared with `let latest = null` at line 97 — after the function definition. In JavaScript,
`let` declarations are not hoisted with an initializer, so `latest` is in the temporal dead
zone between lines 84-97. This is not a bug in practice because `writeResult()` is never
called before line 97 (it is only called from the `https.get` callbacks and the catch block,
all of which are after line 97). However, the declaration order creates a non-obvious code
structure where a function references a variable declared below it. This is a code quality risk
for future maintainers who might add an early call to `writeResult()`.

**Fix:** Move `let latest = null;` before the `writeResult` function definition (around line 83):

```javascript
let latest = null;

function writeResult() {
  const result = {
    update_available: latest && isNewer(latest, installed),
    ...
  };
  ...
}
```

---

### IN-02: `execute-phase.md` — `--no-verify` used in worktree mode without hook re-validation

**File:** `get-shit-done/workflows/execute-phase.md:465-466`
**Issue:** Executor agents in worktree mode are instructed to use `--no-verify` on all git
commits. The workflow includes a post-wave hook validation step (step 5) that runs
`git hook run pre-commit`. However, this step only runs after the entire wave completes and
only when parallel mode is active — it is skipped in sequential mode. The skip means that
for sequential worktree execution, hooks are bypassed with no compensating validation.
This is an existing design issue (not introduced in Phase 7) but worth documenting.

**Fix:** Consider adding a note in the sequential execution path that hooks are bypassed, or
conditionally remove `--no-verify` when sequential execution is detected:

```
# In sequential worktree execution, remove --no-verify so hooks run naturally.
# Post-wave hook validation (step 5) only runs in parallel mode.
```

---

### IN-03: `gsd-research-synthesizer.md` uses `cat` bash commands instead of Read tool

**File:** `agents/gsd-research-synthesizer.md:52-55`
**Issue:** The exploration step instructs the agent to use `cat .planning/research/STACK.md`
etc. in bash. This contradicts the project convention used in `gsd-intel-updater.md` which
explicitly states "Use Glob, Read, and Grep tools — not Bash `ls`, `find`, or `cat`. Bash
file commands fail on Windows." The `gsd-research-synthesizer` is likely only used in
Unix-like environments (given it reads from `.planning/research/`), so this is low-risk in
practice. But it is an inconsistency worth addressing for cross-platform robustness.

**Fix:** Replace `cat` commands with the `Read` tool:

```
# Instead of:
cat .planning/research/STACK.md

# Use the Read tool:
Read(".planning/research/STACK.md")
```

---

_Reviewed: 2026-04-17T18:53:44Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
