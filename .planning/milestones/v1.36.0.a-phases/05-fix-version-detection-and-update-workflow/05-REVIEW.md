---
phase: 05-fix-version-detection-and-update-workflow
reviewed: 2026-04-17T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - bin/install.js
  - tests/version-detection.test.cjs
  - tests/bug-2136-sh-hook-version.test.cjs
  - get-shit-done/workflows/update.md
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-04-17
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

This review covers the version detection fix (INST-01/INST-02) and the update workflow. The core fix — using a 7-char git SHA as `gsdVersion` with a `no-network` sentinel fallback — is implemented correctly in `bin/install.js`, and the three-part bug #2136 fix (bash hook version headers, installer substitution, and worker regex) is all present and correct.

Four warning-level bugs were found: the update workflow silently rejects valid `no-network` installs, the worker's `isNewer()` function uses asymmetric normalization that can cause false positives with full 40-char SHAs, the update workflow passes `unknown` as a git ref to the GitHub compare API causing a guaranteed API error, and cross-step variable leakage in the workflow shell blocks. Three info-level issues were also found, including a stale comment and a fragile test boundary extraction.

---

## Warnings

### WR-01: Update workflow rejects `no-network` sentinel installs as unversioned

**File:** `get-shit-done/workflows/update.md:108`, `get-shit-done/workflows/update.md:216`, `get-shit-done/workflows/update.md:226`

**Issue:** The `grep -Eq '^[0-9a-f]{7}'` test is used to validate the VERSION file at three sites. The `no-network` sentinel (INST-02, written when git is unavailable) does not match this pattern, so it fails the check and falls through to `INSTALLED_VERSION="unknown"`. Any user who installed without git available will always be treated as "VERSION missing" by the update workflow, triggering the "fresh install" banner and skipping changelog display.

**Fix:** Accept `no-network` as a valid installed-version value alongside a 7-char SHA. Replace the three grep checks with:
```bash
# Replace:
grep -Eq '^[0-9a-f]{7}' "$VERSION_FILE"

# With a helper that accepts both valid forms:
version_valid() {
  local v
  v="$(cat "$1" 2>/dev/null)"
  [ "$v" = "no-network" ] || echo "$v" | grep -Eq '^[0-9a-f]{7}'
}
```
Then use `version_valid "$VERSION_FILE"` in place of each bare `grep -Eq` call.

---

### WR-02: `isNewer()` in worker does not normalize `installed` side — asymmetric comparison can cause false positives

**File:** `hooks/gsd-check-update-worker.js:81`

**Issue:** `isNewer` is defined as:
```js
function isNewer(latest, installed) {
  return !!latest && latest.slice(0, 7) !== installed;
}
```
It normalizes `latest` to 7 chars but compares against `installed` verbatim. `installed` is read from the VERSION file, which is written as a 7-char SHA in normal operation. However, if the VERSION file ever contains a full 40-char SHA (e.g., written by a third-party tool or a future code path), `latest.slice(0,7)` will never equal the 40-char `installed`, generating a permanent false-positive "update available" indicator.

By contrast, the stale-hook comparison at lines 65–66 correctly normalizes both sides with `norm()`. The inconsistency is a latent bug.

**Fix:** Normalize both sides in `isNewer`:
```js
function isNewer(latest, installed) {
  if (!latest) return false;
  const norm = (s) => (s && s.length >= 7 ? s.slice(0, 7) : s);
  return norm(latest) !== norm(installed);
}
```

---

### WR-03: Update workflow passes `unknown` as a git ref to GitHub compare API

**File:** `get-shit-done/workflows/update.md:315-317`

**Issue:** In `show_changes_and_confirm`, the workflow calls:
```bash
curl ... "https://api.github.com/repos/thamwangjun/get-shit-done/compare/${INSTALLED_VERSION}...thamw-main"
```
When `INSTALLED_VERSION` is `unknown` (e.g., for the `no-network` case after WR-01), GitHub will return a 422 or 404 error because `unknown` is not a valid git ref. The workflow does not handle this error case, so the changelog display step silently fails or surfaces raw JSON error output to the user.

