---
phase: 12-tech-debt-remediation
fixed_at: 2026-04-21T00:00:00Z
review_path: .planning/phases/12-tech-debt-remediation/12-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 12: Code Review Fix Report

**Fixed at:** 2026-04-21
**Source review:** .planning/phases/12-tech-debt-remediation/12-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (WR-01 through WR-04; fix_scope = critical_warning)
- Fixed: 4
- Skipped: 0

## Fixed Issues

### WR-01: Hardcoded Fork-Specific Repository URL in Shipped Hook

**Files modified:** `hooks/gsd-check-update-worker.js`
**Commit:** 3d47b3b
**Applied fix:** Replaced the hardcoded personal-fork URL `https://api.github.com/repos/thamwangjun/get-shit-done/commits/thamw-main` with the template placeholder `https://api.github.com/repos/{{GSD_REPO}}/commits/{{GSD_BRANCH}}`, consistent with the `{{GSD_VERSION}}` pattern already used in the same file's version header.

---

### WR-02: Missing Model Fallback Produces Empty `debugger_model` Variable

**Files modified:** `agents/gsd-debug-session-manager.md`
**Commit:** 867474d
**Applied fix:** Added `debugger_model=${debugger_model:-claude-sonnet-4-5}` immediately after the `gsd-sdk query resolve-model` command so that Task always receives a valid model string when the SDK call fails or returns empty output.

---

### WR-03: Version-File Read Failure Silently Sets `installed` to `'unknown'`

**Files modified:** `hooks/gsd-check-update-worker.js`
**Commit:** d2be820
**Applied fix:** Two changes applied atomically:
1. Added `let readError = null;` before the try/catch and captured `readError = e.message` in the catch block instead of swallowing the error silently.
2. Changed `update_available` in `writeResult()` from `latest && isNewer(latest, installed)` to `installed !== 'unknown' && latest && isNewer(latest, installed)` so that a failed version-file read does not produce a false "update available" signal. Added `read_error: readError || undefined` to the result object so callers can distinguish "check failed" from "update available".

---

### WR-04: `AGENTS_WITH_WRITE` Test List Is Hardcoded and Will Miss New Agents

**Files modified:** `tests/agent-frontmatter.test.cjs`
**Commit:** 919493a
**Applied fix:** Replaced the static `const AGENTS_WITH_WRITE = ['gsd-executor', 'gsd-debugger']` with `const AGENTS_WITH_WRITE = FILE_WRITING_AGENTS`, which is already computed dynamically by scanning all agent files for `Write` in their `tools:` field. All 155 existing tests continue to pass; the `permissionMode` check now dynamically covers 21 file-writing agents instead of 2.

---

_Fixed: 2026-04-21_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
