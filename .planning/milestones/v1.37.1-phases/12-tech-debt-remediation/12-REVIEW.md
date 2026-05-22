---
phase: 12-tech-debt-remediation
reviewed: 2026-04-21T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - agents/gsd-debugger.md
  - agents/gsd-debug-session-manager.md
  - agents/gsd-executor.md
  - agents/gsd-intel-updater.md
  - agents/gsd-pattern-mapper.md
  - agents/gsd-phase-researcher.md
  - agents/gsd-planner.md
  - agents/gsd-ui-checker.md
  - commands/gsd/quick.md
  - commands/gsd/thread.md
  - hooks/gsd-check-update-worker.js
  - tests/agent-frontmatter.test.cjs
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-04-21
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Reviewed 12 source files spanning agent definitions, command handlers, a background Node.js hook, and a test suite. The codebase is well-structured with consistent security hardening patterns (DATA_START/DATA_END boundaries, slug sanitization). No critical vulnerabilities were found.

Four warnings were identified: a hardcoded fork-specific GitHub URL in a shipped hook, a missing model fallback that could produce a malformed Task call, silent error suppression in version-file reading (no degradation signal), and an incomplete test coverage list that will silently miss new Write-capable agents. Five informational issues cover empty catch blocks, a doc-only test for a hardcoded agent list, and minor template inconsistencies.

## Warnings

### WR-01: Hardcoded Fork-Specific Repository URL in Shipped Hook

**File:** `hooks/gsd-check-update-worker.js:101`
**Issue:** The GitHub API URL is hardcoded to `thamwangjun/get-shit-done` on branch `thamw-main`. This URL is specific to a personal fork. Users who install GSD from the canonical upstream will silently check the wrong repository for updates — either receiving incorrect "update available" signals or missing real updates entirely.
**Fix:** Either replace the hardcoded URL with a templated placeholder substituted at install time (consistent with the `gsd-hook-version: {{GSD_VERSION}}` pattern already used), or read the canonical repo and branch from a config/version file.

```javascript
// Replace hardcoded URL:
'https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main'

// With a template placeholder substituted during install:
'https://api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}'
```

---

### WR-02: Missing Model Fallback Produces Empty `debugger_model` Variable

**File:** `agents/gsd-debug-session-manager.md:96`
**Issue:** The model resolution command uses `2>/dev/null || true`, which means if `gsd-sdk` fails to run (missing binary, permission error, unexpected output), `debugger_model` is set to an empty string. The subsequent Task spawn at line 89 passes `model="{debugger_model}"` — an empty model string is likely to be rejected or cause a silent fallback to a default model, making the resolution code produce no benefit when it fails.
**Fix:** Provide an explicit fallback model name so the Task always has a valid `model` value:

```bash
debugger_model=$(gsd-sdk query resolve-model gsd-debugger 2>/dev/null | jq -r '.model' 2>/dev/null || true)
# Add fallback:
debugger_model=${debugger_model:-claude-sonnet-4-5}
```

---

### WR-03: Version-File Read Failure Silently Sets `installed` to `'unknown'`

**File:** `hooks/gsd-check-update-worker.js:31`
**Issue:** The outer `try/catch` block at line 23-31 swallows all errors from reading version files. If both version files exist but are unreadable (permissions, corrupted), `installed` remains `'unknown'` and `configDir` remains `''`. This propagates: stale-hook checking is skipped entirely (line 52 gate), and `isNewer` always returns `true` for any `latest` value when `installed === 'unknown'` (7-char prefix comparison `'unknown'.slice(0,7) === 'unknown'` vs a 7-char SHA will always differ). This produces a false "update available" on every session start.
**Fix:** Log or record the error in the result so the UI can distinguish "check failed" from "update available":

```javascript
let readError = null;
try {
  // ... existing read logic ...
} catch (e) {
  readError = e.message;
}

// In writeResult():
const result = {
  update_available: installed !== 'unknown' && latest && isNewer(latest, installed),
  installed,
  latest: latest || 'unknown',
  checked: Math.floor(Date.now() / 1000),
  stale_hooks: staleHooks.length > 0 ? staleHooks : undefined,
  read_error: readError || undefined,
};
```

---

### WR-04: `AGENTS_WITH_WRITE` Test List Is Hardcoded and Will Miss New Agents

