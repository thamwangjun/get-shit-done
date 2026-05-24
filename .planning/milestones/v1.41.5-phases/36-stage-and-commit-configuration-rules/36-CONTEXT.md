# Phase 36: Stage and Commit Configuration & Rules - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase targets the staging and committing of the Batch 1 files (Rules and configuration files: CATALOGUE.json, mise.toml, .planning/config.json, and all files under .planning/references/*) as part of the v1.41.5 Refactor Git Commit History milestone.

</domain>

<decisions>
## Implementation Decisions

### File Staging Target
- **D-01:** Use a Strict Explicit List: Only stage the exact files listed in the requirements: `CATALOGUE.json`, `mise.toml`, `.planning/config.json`, and files matching `.planning/references/*`.
- **D-02:** Skip Silently: If any expected file has no changes since `v1.41.2`, skip it silently and proceed with staging the other files.

### Staging Safety Gate
- **D-03:** Auto-unstage: Automatically unstage any pre-existing staged changes before staging Batch 1.

### Verification Strictness
- **D-04:** Exact Match Gate: The verification step must match the expected Batch 1 files exactly. Any extra files cause immediate abort.
- **D-05:** Subset verification: Verify that all staged files are a subset of the expected list (no extra files allowed), ignoring files that had no changes.

### the agent's Discretion
None specified. Follow standard Git and CLI utilities conventions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — Defines requirements (specifically STAGE-01) for this refactor.
- `.planning/ROADMAP.md` — Outlines milestone phases and goals.
- `.planning/PROJECT.md` — Contains core values and key decisions for the fork.

### Fork Quality Standards
- `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` — Prompt improvement guidelines.
- `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` — Core fork prompt engineering guide.
- `.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md` — Record of changes between upstream and fork.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Git CLI: Standard git CLI commands (`git add`, `git status`, `git diff`) will be used for staging and validation.

### Established Patterns
- Conventional Commits: The commit message must follow the conventional commit format: `chore(config): refactor rules and configuration files (Batch 1)`.

### Integration Points
- Git staging and validation logic integration.

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

*Phase: 36-Stage and Commit Configuration & Rules*
*Context gathered: 2026-05-22*
