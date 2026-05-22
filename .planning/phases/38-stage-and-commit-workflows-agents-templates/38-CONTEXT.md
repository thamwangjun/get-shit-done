# Phase 38: Stage and Commit Workflows, Agents, & Templates - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase stages and commits Batch 3 files: workflows, agents, commands, non-test documentation, and templates. It excludes test files (Batch 4) and state/maintenance files (Batch 5). Staging is automated and validated via a new script `scripts/stage-batch-3.cjs` to ensure only the correct files are committed, preserving repository integrity for the final zero-diff verification.
</domain>

<decisions>
## Implementation Decisions

### Scope of Batch 3
- **D-01:** Staged files will include all modified and untracked files in the directories `agents/`, `commands/gsd/`, `get-shit-done/workflows/`, root markdown files (`README*.md`), and all documentation under `docs/`.

### Handling of Untracked Files
- **D-02:** Untracked markdown files in these directories (such as `get-shit-done/workflows/join-discord.md`, `get-shit-done/workflows/set-profile.md`, and new `.md` files in `docs/`) will be explicitly staged and committed to achieve the zero-diff goal at the end of the milestone.

### Commit Script Automation
- **D-03:** A helper script `scripts/stage-batch-3.cjs` will be created to automate the staging, perform verification that no files outside the Batch 3 scope are staged, and commit the changes with the conventional commit message: `refactor(prompts): refactor workflows, agents, and templates (Batch 3)`.

### the agent's Discretion
- None — all key decisions on file scope, untracked files, and automation were fully selected and agreed upon by the user.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning Documents
- `.planning/PROJECT.md` — Project context and fork quality bar definition
- `.planning/REQUIREMENTS.md` — Scoped requirements tracking STAGE-03
- `.planning/ROADMAP.md` — Milestone roadmap detailing Phase 38 goals
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/stage-batch-2.cjs` — A template script for staging and committing files in a batch with subset validation checks.

### Established Patterns
- Splitting changes since `v1.41.2` into distinct commits to keep the refactoring history clean.

### Integration Points
- The new script `scripts/stage-batch-3.cjs` will be added to the repository and tracked in Batch 5 (since it is a helper/maintenance script).
</code_context>

<specifics>
## Specific Ideas
- No specific requirements — open to standard approaches
</specifics>

<deferred>
## Deferred Ideas
- None — discussion stayed within phase scope
</deferred>

---

*Phase: 38-Stage and Commit Workflows, Agents, & Templates*
*Context gathered: 2026-05-22*
