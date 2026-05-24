# Phase 37: Stage and Commit Scanner Logic - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase targets the staging and committing of the Batch 2 files (Scanner logic, audit scripts, and update checkers: `hooks/gsd-read-injection-scanner.js`, `scripts/audit-tags.js`, and `hooks/gsd-check-update.js`) as part of the v1.41.5 Refactor Git Commit History milestone.

</domain>

<decisions>
## Implementation Decisions

### Staging Automation Script
- **D-01:** Create a dedicated node script `scripts/stage-batch-2.cjs` to automate staging, validation, and committing of Batch 2 files (fully consistent with `scripts/stage-batch-1.cjs`).
- **D-02:** Keep the script untracked in the workspace as a development artifact (to be staged and committed later in Batch 5).
- **D-03:** Include an active branch guard in `scripts/stage-batch-2.cjs` that aborts the script if the current branch is not `thamw-main`, unless overridden via an environment variable (e.g., `ALLOW_ANY_BRANCH=1`).

### Scanner Validation
- **D-04:** Fail the staging process if any of the target files (`hooks/gsd-read-injection-scanner.js`, `scripts/audit-tags.js`, `hooks/gsd-check-update.js`) are completely missing on disk.
- **D-05:** Skip staging silently for any target file that exists but has no modifications/changes since tag `v1.41.2`.
- **D-06:** Defer full validation checks of the scanner logic until the final validation phase (Phase 41) to prevent breaking on intermediate commits.

### Pre-existing Staged Files Handling
- **D-07:** Automatically run `git reset` to unstage any pre-existing staged changes before staging Batch 2 files (fully consistent with Batch 1 behavior).
- **D-08:** Check the latest commit message and if it matches `feat(scanner): refactor scanner logic and audit scripts (Batch 2)`, exit 0 early to prevent duplicate commits if run repeatedly.

### the agent's Discretion
None specified. Follow standard Git and CLI utilities conventions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — Defines requirements (specifically STAGE-02) for this refactor.
- `.planning/ROADMAP.md` — Outlines milestone phases and goals.
- `.planning/PROJECT.md` — Contains core values and key decisions for the fork.

### Staging Automation Reference
- `scripts/stage-batch-1.cjs` — Establishes the automation script pattern for staging batches.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Git CLI: Standard git CLI commands (`git add`, `git reset`, `git diff`, `git log`) will be used for staging and validation.
- Node.js child_process: Use `execFileSync` to execute git commands synchronously.

### Established Patterns
- Conventional Commits: The commit message must follow the conventional commit format: `feat(scanner): refactor scanner logic and audit scripts (Batch 2)`.
- Staging automation: Reuse the logic pattern from `scripts/stage-batch-1.cjs` for checks, validation, and committing.

### Integration Points
- Git staging index and commit.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 37-Stage and Commit Scanner Logic*
*Context gathered: 2026-05-22*
