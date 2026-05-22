---
phase: 19-convert-objective-tags-to-intent-in-skill-files
reviewed: 2026-04-28T00:00:00Z
depth: standard
files_reviewed: 35
files_reviewed_list:
  - commands/gsd/add-backlog.md
  - commands/gsd/ai-integration-phase.md
  - commands/gsd/analyze-dependencies.md
  - commands/gsd/audit-fix.md
  - commands/gsd/audit-uat.md
  - commands/gsd/code-review-fix.md
  - commands/gsd/code-review.md
  - commands/gsd/docs-update.md
  - commands/gsd/eval-review.md
  - commands/gsd/execute-phase.md
  - commands/gsd/explore.md
  - commands/gsd/extract_learnings.md
  - commands/gsd/forensics.md
  - commands/gsd/from-gsd2.md
  - commands/gsd/import.md
  - commands/gsd/inbox.md
  - commands/gsd/list-workspaces.md
  - commands/gsd/manager.md
  - commands/gsd/milestone-summary.md
  - commands/gsd/new-workspace.md
  - commands/gsd/quick.md
  - commands/gsd/remove-workspace.md
  - commands/gsd/research-phase.md
  - commands/gsd/review-backlog.md
  - commands/gsd/scan.md
  - commands/gsd/secure-phase.md
  - commands/gsd/sketch-wrap-up.md
  - commands/gsd/sketch.md
  - commands/gsd/spec-phase.md
  - commands/gsd/spike-wrap-up.md
  - commands/gsd/spike.md
  - commands/gsd/thread.md
  - commands/gsd/undo.md
  - .planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md
  - tests/fork-intent-tag.test.cjs
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 19: Code Review Report

**Reviewed:** 2026-04-28T00:00:00Z
**Depth:** standard
**Files Reviewed:** 35
**Status:** issues_found

## Summary

Phase 19 converted all 33 remaining `<objective>` blocks to `<intent>` in the `commands/gsd/` layer. This review confirms the conversion is complete: grep across all 79 command files finds zero residual `<objective>` or bare `<task>` tags. The `tests/fork-intent-tag.test.cjs` test logic is sound and its code-fence stripping correctly prevents false positives from embedded agent prompt templates. The `.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md` documentation is accurate and consistent with the codebase state.

Two informational issues and one warning were found — none are regressions introduced by Phase 19; all pre-date this phase. They are documented here for completeness.

## Warnings

### WR-01: Duplicate `<intent>` blocks in quick.md

**File:** `commands/gsd/quick.md:15-41`
**Issue:** The file contains two consecutive top-level `<intent>` blocks (lines 15-17 and lines 19-41). The first block is a short one-liner summary; the second is the full flag documentation. There is no structural separator between them. While parsers reading this file will see two `<intent>` sections with no clear precedence, the test at `tests/fork-intent-tag.test.cjs` only checks for absent `<task>`/`<objective>` blocks and does not detect duplicate `<intent>` blocks, so this will not fail CI.

This is a pre-existing condition — Phase 19's scope was `<objective>` → `<intent>` conversions, and `quick.md` already used `<intent>`. However, having two top-level `<intent>` blocks is structurally inconsistent with all other command files, which use a single `<intent>` block.

**Fix:** Merge the two `<intent>` blocks into one cohesive block:
```markdown
<intent>
Execute a small, ad-hoc task with GSD guarantees (atomic commits, STATE.md tracking).

Quick mode uses the same system with a shorter path:
- Spawns gsd-planner (quick mode) + gsd-executor(s)
- Quick tasks live in `.planning/quick/`, separate from planned phases
- Updates STATE.md "Quick Tasks Completed" table (not ROADMAP.md)

**Default:** Skips research, discussion, plan-checker, verifier. Use when the approach is clear.
...
</intent>
```

## Info

### IN-01: `extract_learnings.md` has execute instruction outside a `<process>` block

**File:** `commands/gsd/extract_learnings.md:22`
**Issue:** The instruction `Execute the extract-learnings workflow from @~/.claude/get-shit-done/workflows/extract_learnings.md end-to-end.` appears at line 22 as a bare paragraph after the `</execution_context>` tag, rather than inside a `<process>` block. Every other comparable command file wraps this instruction in `<process>...</process>`. This is a pre-existing inconsistency not introduced by Phase 19.

**Fix:** Wrap the execute instruction in a `<process>` block, consistent with peer files:
```markdown
<process>
Execute the extract-learnings workflow from @~/.claude/get-shit-done/workflows/extract_learnings.md end-to-end.
</process>
```

### IN-02: UPSTREAM_TO_FORK_CHANGES_GUIDE refers to `<task>` → `<intent>` but previous tag was `<objective>`

**File:** `.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md:68-70`
**Issue:** Category 2 documents the rename as `` `<task>` → `<intent>` in command layer ``. However, Phase 18 introduced this as `<objective>` → `<intent>` (for the 33 files converted in Phase 19), while the earlier rename from `<task>` → `<objective>` occurred in a prior phase. The heading and example in the guide conflate both renames into one, which could confuse future maintainers trying to understand upstream merge risk. The `<intent>` tag is correct in all files; only the documentation description is slightly imprecise.

**Fix:** Clarify the history in the heading and description:
```markdown
### `<task>` / `<objective>` → `<intent>` in command layer

Commands in `commands/gsd/` use `<intent>` (not `<task>` or `<objective>`) for their primary directive block.

**Why:** ...

**Example:**
```
Upstream:   <task>Extract implementation decisions...</task>
            (or <objective>...</objective> in intermediate form)
Fork:       <intent>Gather implementation decisions...</intent>
```
```

---

_Reviewed: 2026-04-28T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
