---
phase: 05-fix-version-detection-and-update-workflow
verified: 2026-04-17T10:30:00Z
status: human_needed
score: 4/5
overrides_applied: 0
human_verification:
  - test: "Run /gsd-update on a machine where the installed VERSION SHA matches the current thamw-main HEAD SHA"
    expected: "The command prints 'You're already on the latest commit.' and stops without triggering a reinstall"
    why_human: "update.md is an AI workflow document — the compare_versions step is an instruction to the executing agent, not a shell script. Programmatic verification cannot run an AI agent invocation to trace the compare step live."
---

# Phase 5: Fix Version Detection and Update Workflow — Verification Report

**Phase Goal:** The VERSION file always holds a usable SHA-based identifier after installation, and the /gsd-update command correctly identifies whether the user is already on the latest commit
**Verified:** 2026-04-17T10:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | After a successful installation with network access, the VERSION file contains a 7-character hex SHA (not a semver string) | VERIFIED | `bin/install.js` lines 58–73 replaced: `git rev-parse --short=7 HEAD` with regex guard `/^[0-9a-f]{7}$/`. Commit `c8ef573`. All 4 INST-01/INST-02 tests pass (`node --test tests/version-detection.test.cjs` exits 0). |
| 2 | After an installation where the GitHub API is unavailable, the VERSION file contains a clearly distinguishable fallback value — not a semver | VERIFIED | Initial `gsdVersion = 'no-network'` sentinel present (line 60). `let gsdVersion = pkg.version` removed. `'no-network'` fails `grep -Eq '^[0-9a-f]{7}'` intentionally. Static analysis tests confirm both conditions. |
| 3 | Running `/gsd-update` when the installed SHA already matches the remote HEAD prints "already on latest" rather than triggering a spurious update or printing "unknown" | UNCERTAIN — human needed | The code path is now reachable: `grep -Eq '^[0-9a-f]{7}'` gate at lines 108, 216, 226 accepts a valid SHA from VERSION; `compare_versions` step displays "You're already on the latest commit." when SHAs match. However, `update.md` is an AI workflow document — execution requires a live agent invocation that cannot be verified programmatically. See Human Verification section. |
| 4 | The version comparison in the update workflow completes without variable state being lost between bash steps | VERIFIED | UPD-02 is verify-only (no code change needed per plan). Mechanism confirmed by inspection: `update.md` steps are instructions to a single AI agent invocation. The agent reads INSTALLED_VERSION from `get_installed_version` bash stdout and LATEST_VERSION from `check_latest_version` bash stdout within one context window — no cross-step shell variable loss is possible. SUMMARY-02 documents this correctly. |
| 5 | The `update.md` cache-clear step clears `~/.cache/gsd/gsd-update-check.json` so the statusline indicator does not persist after a successful update | VERIFIED | Line 523 of `get-shit-done/workflows/update.md`: `rm -f "$HOME/.cache/gsd/gsd-update-check.json"`. Structurally outside both `for dir in` loops (second loop closes at line 519; rm is at line 523). Matches the exact path written by `hooks/gsd-check-update.js` (`path.join(os.homedir(), '.cache', 'gsd', 'gsd-update-check.json')`). Commit `ef98d1b`. |

**Score:** 4/5 truths verified (Truth 3 requires human verification)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `bin/install.js` | git rev-parse --short=7 HEAD as gsdVersion source | VERIFIED | Lines 58–73 contain the git rev-parse block. `let gsdVersion = 'no-network'` as initial value. No GitHub API curl call in module scope. |
| `tests/version-detection.test.cjs` | INST-01 and INST-02 test coverage | VERIFIED | File exists (64 lines). Contains `describe('INST-01: ...)` and `describe('INST-02: ...)` blocks. 4 static analysis tests, all passing. |
| `get-shit-done/workflows/update.md` | Cache-clear for shared worker cache path | VERIFIED | Contains `.cache/gsd/gsd-update-check.json` at line 523, outside both for-loops. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `bin/install.js` lines 58–73 | `gsdVersion` module-scope variable | `execSync('git rev-parse --short=7 HEAD', ...).trim()` | WIRED | Pattern `git rev-parse` present at line 63. `gsdVersion = sha` assignment inside regex guard at lines 68–70. |
| `tests/version-detection.test.cjs` | `bin/install.js` | `fs.readFileSync` static analysis | WIRED | `installSrc.includes('git rev-parse')` and related assertions are present and passing. |
| `get-shit-done/workflows/update.md` run_update step | `~/.cache/gsd/gsd-update-check.json` | `rm -f "$HOME/.cache/gsd/gsd-update-check.json"` | WIRED | Exact string found at line 523, structurally after both for-loops (line 519 = last `done`). |

