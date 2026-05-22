---
phase: 14-workflow-reference-and-command-fixes
reviewed: 2026-04-22T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - commands/gsd/docs-update.md
  - commands/gsd/execute-phase.md
  - commands/gsd/reapply-patches.md
  - get-shit-done/references/planner-source-audit.md
  - get-shit-done/workflows/analyze-dependencies.md
  - get-shit-done/workflows/discuss-phase.md
  - get-shit-done/workflows/execute-plan.md
  - get-shit-done/workflows/import.md
  - get-shit-done/workflows/transition.md
  - get-shit-done/workflows/verify-phase.md
  - tests/execute-phase-active-flags.test.cjs
  - tests/negative-framing-scan.test.cjs
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-04-22
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

All 12 source files were reviewed at standard depth. Both test suites pass cleanly (44 tests, 0 failures). The workflows, command files, and reference documents are broadly well-structured and follow the project's positive-framing conventions. Four warning-level issues were found: two logic bugs, one undefined-variable pair in a shell template, and one false-negative/false-positive risk in the test scanner. Three informational issues cover a documentation mismatch, a duplicate describe block, and an overly-broad path check.

No security vulnerabilities or data-loss risks were found.

---

## Warnings

### WR-01: `reapply-patches.md` — elif chain skips fallback candidates when env var is set but directory is absent

**File:** `commands/gsd/reapply-patches.md:42-56`

**Issue:** The OPENCODE detection block uses an `elif`/`elif` chain gated on `[ -z "$PATCHES_DIR" ]`. When `OPENCODE_CONFIG_DIR` is set but its patches directory does not exist, `PATCHES_DIR` remains empty — but because the outer `if` condition (`[ -z "$PATCHES_DIR" ] && [ -n "$OPENCODE_CONFIG_DIR" ]`) was true, the `elif` clauses for `OPENCODE_CONFIG` and `XDG_CONFIG_HOME/opencode` are never evaluated. The fallback candidates are silently skipped. The same structural problem applies to the Kilo block (lines 25-40): if `KILO_CONFIG_DIR` is set but the directory does not exist, `KILO_CONFIG` and `XDG_CONFIG_HOME/kilo` are never checked.

**Fix:** Replace the `elif` chains with independent `if [ -z "$PATCHES_DIR" ] && ...` blocks for each candidate, so every candidate is evaluated as long as PATCHES_DIR is still unset:

```bash
if [ -z "$PATCHES_DIR" ] && [ -n "$OPENCODE_CONFIG_DIR" ]; then
  candidate="$(expand_home "$OPENCODE_CONFIG_DIR")/gsd-local-patches"
  [ -d "$candidate" ] && PATCHES_DIR="$candidate"
fi
if [ -z "$PATCHES_DIR" ] && [ -n "$OPENCODE_CONFIG" ]; then
  candidate="$(dirname "$(expand_home "$OPENCODE_CONFIG")")/gsd-local-patches"
  [ -d "$candidate" ] && PATCHES_DIR="$candidate"
fi
if [ -z "$PATCHES_DIR" ] && [ -n "$XDG_CONFIG_HOME" ]; then
  candidate="$(expand_home "$XDG_CONFIG_HOME")/opencode/gsd-local-patches"
  [ -d "$candidate" ] && PATCHES_DIR="$candidate"
fi
```

---

### WR-02: `verify-phase.md` — "no test runner" exit code treated as test failure blocker

**File:** `get-shit-done/workflows/verify-phase.md:211-229`

**Issue:** When no test runner is detected, the inner bash subshell prints a warning and then calls `exit 1`. The outer `TEST_EXIT=$?` captures that exit code. The handler at lines 217-223 maps any non-zero, non-124 exit code to `"✗ Test suite failed"`. The subsequent directive at line 228 says "If any tests fail: Mark as `behavioral_failures` — these are BLOCKER severity." This means a project with no test runner will be incorrectly classified as having a BLOCKER behavioral failure, which would cause `gaps_found` status on every verification.

**Fix:** Distinguish the "no test runner" case by using a reserved exit code (e.g., 2) or a sentinel variable:

```bash
else
  echo "⚠ No test runner detected — skipping test suite"
  exit 2  # sentinel: no runner, not a failure
fi
'
TEST_EXIT=$?
if [ "${TEST_EXIT}" -eq 0 ]; then
  echo "✓ Test suite passed"
elif [ "${TEST_EXIT}" -eq 124 ]; then
  echo "⚠ Test suite timed out after 5 minutes"
elif [ "${TEST_EXIT}" -eq 2 ]; then
  echo "⚠ No test runner detected — behavioral verification skipped"
  # Do NOT mark as behavioral_failures
else
  echo "✗ Test suite failed (exit code ${TEST_EXIT})"
fi
```

---

### WR-03: `discuss-phase.md` — undefined variables `WAS_CHAIN` and `NEXT_PHASE` in shell template

**File:** `get-shit-done/workflows/discuss-phase.md:1266`

**Issue:** The `auto_advance` step output template contains:

```
Next: /gsd-discuss-phase ${NEXT_PHASE} ${WAS_CHAIN ? "--chain" : "--auto"} ${GSD_WS}
```

