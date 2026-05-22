# Phase 5: Fix Version Detection and Update Workflow - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix `bin/install.js` so the VERSION file always holds a usable SHA-based identifier after installation, and fix `get-shit-done/workflows/update.md` so the post-update cache-clear covers the correct path. The `/gsd-update` command's SHA comparison logic (UPD-02) is verified, not rewritten.

**Scope constraint:** This fork supports local (git clone) installs only. npm installs are explicitly out of scope for now; this decision should be revisited when npm install support is added.

</domain>

<decisions>
## Implementation Decisions

### INST-01 / INST-02: Replace GitHub API with git rev-parse in install.js
- **D-01:** Remove the `curl`-to-GitHub-API block in `bin/install.js` (lines ~58–72). Replace with `git rev-parse --short HEAD` as the primary source of the installed SHA. This eliminates the offline-fallback problem entirely for local installs: git is always available in a local clone.
- **D-02:** The GitHub API call is removed entirely — it is not kept as a secondary cross-check. For local installs, `git rev-parse` is the source of truth.
- **D-03:** If `git rev-parse --short HEAD` fails (e.g., not in a git repo), write a sentinel value — `'no-network'` (or equivalent non-hex string) — to VERSION. This distinguishable fallback ensures downstream SHA comparisons (worker, update.md) never silently treat it as a valid SHA.
- **D-04:** Tests verify: (a) VERSION contains a 7-char hex SHA after a normal install with git available; (b) VERSION contains a clearly non-SHA value after install in a non-git context.

### INT-01 / FLOW-03: Fix cache-clear path in update.md
- **D-05:** Add `rm -f "$HOME/.cache/gsd/gsd-update-check.json"` to the existing cache-clear loop in `update.md`. The worker write path (`~/.cache/gsd/gsd-update-check.json`) stays unchanged. This fixes the ⬆ indicator persisting after `/gsd-update`.

### UPD-02: Version comparison in update.md
- **D-06:** The single-bash-context version comparison mechanism in `update.md` is already correctly implemented. Phase 5 verifies it works end-to-end once INST-01/INST-02 are fixed — no changes to the comparison logic itself.

### UPD-01: "Already on latest" path
- **D-07:** UPD-01 unblocks automatically once D-01–D-04 are delivered: VERSION will contain a valid 7-char SHA → update.md's `grep -Eq '^[0-9a-f]{7}'` check passes → INSTALLED_VERSION is set to the real SHA → SHA comparison works correctly → "already on latest" path is reachable.

### Scope: local-only install constraint
- **D-08:** This fork only supports local (git clone) installs for now. This is a recorded decision: npm install support may be added in a future phase, at which point the VERSION-writing strategy in install.js will need to be revisited.

### Claude's Discretion
- Whether to wrap `git rev-parse --short HEAD` in `execSync` (inline) or extract to a helper — planner decides based on existing patterns in install.js.
- Exact sentinel string for the non-git fallback (e.g., `'no-network'`, `'OFFLINE'`) — planner decides; must not match `^[0-9a-f]{7}`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files under fix
- `bin/install.js` lines 58–73 — GitHub API + VERSION-writing block to replace with git rev-parse
- `bin/install.js` lines 5737–5744 — VERSION file write (uses `gsdVersion`; no change expected here once `gsdVersion` is correctly set)
- `get-shit-done/workflows/update.md` — cache-clear loop to update (D-05); version comparison logic to verify (D-06)

### Phase 4 context (carry-forward)
- `.planning/phases/04-fix-background-update-check-hook/04-CONTEXT.md` — D-06 (silent failure semantics) and worker interface (installed/latest fields)
- `hooks/gsd-check-update-worker.js` — reads VERSION via `GSD_GLOBAL_VERSION_FILE`/`GSD_PROJECT_VERSION_FILE` env vars; `isNewer(latest, installed)` comparison (Phase 4 fix)

### Requirements
- `.planning/REQUIREMENTS.md` — INST-01, INST-02, UPD-01, UPD-02 are in scope for Phase 5

### Milestone audit (gap evidence)
- `.planning/v1.36.0.a-MILESTONE-AUDIT.md` — INST-01, INST-02, UPD-01, UPD-02 gap evidence; INT-01, INT-02, FLOW-03 integration findings

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/install.js` line 62+: `execSync` from `child_process` already imported — use for `git rev-parse --short HEAD`
- `get-shit-done/workflows/update.md` cache-clear loop — already iterates runtime dirs; add one `rm -f` line for `~/.cache/gsd/`
- `hooks/gsd-check-update-worker.js` lines 21–31 — VERSION reading logic; expects 7-char SHA; no changes in this phase

### Established Patterns
- Silent failure for all I/O ops in the installer (try/catch that falls through) — maintain for the git rev-parse call
- `gsdVersion = sha.slice(0, 7)` pattern already established; git rev-parse `--short` produces 7-char output directly (no slice needed, but planner should confirm git's default short-SHA length)
- update.md's version comparison already uses `grep -Eq '^[0-9a-f]{7}'` as the validity gate — no change needed

### Integration Points
- `gsdVersion` variable in install.js feeds: VERSION file write (line 5739), hook content injection (`{{GSD_VERSION}}` substitution), and the manifest version field — changing how `gsdVersion` is set affects all three; the VERSION file fix should not change the manifest behavior
- update.md's INSTALLED_VERSION must be a 7-char hex SHA for the "already on latest" branch to be reachable (line 108 check)

</code_context>

<specifics>
## Specific Ideas

- For `git rev-parse --short HEAD`, consider using `git rev-parse --short=7 HEAD` to guarantee exactly 7 characters regardless of git config (some repos have `core.abbrev` set differently).
- The sentinel for non-git contexts should be something a human reading the VERSION file would immediately recognize as "not a real SHA" — `'no-network'` is descriptive; `'OFFLINE'` is terse. Either is acceptable per D-03.
- Local-only install scope (D-08) should be noted in a comment near the VERSION-writing code so future maintainers know the npm case is not handled.

</specifics>

<deferred>
## Deferred Ideas

- **npm install support**: Future phase. When npm install support is added, the VERSION-writing strategy in install.js will need to handle the case where git is not available (e.g., `npm install -g get-shit-done-cc`). At that point, the GitHub API call may be reintroduced as the primary source for npm installs.

</deferred>

---

*Phase: 05-fix-version-detection-and-update-workflow*
*Context gathered: 2026-04-17*
