# Phase 39: Stage and Commit Tests & SDK Validation - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase stages and commits Batch 4 files: core unit/integration tests (`tests/*.test.cjs`), the test runner (`scripts/run-tests.cjs`), and the SDK CLI entry point (`sdk/src/cli.ts`). Staging is automated via a new script `scripts/stage-batch-4.cjs` to ensure only the correct files are committed, preserving repository integrity for the final zero-diff verification in Phase 41.

</domain>

<decisions>
## Implementation Decisions

### Staging Automation
- **D-01:** Create `scripts/stage-batch-4.cjs` mirroring the batches 1-3 pattern: Node.js script using `execFileSync` for git commands, active branch guard, auto-unstage before staging, duplicate commit detection, subset verification, and missing-file abort.
- **D-02:** The script stays untracked in the workspace as a development artifact (staged and committed later in Batch 5).

### File Scope
- **D-03:** Stage only files matching `tests/*.test.cjs` — 20 test files currently modified since v1.41.2. Test infrastructure files (`tests/helpers.cjs`, vitest configs) are NOT included unless they match the `.test.cjs` pattern.
- **D-04:** SDK scope is strictly `sdk/src/cli.ts` only — hardcoded, no dynamic scan of the `sdk/` directory.
- **D-05:** `scripts/run-tests.cjs` is included in Batch 4 (test runner groups with test files). `scripts/gen-inventory-manifest.cjs` is explicitly excluded — it belongs in Batch 5 (maintenance/utility).

### Commit
- **D-06:** Commit message: `test: refactor core tests and SDK validation (Batch 4)`.

### Inherited Patterns (from Phases 36-38)
- **D-07:** Active branch guard — abort if current branch is not `thamw-main`, unless overridden via `ALLOW_ANY_BRANCH=1`.
- **D-08:** Auto-unstage — run `git reset` before staging to clear any pre-existing staged changes.
- **D-09:** Duplicate commit detection — check latest commit message; if it already matches the Batch 4 commit message, exit 0 early.
- **D-10:** Subset verification — verify all staged files are a subset of the expected file list. Any unauthorized files cause immediate abort and index reset.
- **D-11:** Missing-file abort — if any target file is completely missing from disk, fail the staging process.
- **D-12:** Silent skip — if a target file exists but has no changes since v1.41.2, skip it silently.

### Claude's Discretion
None specified. Follow the established `scripts/stage-batch-N.cjs` pattern from batches 1-3.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — Defines STAGE-04 requirement for this batch
- `.planning/ROADMAP.md` — Milestone phases and Phase 39 success criteria
- `.planning/PROJECT.md` — Fork core values and constraints

### Staging Automation Reference
- `scripts/stage-batch-1.cjs` — Canonical pattern for batch staging scripts
- `scripts/stage-batch-2.cjs` — Pattern with scanner-specific additions
- `scripts/stage-batch-3.cjs` — Pattern with directory-based file discovery

### Prior Phase Context
- `.planning/phases/36-stage-and-commit-configuration-rules/36-CONTEXT.md` — Batch 1 decisions
- `.planning/phases/37-stage-and-commit-scanner-logic/37-CONTEXT.md` — Batch 2 decisions
- `.planning/phases/38-stage-and-commit-workflows-agents-templates/38-CONTEXT.md` — Batch 3 decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/stage-batch-1.cjs` — Complete reference implementation: `hasChangesSinceV1_41_2()` helper, expected files Set, git reset unstaging, subset verification, duplicate commit guard.
- Git CLI — `git add -f`, `git diff --cached --name-only`, `git diff --quiet v1.41.2 -- <file>`, `git cat-file -e v1.41.2:<file>`.
- Node.js `child_process.execFileSync` — Synchronous git command execution pattern.

### Established Patterns
- Batch staging scripts follow a consistent 10-step structure: build expected set → check duplicate commit → git reset → stage changed files → verify subset → commit.
- Scripts are committed in Batch 5 (maintenance), not with their target batch.
- Conventional commit format with batch identifier in message.

### Integration Points
- Git staging index and commit history — this is batch 4 of 5 in the sequential refactor.
- Phase 41 (Final Verification) depends on all 5 batches being committed correctly for zero-diff validation.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following the batch 1-3 pattern.

</specifics>

<deferred>
## Deferred Ideas

- `scripts/gen-inventory-manifest.cjs` — modified but belongs in Batch 5 (maintenance/utility scripts), not Batch 4 (tests).

</deferred>

---

*Phase: 39-Stage and Commit Tests & SDK Validation*
*Context gathered: 2026-05-22*