**File:** `tests/agent-frontmatter.test.cjs:395`
**Issue:** The `AGENTS_WITH_WRITE` array at line 395 contains only `['gsd-executor', 'gsd-debugger']` and is used to assert that those agents do not have `permissionMode` in their frontmatter. However, `FILE_WRITING_AGENTS` (line 24-28) is already computed dynamically by scanning for agents with `Write` in their `tools:` field. If a new Write-capable agent is added, the `permissionMode` check will silently skip it. The hardcoded list is inconsistent with the dynamic approach used elsewhere in this test file.
**Fix:** Replace the hardcoded list with the computed `FILE_WRITING_AGENTS` list, or extend it to derive from `FILE_WRITING_AGENTS`:

```javascript
// Replace:
const AGENTS_WITH_WRITE = ['gsd-executor', 'gsd-debugger'];

// With:
const AGENTS_WITH_WRITE = FILE_WRITING_AGENTS;
```

## Info

### IN-01: Multiple Silent Empty Catch Blocks in Hook Worker

**File:** `hooks/gsd-check-update-worker.js:57-75`
**Issue:** The stale-hook scanning loop (lines 57-78) contains two nested empty `catch (e) {}` blocks — one for reading each hook file and one for the outer `hooksDir` read. Errors silently produce no stale hook entries for affected files, making it impossible to distinguish "no stale hooks" from "could not check hooks."
**Fix:** Consider adding the affected file to `staleHooks` with `hookVersion: 'unreadable'` on read failure, consistent with the "no version header = stale" treatment already applied at line 72.

---

### IN-02: Slug Sanitization Is Documented But Not Enforced Before Shell Substitution

**File:** `commands/gsd/quick.md:109` and `commands/gsd/thread.md:42`
**Issue:** Both commands document slug sanitization in `<security_notes>` and describe it in prose, but the actual shell commands that substitute `{SLUG}` into glob patterns (e.g., `ls -d .planning/quick/*-{SLUG}/`) rely on the agent correctly applying the sanitization before reaching that step. If the agent skips or mis-applies the sanitization, the unsanitized value lands directly in a shell glob. The current `[a-z0-9-]`-only rule prevents shell injection but this is an agent-prompt instruction, not enforced by code.
**Fix:** This is an inherent limitation of agent-prompt-based workflows. Document the sanitization step explicitly as a gate that must occur before the first shell command using the slug, with a note that unsanitized slugs must not reach Bash commands. No code change needed — this is a documentation/ordering clarification.

---

### IN-03: `thread.md` Close Mode Uses Literal `YYYY-MM-DD` in `frontmatter.set` Call

**File:** `commands/gsd/thread.md:80`
**Issue:** The CLOSE mode instructions show:
```bash
gsd-sdk query frontmatter.set .planning/threads/{SLUG}.md updated YYYY-MM-DD
```
The string `YYYY-MM-DD` is a template placeholder, but unlike `{today ISO date}` used in CREATE mode, it is not visually distinguished as a placeholder. An agent following these instructions literally would write the string `YYYY-MM-DD` into the `updated` field.
**Fix:** Replace with the same `{today ISO date}` convention used in CREATE mode for consistency:
```bash
gsd-sdk query frontmatter.set .planning/threads/{SLUG}.md updated {today ISO date}
```

---

### IN-04: `diagnose-issues.md` Test Uses Hard `readFileSync` Without File Existence Check

**File:** `tests/agent-frontmatter.test.cjs:148-153`
**Issue:** The test at line 145 reads `diagnose-issues.md` with `fs.readFileSync` directly, with no check that the file exists. All other tests in the SPAWN describe block iterate over `fs.readdirSync` results or use conditional guards. If `diagnose-issues.md` is renamed or moved, this test throws an uncaught error with a less informative message than an assertion failure.
**Fix:** Add a file-existence assertion before reading, or wrap in a try/catch with a clear message. Minor quality issue — does not affect correctness today.

---

### IN-05: Commented-Out Hook Configuration in Agent Frontmatter Is Present in Read-Only Agents

**File:** `agents/gsd-ui-checker.md:6`, `agents/gsd-intel-updater.md:6`
**Issue:** `gsd-ui-checker` is declared read-only (no `Write` in tools) and `gsd-intel-updater` has `Write` in tools but no commented-out hooks block. The test suite at `tests/agent-frontmatter.test.cjs:82-98` checks that file-writing agents have `# hooks:` in frontmatter, but `gsd-intel-updater` has only `# hooks:` with no body (`# hooks:\n---`), which satisfies the pattern check but leaves an incomplete stub. `gsd-ui-checker` has no hooks section at all, which is correct per the test.
**Fix:** For `gsd-intel-updater`, either add the full commented-out hooks template (matching other write agents) or remove the partial `# hooks:` line. Cosmetic inconsistency only.

---

_Reviewed: 2026-04-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
