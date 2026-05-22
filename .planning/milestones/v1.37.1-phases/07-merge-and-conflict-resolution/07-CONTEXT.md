# Phase 7: Merge and Conflict Resolution - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Execute `git merge upstream/main` to bring all 55 upstream v1.37.1 commits into `thamw-main`, resolve all merge conflicts (3 known high-risk files + any unexpected), and verify the fork's critical patches are intact. Phase 7 closes only when `thamw-main` is fully clean and fork-specific tests pass.

</domain>

<decisions>
## Implementation Decisions

### Conflict Resolution Scope
- **D-01:** All merge conflicts — both the 3 known high-risk files and any unexpected files — must be resolved before Phase 7 closes. The branch must be fully clean. No deferred conflicts.

### Known High-Risk Files (fork patches must be preserved)
- **D-02:** `hooks/gsd-check-update-worker.js` — preserve the fork's `thamwangjun` SHA equality check against the GitHub API; do not let upstream's npm semver check overwrite it. Verification: `grep thamwangjun hooks/gsd-check-update-worker.js` returns a match.
- **D-03:** `bin/install.js` — preserve the `ensureHooksDist` helper and `git rev-parse --short=7 HEAD` version detection across the 479-line conflict. Verification: `grep ensureHooksDist bin/install.js` returns the function definition.
- **D-04:** `tests/agent-frontmatter.test.cjs` — preserve the fork's positive-framing assertion (`/only use the write tool/i`); do not let upstream's prohibition-form assertion overwrite it. Verification: `grep -i "only use" tests/agent-frontmatter.test.cjs` returns a match.

### Unexpected Conflict Protocol
- **D-05:** For any file beyond the 3 known ones that conflicts during the merge: inspect and resolve in Phase 7. Default behavior for non-fork-patched content is to take upstream's version; any file containing fork-specific logic (SHA checks, positive-framing assertions, `ensureHooksDist`) requires manual inspection. Do not defer unexpected conflicts to Phase 9.

### Test Failure Handling (Plan 07-02)
- **D-06:** After the merge, run the full test suite. Fork-specific test failures (e.g. `agent-frontmatter.test.cjs`, `negative-framing-scan.test.cjs`, `bug-1924-ensure-hooks-dist-on-demand.test.cjs`, `execute-phase-wave.test.cjs`, `ios-scaffold-safety.test.cjs`) must be fixed in Phase 7. Upstream-introduced failures (tests that fail due to new upstream content not yet meeting fork standards) are documented as the baseline failure list and deferred to Phase 10.
- **D-07:** The distinction: if a test was passing before the merge and now fails because a fork-specific file was corrupted during conflict resolution → fix in Phase 7. If a test fails because upstream added new content that the fork's standards scanner would catch → that is Phase 10 scope.

### Merge Commit Format
- **D-08:** Use a descriptive commit message that includes the upstream version, commit count, and conflict summary. Format: `chore: merge upstream v1.37.1 (55 commits, 3 conflict files resolved)` — adjust conflict file count if unexpected conflicts are encountered.

### Claude's Discretion
- Specific hunk-level resolution approach within each conflict file (which hunks to take from ours vs theirs, beyond the fork-patch preservation rules above)
- Order in which conflict files are resolved
- Whether to use `git mergetool` or manual editor resolution

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Fork Patch Preservation Rules
- `.planning/REQUIREMENTS.md` §Merge Integration — MERGE-01 through MERGE-04 define the grep-verifiable success checks
- `.planning/PROJECT.md` §Key Decisions — documents the rationale behind each fork patch (SHA equality, ensureHooksDist, positive framing assertion)
- `.planning/ROADMAP.md` §Phase 7 — contains the 4 success criteria with exact verification commands

### Conflict Resolution Precedents
- `.planning/milestones/v1.36.0-ROADMAP.md` — prior merge precedent (v1.36.0 upstream merge pattern)
- `plans/XX-MERGE_UPSTREAM_CONFLICTS_V01.md` — canonical playbook for upstream merge conflict resolution (if present)

No external specs beyond the planning directory — all requirements are captured in decisions above and REQUIREMENTS.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hooks/gsd-check-update-worker.js` — current fork version contains `thamwangjun` at line with GitHub repo reference; this is the anchor to preserve
- `bin/install.js` — current fork version contains `ensureHooksDist` helper function; uses `spawnSync` with `stdio: pipe` (documented in PROJECT.md Key Decisions)
- `tests/agent-frontmatter.test.cjs` — current fork version asserts `/only use the write tool/i` (positive framing); upstream uses prohibition form

### Established Patterns
- **Minimal diff principle**: retain function/variable names from fork; only take upstream's new content around fork-patched sections
- **Scanner-first**: after merge, run the negative-framing scanner before making any additional edits — established v1.36.0 precedent
- **Tests modified, not reverted**: when upstream test assertions conflict with fork standards, modify the test to reflect fork behavior

### Integration Points
- `git merge upstream/main` — single command that triggers all conflicts
- `npm test` — the verification gate; baseline run in Plan 07-02 captures the failure delta introduced by the merge

</code_context>

<specifics>
## Specific Ideas

- Commit message template confirmed: `chore: merge upstream v1.37.1 (55 commits, 3 conflict files resolved)` — update the conflict file count if unexpected conflicts are found during resolution
- The 55-commit count is current as of 2026-04-17; recount with `git log --oneline upstream/main ^thamw-main | wc -l` at merge time in case the remote has been updated

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-merge-and-conflict-resolution*
*Context gathered: 2026-04-17*
