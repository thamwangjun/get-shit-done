# Deferred Items — Phase 03 Plan 02

## Pre-Existing Worktree State Failures

The following test failures were observed during `npm test` in the worktree but are NOT caused by this plan's changes. They are pre-existing issues in the worktree's working tree (stale files at older upstream state) that are outside this plan's scope.

### 1. agent-frontmatter.test.cjs: gsd-debugger has anti-heredoc instruction

- **File:** `agents/gsd-debugger.md`
- **Issue:** The worktree's working-tree copy of `gsd-debugger.md` does not contain `"never use \`Bash(cat << 'EOF')\` or heredoc"`. The test requires file-writing agents to include this instruction.
- **Root cause:** The worktree was initialized at an older upstream commit. The test checks for a string that wasn't added to gsd-debugger.md in the old version.
- **Scope boundary:** gsd-debugger.md is not a file modified in plans 03-01 or 03-02.

### 2. prompt-injection-scan.test.cjs: agent definition files are clean (injection patterns)

- **File:** `agents/gsd-debugger.md` (via `get-shit-done/bin/lib/security.cjs`)
- **Issue:** `security.cjs` in the working tree uses the pattern `(?:run|execute|call|invoke)\s+(?:the\s+)?(?:bash|shell|exec|spawn)\s+(?:tool|command)/i` without a `\b` word boundary. This matches `Run Bash commands` in gsd-debugger.md line 53, which is a false positive.
- **Root cause:** The HEAD version of `security.cjs` has `\b` at the end of the pattern, which prevents the false positive. The worktree's older version does not.
- **Scope boundary:** `get-shit-done/bin/lib/security.cjs` is not a file modified in plans 03-01 or 03-02.

## Action Required (Future Plans)

These are tracked as a pre-existing state issue in the worktree. After the worktree branches are merged back to thamw-main, the merged state should pass all tests (since the HEAD version of those files is correct). No action required from this plan.
