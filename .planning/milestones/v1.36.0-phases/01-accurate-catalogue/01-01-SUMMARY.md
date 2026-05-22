---
phase: 01-accurate-catalogue
plan: 01
subsystem: CATALOGUE.json
tags: [catalogue, json, v1.36.0, sync]
dependency_graph:
  requires: []
  provides: [accurate CATALOGUE.json with 250 entries covering all v1.36.0 files]
  affects: [Phase 2 fork-standards application pass]
tech_stack:
  added: []
  patterns: [JSON catalogue maintenance — insert-at-position with count updates]
key_files:
  created: []
  modified:
    - CATALOGUE.json
decisions:
  - Inserted entries at exact alphabetical positions specified by plan — no re-sorting of existing arrays
  - Used verbatim descriptions from plan (sourced from each file's own frontmatter/metadata)
  - Escaped double-quote in gsd-domain-researcher.md description as required by JSON spec
requirements_completed: [CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, CAT-06]
metrics:
  duration: "< 10 minutes"
  completed: "2026-04-15"
  tasks_completed: 2
  files_modified: 1
---

# Phase 1 Plan 01: Add 23 Missing v1.36.0 Entries to CATALOGUE.json Summary

## What Was Built

CATALOGUE.json updated from 227 entries to 250 entries by inserting all 23 files added in the v1.36.0 upstream merge. Per-category counts and total updated to match actual array lengths. JSON remains syntactically valid and all 250 declared paths exist on disk.

## Tasks Completed

| Task | Description | Commit | Result |
|------|-------------|--------|--------|
| 1 | Add 23 missing entries and update counts/total | 0716241 | PASS |
| 2 | Verify counts, array lengths, and no stale entries | (no file changes) | PASS |

## Entries Added

### Commands (5 new — CAT-01)
- `commands/gsd/ai-integration-phase.md` — AI design contract generation for phases involving AI systems
- `commands/gsd/eval-review.md` — Retroactive audit of AI phase evaluation coverage
- `commands/gsd/extract_learnings.md` — Extract decisions and lessons from completed phase artifacts
- `commands/gsd/from-gsd2.md` — Import GSD-2 projects back to GSD v1 format
- `commands/gsd/graphify.md` — Build and inspect project knowledge graph

### Workflows (3 new — CAT-02)
- `get-shit-done/workflows/ai-integration-phase.md` — AI design contract orchestrator
- `get-shit-done/workflows/eval-review.md` — Retroactive eval coverage audit
- `get-shit-done/workflows/extract_learnings.md` — Structured LEARNINGS.md extraction

### Agents (7 new — CAT-03)
- `agents/gsd-ai-researcher.md` — AI framework docs researcher for AI-SPEC.md
- `agents/gsd-debug-session-manager.md` — Multi-cycle debug checkpoint manager
- `agents/gsd-domain-researcher.md` — Business domain researcher for AI system context
- `agents/gsd-eval-auditor.md` — Retroactive eval coverage auditor
- `agents/gsd-eval-planner.md` — Evaluation strategy designer for AI phases
- `agents/gsd-framework-selector.md` — AI/LLM framework decision matrix presenter
- `agents/gsd-pattern-mapper.md` — Codebase pattern analyzer and PATTERNS.md producer

### References (7 new — CAT-04)
- `get-shit-done/references/ai-evals.md` — AI evaluation frameworks and rubric patterns
- `get-shit-done/references/ai-frameworks.md` — AI framework decision matrix
- `get-shit-done/references/executor-examples.md` — Executor extended examples
- `get-shit-done/references/gates.md` — Canonical gate types taxonomy
- `get-shit-done/references/ios-scaffold.md` — iOS app scaffold rules
- `get-shit-done/references/planner-antipatterns.md` — Planner anti-patterns reference
- `get-shit-done/references/planner-source-audit.md` — Planner source audit format

### Templates (1 new — CAT-05)
- `get-shit-done/templates/AI-SPEC.md` — AI integration specification template

### Counts Updated (CAT-06)
| Category | Before | After |
|----------|--------|-------|
| commands | 68 | 73 |
| workflows | 72 | 75 |
| agents | 24 | 31 |
| references | 33 | 40 |
| templates | 30 | 31 |
| **total** | **227** | **250** |

## Verification Results

```
JSON valid
250
{"commands":73,"workflows":75,"agents":31,"references":40,"templates":31}
commands: declared=73 actual=73 OK
workflows: declared=75 actual=75 OK
agents: declared=31 actual=31 OK
references: declared=40 actual=40 OK
templates: declared=31 actual=31 OK
total: declared=250 sum=250 OK
No stale entries
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — CATALOGUE.json is a complete index with all 250 paths resolvable on disk.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries introduced. CATALOGUE.json is a static data file.

## Self-Check: PASSED

- [x] `CATALOGUE.json` exists and is valid JSON
- [x] Commit `0716241` exists: `feat(01-01): add 23 missing v1.36.0 entries to CATALOGUE.json`
- [x] All 23 new entries present (grep verified)
- [x] counts match actual array lengths (node verified)
- [x] No stale entries (node verified)
