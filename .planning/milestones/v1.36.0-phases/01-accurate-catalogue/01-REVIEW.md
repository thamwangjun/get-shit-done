---
phase: 01-accurate-catalogue
reviewed: 2026-04-15T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - CATALOGUE.json
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-15
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

`CATALOGUE.json` is a structured registry of 250 GSD artefacts across five categories (commands, workflows, agents, references, templates). The `total` field, per-category `counts`, and all array lengths are internally consistent and match the actual files present on disk exactly — no phantom entries, no missing entries, no duplicate paths, and all items have non-empty `file` and `description` fields.

Two data-quality issues were found: a naming-convention inconsistency (`extract_learnings` uses underscores while all 248 other entries use hyphens) and a description formatting inconsistency (7 of 31 agent entries use multi-sentence prose with trailing periods while all other 243 entries use single-sentence fragments without periods). Three informational observations are also noted.

## Warnings

### WR-01: Naming Convention Violation — Underscore Instead of Hyphen

**File:** `CATALOGUE.json` (lines 32 and 112)
**Issue:** Two catalogue entries use underscore separators (`extract_learnings`) while all 248 other entries use hyphen separators. This breaks convention consistency and will cause the file to sort out of alphabetical order relative to its hyphen-named neighbours in any lexicographic listing tool. The underscore naming also reflects the filenames on disk, so fixing here alone would create a mismatch.

Affected entries:
- `commands/gsd/extract_learnings.md` (line 32)
- `get-shit-done/workflows/extract_learnings.md` (line 112)

**Fix:** Rename the two source files and update both catalogue entries to use hyphens:

```json
{ "file": "commands/gsd/extract-learnings.md", "description": "Extract decisions, lessons, patterns, and surprises from completed phase artifacts" }
{ "file": "get-shit-done/workflows/extract-learnings.md", "description": "Extracts decisions, lessons learned, patterns, and surprises from completed phase artifacts into a structured LEARNINGS.md file" }
```

This requires also renaming the actual `.md` files on disk and updating any workflows that reference them by path.

---

### WR-02: Description Format Inconsistency — 7 Agent Entries Use Multi-Sentence Prose

**File:** `CATALOGUE.json` (agent entries at approximately lines 164, 169, 173–178, 181)
**Issue:** 7 of 31 agent entries have multi-sentence descriptions that end with a period, while all other 243 entries (including the remaining 24 agents) use a single-sentence fragment with no trailing period. This inconsistency means consumers of the catalogue (e.g., `gsd help`, documentation generators, or future search tooling) cannot apply uniform description rendering.

Affected agents:
- `agents/gsd-ai-researcher.md`
- `agents/gsd-debug-session-manager.md`
- `agents/gsd-domain-researcher.md`
- `agents/gsd-eval-auditor.md`
- `agents/gsd-eval-planner.md`
- `agents/gsd-framework-selector.md`
- `agents/gsd-pattern-mapper.md`

**Fix:** Condense each to a single-sentence fragment without a trailing period, matching the dominant pattern. Example:

```json
{ "file": "agents/gsd-ai-researcher.md", "description": "Researches a chosen AI framework's official docs to produce implementation-ready guidance for the AI-SPEC.md framework sections" }
{ "file": "agents/gsd-debug-session-manager.md", "description": "Manages multi-cycle debug checkpoint and continuation loop, spawning gsd-debugger agents and applying fixes in isolated context" }
{ "file": "agents/gsd-eval-auditor.md", "description": "Retroactively audits an implemented AI phase's evaluation coverage and produces a scored EVAL-REVIEW.md with gap analysis" }
{ "file": "agents/gsd-eval-planner.md", "description": "Designs a structured evaluation strategy for an AI phase with failure modes, rubrics, tooling, and reference dataset" }
{ "file": "agents/gsd-framework-selector.md", "description": "Presents an interactive decision matrix to surface the right AI/LLM framework and produces a scored recommendation with rationale" }
{ "file": "agents/gsd-pattern-mapper.md", "description": "Analyzes codebase for existing patterns and produces PATTERNS.md mapping new files to closest analogs for the plan-phase workflow" }
```

---

## Info

### IN-01: 8 Commands Have No Matching Workflow Entry

**File:** `CATALOGUE.json`
**Issue:** The following 8 commands have no corresponding entry in the `workflows` array. This may be intentional (commands that are self-contained or route to a renamed workflow), but if any of these delegate to a workflow file not listed, the catalogue is incomplete.

Commands without a workflow:
- `add-backlog`, `from-gsd2`, `graphify`, `intel`, `resume-work`, `review-backlog`, `thread`, `workstreams`

Note: `resume-work` routes to `resume-project.md` (a workflow-side name change), which suggests at least some of these have unlisted workflows.

**Fix:** Audit each command's body to confirm whether it invokes a workflow file. If it does, add the workflow to the catalogue. If commands are genuinely self-contained, document this in the catalogue (e.g., via a `standalone: true` field or a comment in the CLAUDE.md).

---

### IN-02: 10 Workflows Have No Matching Command Entry

**File:** `CATALOGUE.json`
**Issue:** The following 10 workflows have no corresponding command entry. Internal/sub-workflows are expected not to have commands, but this is worth confirming for each:

- `diagnose-issues`, `discovery-phase`, `discuss-phase-assumptions`, `discuss-phase-power`, `execute-plan`, `inbox`, `node-repair`, `resume-project`, `transition`, `verify-phase`

**Fix:** No action required if these are confirmed internal orchestration workflows not meant to be user-facing. Consider adding a `visibility: internal` field to the schema to make this intent explicit and allow tooling to distinguish user-facing from internal workflows.

---

### IN-03: No Schema Version Field

**File:** `CATALOGUE.json` (line 1)
**Issue:** The catalogue has no `version` or `schema_version` field. As the catalogue grows and the schema evolves (e.g., adding `standalone`, `visibility`, or other fields), there is no way for consumers to detect a schema change or validate they are reading a compatible version.

**Fix:** Add a `version` field at the top level:

```json
{
  "version": "1.0",
  "total": 250,
  ...
}
```

---

_Reviewed: 2026-04-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
