# Phase 40: Stage and Commit Maintenance, Logs, & State - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase achieves a completely clean working directory by:
1. Updating `.gitignore` to exclude runtime tool config dirs (`.antigravity/`, `.antigravitycli/`, `.claudeignore`)
2. Creating a separate `fix(lib)` commit for the two source lib bug fixes (`security.cjs`, `state.cjs`) before Batch 5
3. Staging and committing all remaining tracked modified files and designated untracked files as Batch 5 via `scripts/stage-batch-5.cjs`

Files in scope for the `fix(lib)` commit: `get-shit-done/bin/lib/security.cjs`, `get-shit-done/bin/lib/state.cjs`

Files in scope for Batch 5 commit:
- `.gitignore` (modified — new entries for tool runtime dirs)
- `.planning/v1.41.5-MILESTONE-AUDIT.md`
- `bin/install.js`
- `hooks/gsd-check-update-worker.js`
- `hooks/gsd-statusline.js`
- `scripts/gen-inventory-manifest.cjs`
- `logs/` (untracked directory)
- `scripts/stage-batch-1.cjs` (untracked development artifact)
- `scripts/stage-batch-2.cjs` (untracked development artifact)
- `scripts/stage-batch-3.cjs` (untracked development artifact)
- `scripts/stage-batch-5.cjs` (new script, self-referential commit)

</domain>

<decisions>
## Implementation Decisions

### Untracked Tool Runtime Dirs
- **D-01:** Add `.antigravity/`, `.antigravitycli/`, and `.claudeignore` to `.gitignore` under the existing "Local test installs" section — consistent with how `.claude/` and `.cursor/` are handled. `.antigravity/rules.md` behavioral constraints will not be tracked.

### Source Lib Files
- **D-02:** Create a separate `fix(lib)` commit for `security.cjs` (regex word-boundary fix) and `state.cjs` (cross-milestone progress tracking, bug fixes #3242 A and B) **before** the Batch 5 commit. These are bug fixes, not maintenance files — lumping them into the maintenance batch would produce a misleading commit. Suggested message: `fix(lib): regex boundary in security, cross-milestone progress tracking in state`

### Staging Automation
- **D-03:** Create `scripts/stage-batch-5.cjs` following the same pattern as `scripts/stage-batch-1/2/3/4.cjs`: active branch guard (`thamw-main`), `git reset` auto-unstage, duplicate commit detection (checks full git log), subset verification (abort on unauthorized files), missing-file abort. The script handles both tracked modified files and new untracked files (`logs/`, `scripts/stage-batch-*.cjs`).
- **D-04:** `scripts/stage-batch-5.cjs` is self-referential — it commits itself as part of Batch 5. This is intentional and mirrors the D-02 pattern from Phase 39 (stage-batch-4.cjs was similarly self-staged).

### Commit Message
- **D-05:** Batch 5 commit message: `chore(maintenance): refactor quick tasks, logs, and state files (Batch 5)` — per ROADMAP.md Phase 40 success criteria.

### Claude's Discretion
- Exact `.gitignore` section placement for the new entries (under "Local test installs" section is established convention)
- Whether to add a comment in `.gitignore` for the Antigravity entries (matching the style of the Cursor comment)
- Order of operations within `stage-batch-5.cjs` for mixed tracked/untracked staging

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — Defines STAGE-05 requirement for this batch
- `.planning/ROADMAP.md` — Phase 40 success criteria (commit message, clean tree requirement)
- `.planning/PROJECT.md` — Fork core values and constraints

### Staging Automation Reference
- `scripts/stage-batch-1.cjs` — Canonical pattern for batch staging scripts (tracked files only)
- `scripts/stage-batch-2.cjs` — Pattern with scanner-specific file list
- `scripts/stage-batch-3.cjs` — Pattern with directory-based file discovery
- `scripts/stage-batch-4.cjs` — Most recent pattern; check for any additions to the base pattern
- `.planning/phases/39-stage-and-commit-tests-sdk-validation/39-CONTEXT.md` — D-02 established "batch scripts committed in Batch 5" pattern

### Prior Phase Context
- `.planning/phases/36-stage-and-commit-configuration-rules/36-CONTEXT.md` — Batch 1 decisions
- `.planning/phases/37-stage-and-commit-scanner-logic/37-CONTEXT.md` — Batch 2 decisions
- `.planning/phases/38-stage-and-commit-workflows-agents-templates/38-CONTEXT.md` — Batch 3 decisions
- `.planning/phases/39-stage-and-commit-tests-sdk-validation/39-CONTEXT.md` — Batch 4 decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/stage-batch-4.cjs` — Most recent batch script; copy as the base for `stage-batch-5.cjs`, adjusting file list and commit message
- `.gitignore` "Local test installs" section — Add new entries here for `.antigravity/`, `.antigravitycli/`, `.claudeignore`

### Established Patterns
- Batch script pattern: `execFileSync` for git commands, branch guard, auto-unstage via `git reset`, duplicate commit detection against full `git log --oneline`, subset verification with abort on unauthorized files
- The `ALLOW_ANY_BRANCH=1` env override is present in prior scripts for CI/testing
- `git add` for untracked directories uses `git add <dir>/` (trailing slash optional but conventional)

### Integration Points
- After Batch 5, `git status` must return empty — Phase 41 zero-diff verification depends on this
- `.gitignore` changes to exclude runtime dirs take effect immediately and affect `git status` output

</code_context>

<specifics>
## Specific Ideas

- Two-step execution order: (1) update `.gitignore` and commit the `fix(lib)` changes first, (2) then run `stage-batch-5.cjs` for the Batch 5 commit
- `.antigravitycli/` contains a session JSON with local absolute paths — definitively a local artifact, never to be committed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 40-Stage and Commit Maintenance, Logs, & State*
*Context gathered: 2026-05-23*