`NEXT_PHASE` and `WAS_CHAIN` are never defined anywhere in the workflow. `${WAS_CHAIN ? "--chain" : "--auto"}` is also not valid POSIX shell syntax — this is a JavaScript/ternary expression embedded in what appears to be a shell string. An agent following this template literally would output the literal text `${WAS_CHAIN ? "--chain" : "--auto"}`. The `NEXT_PHASE` value must come from the plan-phase return result, but no extraction step assigns it.

**Fix:** Define and extract the variables explicitly before the output block, and use valid shell conditional syntax:

```bash
# Extract next phase from plan-phase result
NEXT_PHASE=$(echo "$PLAN_RESULT" | grep -oE 'next_phase=[0-9]+' | cut -d= -f2)
CHAIN_FLAG=$([[ "$ARGUMENTS" =~ --chain ]] && echo "--chain" || echo "--auto")
```

Then in the output block:

```
Next: /gsd-discuss-phase ${NEXT_PHASE} ${CHAIN_FLAG} ${GSD_WS}
```

---

### WR-04: `negative-framing-scan.test.cjs` — duplicate `describe` block name causes opaque test reporting

**File:** `tests/negative-framing-scan.test.cjs:400` and `tests/negative-framing-scan.test.cjs:564`

**Issue:** Two separate `describe` blocks share the identical name `'corpus scan — DO NOT primary directives (case-insensitive)'`. The first (lines 400-449) was added in Phase 13 and covers agent and command files only. The second (lines 564-657) was added in Phase 14 and covers all four directory types. Both blocks contain tests named `'no bare DO NOT directives in agent files'` and `'no bare DO NOT directives in command files'`. When a violation occurs, the test runner output will show two identically-named failures with no way to distinguish which describe block they belong to, making diagnosis difficult. Additionally, each block re-collects the file list independently (separate `const allFiles = []` initializations) instead of sharing it, which doubles I/O.

**Fix:** Rename the first (Phase 13) describe block to distinguish it from the Phase 14 block:

```javascript
// Line 400 — rename to reflect its narrower Phase 13 scope:
describe('corpus scan — DO NOT directives: agents and commands (phase-13 scope)', () => {
  // tests unchanged
});
```

Or merge the Phase 13 tests into the Phase 14 block which already covers the same directories with a wider scope, eliminating the redundancy entirely.

---

## Info

### IN-01: `execute-phase.md` command — `--tdd` in `argument-hint` has no corresponding workflow flag handling

**File:** `commands/gsd/execute-phase.md:4`

**Issue:** The command frontmatter declares `argument-hint: "<phase-number> [--wave N] [--gaps-only] [--interactive] [--tdd]"`, documenting `--tdd` as a user-facing flag. However, the `execute-phase.md` workflow does not parse `--tdd` from `$ARGUMENTS` anywhere. TDD mode is instead activated via the config setting `workflow.tdd_mode` (read in the `tdd_review_checkpoint` step). The `execute-phase.md` command `<context>` block also omits `--tdd` from the documented flags, so it is invisible to users reading the command docs. This may mislead users who pass `--tdd` expecting behavior change.

**Fix:** Either add `--tdd` flag parsing to the workflow (which would set `workflow.tdd_mode` for the session), or remove `--tdd` from `argument-hint` and document TDD mode as a config setting only. If removing, update the context block to note:

```
TDD mode is activated via config: `gsd-sdk query config-set workflow.tdd_mode true`
```

---

### IN-02: `import.md` — path traversal check uses an overly broad glob pattern

**File:** `get-shit-done/workflows/import.md:53-54`

**Issue:** The path validation uses `*..* )` to detect traversal sequences. This pattern matches any string containing two consecutive dots, which includes paths like `archive..v2/file.md` or `config..local/patches` that are not directory traversal. It would also block a file literally named `v1..1.md`. While these cases are unlikely in practice, the pattern is not precise. The check also only catches `..` within the path string but would not catch URL-encoded traversal (`%2e%2e`) or other encoding variants.

**Fix:** Use a more precise pattern that matches `..` as a path component separator:

```bash
case "{FILEPATH}" in
  */../* | */..) echo "SECURITY_ERROR: path contains traversal sequence"; exit 1 ;;
  ../*) echo "SECURITY_ERROR: path starts with traversal sequence"; exit 1 ;;
esac
```

---

### IN-03: `discuss-phase.md` — `auto_advance` step's GAPS FOUND message references `--gaps` but execute-phase uses `--gaps-only`

**File:** `get-shit-done/workflows/discuss-phase.md:1281`

**Issue:** When the auto-advance chain stops because gaps were found, the message instructs:

```
Continue: /gsd-plan-phase ${PHASE} --gaps ${GSD_WS}
```

The `--gaps` flag is the correct flag for `gsd-plan-phase` (which creates gap-closure plans). However, the follow-on step after gap planning requires `--gaps-only` for `gsd-execute-phase`. A user reading only this message may not know to use `--gaps-only` when re-executing. This is a minor documentation completeness issue, not a logic error — the two flags exist on different commands.

**Fix:** Add the follow-on command to the message for clarity:

```
Auto-advance stopped: Gaps found during execution.
1. Plan fixes:   /gsd-plan-phase ${PHASE} --gaps ${GSD_WS}
2. Execute fixes: /gsd-execute-phase ${PHASE} --gaps-only ${GSD_WS}
```

---

_Reviewed: 2026-04-22_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
