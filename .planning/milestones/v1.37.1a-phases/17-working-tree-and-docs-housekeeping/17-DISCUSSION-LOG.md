# Phase 17: Working Tree & Docs Housekeeping - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 17-working-tree-and-docs-housekeeping
**Areas discussed:** Untracked file disposition, Modified tracked files disposition

---

## Untracked File Disposition

| Option | Description | Selected |
|--------|-------------|----------|
| Commit all | All four tracked in git — clean working tree, everything on record | ✓ |
| Commit all except notes/ | Add `.planning/notes/` to .gitignore | |
| Commit all except mise.toml | mise.toml added to .gitignore | |

**User's choice:** Commit all
**Notes:** `mise.toml`, `.planning/v1.37.1a-MILESTONE-AUDIT.md`, `.planning/phases/14-workflow-reference-and-command-fixes/14-PATTERNS.md`, and `.planning/notes/` directory all committed.

---

## Modified Tracked Files Disposition

| Option | Description | Selected |
|--------|-------------|----------|
| Commit all | Bundle all incidental working-tree modifications into a housekeeping commit | ✓ |
| Discard all | Restore all to HEAD (git restore) | |
| Decide per file | Review each file's diff before deciding | |

**User's choice:** Commit all
**Notes:** `.planning/config.json`, `.planning/research/*.md` (4 files), `package-lock.json`, `sdk/package-lock.json` all committed as a housekeeping bundle. `tests/negative-framing-scan.test.cjs` modification (duplicate describe removal) also included here.

---

## Claude's Discretion

- Exact commit message grouping (one vs. multiple commits)
- Whether to also correct ROADMAP.md Phase 15 SC-2 test count (verify first, then fix if needed)

## Deferred Ideas

None.