**Fix:** Before calling the compare API, check for non-SHA installed versions and skip the changelog:
```bash
if [ "$INSTALLED_VERSION" = "unknown" ] || [ "$INSTALLED_VERSION" = "no-network" ]; then
  echo "(Changelog unavailable — installed version is not a commit SHA)"
else
  curl -sS ... "compare/${INSTALLED_VERSION}...thamw-main"
fi
```

---

### WR-04: Cross-step bash variables (`LOCAL_DIR`, `GLOBAL_DIR`, `INSTALL_SCOPE`, `TARGET_RUNTIME`) are not preserved between workflow steps

**File:** `get-shit-done/workflows/update.md:380-391`, `get-shit-done/workflows/update.md:447-452`

**Issue:** The workflow instructs the agent to run separate bash blocks in each `<step>`. Bash variables set inside one step's code block (`LOCAL_DIR`, `GLOBAL_DIR`, `INSTALL_SCOPE`, `TARGET_RUNTIME`) do not automatically persist to a later step's bash block — each `Bash` tool call runs in a fresh subprocess. `backup_custom_files` uses `$LOCAL_DIR` and `$GLOBAL_DIR` directly, and `run_update` uses `$TARGET_RUNTIME`, all of which were set in `get_installed_version`.

The comment at line 382 says "It should already be set from get_installed_version" — this is only true if the agent reassigns these from its stored output, which the workflow does not explicitly instruct.

**Fix:** Either (a) have `get_installed_version` output all necessary variables on stdout (e.g., `echo "LOCAL_DIR=$LOCAL_DIR"`) so the agent can parse and export them before subsequent steps, or (b) make `backup_custom_files` and `run_update` re-derive the paths from the install scope and runtime rather than relying on inherited variables. At minimum, add an explicit instruction to the agent after `get_installed_version`:

```
Parse line 1 → INSTALLED_VERSION, line 2 → INSTALL_SCOPE, line 3 → TARGET_RUNTIME.
Also store the resolved config directory as RUNTIME_DIR for use in later steps.
```

---

## Info

### IN-01: Stale comment in `update.md` parse instructions — says `0.0.0` but code emits `unknown`

**File:** `get-shit-done/workflows/update.md:251`

**Issue:** The parse output comment reads:
```
- Line 1 = installed version (`0.0.0` means unknown version)
```
But the actual bash script emits `unknown`, never `0.0.0`. This is a leftover from an earlier version of the script. An agent following the comment literally would look for `0.0.0` as the "unknown" sentinel and miss `unknown`.

**Fix:** Update the comment to match actual script output:
```
- Line 1 = installed version (`unknown` means the VERSION file is missing or unreadable)
```

---

### IN-02: `moduleScope` boundary extraction in version-detection test uses fragile text search

**File:** `tests/version-detection.test.cjs:27`

**Issue:**
```js
const moduleScope = installSrc.slice(0, installSrc.indexOf('\nfunction '));
```
This finds the first occurrence of `\nfunction ` in the file. If a named function declaration is added to module scope before `gsdVersion` is assigned, or if a function appears before another module-scope variable being tested, the extracted "module scope" will truncate early and miss code that should be checked. The test currently passes because the first `\nfunction ` happens to appear after all module-scope initialization, but this is an accidental coincidence, not a guaranteed invariant.

**Fix:** Either anchor the boundary explicitly (e.g., find `\nfunction install(`) or verify `gsdVersion` is set before the first function by checking its position relative to the first function's position — and add an assertion that the extracted scope is non-trivially long:
```js
assert.ok(moduleScope.length > 1000, 'moduleScope extraction looks truncated');
```

---

### IN-03: E2E test embeds an asymmetric `isNewer` that mirrors the bug from WR-02

**File:** `tests/bug-2136-sh-hook-version.test.cjs:318-320`

**Issue:** The stale-hook check script embedded in the Part 4 E2E test uses:
```js
function isNewer(latest, installed) {
  return !!latest && latest.slice(0, 7) !== installed;
}
```
This is the same asymmetric form as the production bug (WR-02). When WR-02 is fixed in `gsd-check-update-worker.js`, this test copy should also be updated to match, otherwise the test no longer accurately replicates the production behavior it is testing.

**Fix:** When fixing `isNewer` in `gsd-check-update-worker.js`, update the test's embedded copy to match. This is a test maintenance issue, not a correctness bug in the test as it stands today.

---

_Reviewed: 2026-04-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