### Data-Flow Trace (Level 4)

Static analysis only — no dynamic rendering artifacts in this phase. `bin/install.js` writes to a VERSION file (not a UI component); `update.md` is an AI workflow document. Data-flow tracing at Level 4 is not applicable.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 4 version-detection tests pass | `node --test tests/version-detection.test.cjs` | 4 pass, 0 fail, exit 0 | PASS |
| Full test suite has no regressions | `npm test` | 3945 pass, 0 fail, exit 0 | PASS |
| install.js static assertions (4 conditions) | `node -e "const src=...` (4 assert calls) | PASS | PASS |
| GitHub API URL absent from install.js | `grep -n 'api.github.com' bin/install.js` | No output (0 matches) | PASS |
| Cache-clear line present and outside loops | `grep -n -C5 '.cache/gsd/gsd-update-check.json' update.md` | Line 523, after line 519 `done` | PASS |
| Committed SHAs exist | `git show --stat c8ef573 1a312ef ef98d1b` | All 3 commits verified, correct files | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| INST-01 | 05-01-PLAN.md | VERSION file always contains a 7-char hex SHA after successful installation | SATISFIED | `git rev-parse --short=7 HEAD` + regex guard in install.js; 2 passing tests in INST-01 describe block |
| INST-02 | 05-01-PLAN.md | When GitHub API unavailable, VERSION contains a non-SHA distinguishable fallback | SATISFIED | `'no-network'` sentinel as initial value; pkg.version semver fallback removed; 2 passing tests in INST-02 describe block |
| UPD-01 | 05-02-PLAN.md | `/gsd-update` correctly reports "already on latest" when installed SHA equals remote SHA | PARTIAL — code path enabled, live verification human-only | `compare_versions` step displays correct message when SHAs match (line 301); gate now accepts valid SHAs; but live execution cannot be verified programmatically |
| UPD-02 | 05-02-PLAN.md | Version comparison executes in a single bash context so variable state is not lost | SATISFIED | Verify-only task confirmed: AI agent maintains INSTALLED_VERSION in context window across sequential bash tool calls — no shell variable loss between steps |

**Orphaned requirements check:** HOOK-01, HOOK-02, HOOK-03, HOOK-04 are mapped to Phase 4 (verified in Phase 6) per REQUIREMENTS.md traceability table — not orphaned for Phase 5.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tests/version-detection.test.cjs` | 1–63 | Live install tests omitted (Groups 3 and 4 from plan) | Info | Static analysis only — pre-approved in plan task description: "if live install approach proves too complex... static analysis tests are sufficient for CI". End-to-end live testing is manual-only per 05-VALIDATION.md. Not a blocker. |

No TODO/FIXME/placeholder comments, stub returns, or hardcoded empty values found in modified files.

### Human Verification Required

#### 1. UPD-01: Already-on-latest path (live /gsd-update run)

**Test:** On a machine with a freshly installed GSD (where `bin/install.js` was run from the thamw-main branch), run `/gsd-update` in Claude Code or another supported runtime.
**Expected:** The command displays "You're already on the latest commit." and stops without initiating a git pull or reinstall.
**Why human:** `update.md` is an AI workflow document, not a shell script. The `compare_versions` step is an instruction to the executing AI agent — there is no programmatic way to run the full update workflow and observe its output without actually invoking a Claude Code agent session.

### Gaps Summary

No gaps requiring closure. Truth 3 (UPD-01) is structurally satisfied — the code path is now reachable (the SHA in VERSION passes the grep gate, and the compare_versions step displays the correct "already on latest" message). The only remaining item is human verification that the live workflow executes the path as expected.

The pre-existing test failures in `tests/bug-2136-sh-hook-version.test.cjs` noted in SUMMARY-02 are confirmed absent: `npm test` exits 0 with 3945 passing tests, meaning those failures were resolved elsewhere or the base was updated before these plans ran.

---

_Verified: 2026-04-17T10:30:00Z_
_Verifier: Claude (gsd-verifier)_
