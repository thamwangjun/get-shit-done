---
phase: 62-rubric-inlining-coverage
fixed_at: 2026-06-08T08:00:00Z
review_path: .planning/phases/62-rubric-inlining-coverage/62-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 62: Code Review Fix Report

**Fixed at:** 2026-06-08T08:00:00Z
**Source review:** .planning/phases/62-rubric-inlining-coverage/62-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6
- Fixed: 6 (CR-01, WR-01, WR-02, WR-03, IN-01, IN-02)
- Skipped: 0

## Fixed Issues

### CR-01: `test.skip` at line 184 suppresses an assertion that would fail

**Files modified:** `agents/gsd-debug-session-manager.md`, `tests/debug-session-management.test.cjs`
**Commit:** 0e9e0001
**Applied fix:** Updated the anti-heredoc rule in `gsd-debug-session-manager.md` (line 20) to include the phrase "Only use the Write tool for file creation." so the `/only use the write tool/i` regex now matches. Removed `test.skip` from the anti-heredoc test in `debug-session-management.test.cjs` so the assertion is active. The agent text preserves positive framing per CLAUDE.md's positive-framing-replacement rule.

### WR-01: Inconsistent path resolution — `process.cwd()` used instead of `__dirname`

**Files modified:** `tests/debug-session-management.test.cjs`
**Commit:** 7d64d747
**Applied fix:** Hoisted `const ROOT = path.join(__dirname, '..');` after the imports. All 21 `process.cwd()`-based `readFileSync` calls were replaced with the `ROOT`-anchored constant (combined with IN-02 module-level caching, see below).

### WR-02: Security hardening test checks only `DATA_START`, not `DATA_END`

**Files modified:** `tests/debug-session-management.test.cjs`
**Commit:** 7d64d747
**Applied fix:** Updated the `debug command contains security hardening` test (line 89) to assert `content.includes('DATA_START') && content.includes('DATA_END')`, matching the pattern used by all other security boundary checks in the file. Updated assertion message to describe both required markers.

### WR-03: `Agent` tool-presence check is too broad — substring match on full file content

**Files modified:** `tests/debug-session-management.test.cjs`
**Commit:** 7d64d747
**Applied fix:** Replaced the broad `content.includes('Agent')` check with a frontmatter-scoped assertion. The test now extracts the `tools:` line via `(content.match(/^tools:\s*.+$/m) || [''])[0]` and asserts both `Agent` and `AskUserQuestion` are present in that specific line. This ensures a broken tool permission would fail the test even if `Agent` appears in prose or headings.

### IN-01: File-level `pending-migration-to-typed-ir` exemption misclassifies the phase-62 block

**Files modified:** `tests/rubric-inlining-coverage.test.cjs` (new file), `tests/debug-session-management.test.cjs`
**Commit:** 2884d394
**Applied fix:** Extracted the `phase-62: rubric inlining coverage` describe block into a new file `tests/rubric-inlining-coverage.test.cjs` annotated with `// allow-test-rule: source-text-is-the-product` and a comment explaining that agent `.md` files are the installed product. The block was removed from `debug-session-management.test.cjs`. Module-level caching and ROOT constant are applied to the new file as well.

### IN-02: Same files read repeatedly with no module-level caching

**Files modified:** `tests/debug-session-management.test.cjs`
**Commit:** 7d64d747
**Applied fix:** Hoisted all four file reads (`debugWorkflow`, `gsdDebugger`, `sessionManager`, `debugTemplate`) to module scope alongside the `ROOT` constant. All tests in the describe blocks now reference these module-level variables directly, eliminating 21 redundant `readFileSync` calls.

---

_Fixed: 2026-06-08T08:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
