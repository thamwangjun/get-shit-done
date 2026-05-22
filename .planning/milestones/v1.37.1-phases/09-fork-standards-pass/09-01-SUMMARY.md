---
phase: 09-fork-standards-pass
plan: "01"
subsystem: prompt-engineering
tags: [v09-audit, positive-framing, xml-structure, workflows, references, commands]
dependency_graph:
  requires: []
  provides: [v09-conformant-new-files]
  affects: [get-shit-done/workflows, get-shit-done/references, commands/gsd]
tech_stack:
  added: []
  patterns: [v09-xml-structure, named-step-elements, required_reading-block]
key_files:
  created: []
  modified:
    - get-shit-done/workflows/spec-phase.md
    - get-shit-done/references/mandatory-initial-read.md
decisions:
  - "spec-phase.md workflow required <required_reading> block and <step name=\"...\"> tags — added both without altering business logic"
  - "mandatory-initial-read.md lacked a # Title heading — added to conform to reference file standard"
  - "All other 17 in-scope files were already V09-conformant — no edits needed"
metrics:
  duration: "~25 minutes"
  completed: "2026-04-18"
  tasks_completed: 3
  files_modified: 2
---

# Phase 9 Plan 1: New Files V09 Standards Pass — Summary

Apply the PROMPT_ENGINEERING_GUIDE V09 structural quality bar to all 19 in-scope new prompt files from v1.37.1. Confirm negative-framing scanner baseline, audit each file against 8 V09 dimensions, fix all structural gaps found.

## Scanner Baseline

Confirmed before any edits:

```
ℹ tests 34
ℹ pass 34
ℹ fail 0
ℹ duration_ms 119.771824
```

Scanner baseline: 34/34 PASS — no violations present entering Plan 01.

## Task 0: Analog File Confirmation (NEW-05, NEW-11, NEW-16, NEW-19)

Four files confirmed already V09-conformant. These serve as structural analogs for later tasks.

| File | Type | Result |
|------|------|--------|
| commands/gsd/spike.md | Command | Already conformant — no edits needed |
| get-shit-done/references/sketch-interactivity.md | Data reference | Already conformant — no edits needed |
| get-shit-done/workflows/sketch.md | Workflow | Already conformant — no edits needed |
| get-shit-done/workflows/spike.md | Workflow | Already conformant — no edits needed |

All 8 V09 dimensions checked for each file. No gaps found. Scanner confirmed 34/34 before and after.

## Task 1: V09 Audit — 6 Command Files

All command files audited against V09 structure: `<objective>` first, `<execution_context>` second, `<context>` middle, `<process>` as single delegation sentence. Spec-phase.md was read as the `<success_criteria>` extended-variant analog.

### Per-File Results

| File | Dim 1 Task Spec | Dim 2 Framing | Dim 3 XML | Dim 4 Placement | Dim 6 Persona | Dim 7 CoT | Dim 8 Constraints | Result |
|------|----------------|---------------|-----------|-----------------|---------------|-----------|-------------------|--------|
| commands/gsd/inbox.md | PASS | PASS | PASS | PASS | PASS (absent) | PASS (absent) | PASS | No gaps |
| commands/gsd/sketch.md | PASS | PASS | PASS | PASS | PASS (absent) | PASS (absent) | PASS | No gaps |
| commands/gsd/sketch-wrap-up.md | PASS | PASS | PASS | PASS | PASS (absent) | PASS (absent) | PASS | No gaps |
| commands/gsd/spec-phase.md | PASS | PASS | PASS | PASS | PASS (absent) | PASS (absent) | PASS | No gaps (analog) |
| commands/gsd/spike.md | PASS | PASS | PASS | PASS | PASS (absent) | PASS (absent) | PASS | No gaps (analog) |
| commands/gsd/spike-wrap-up.md | PASS | PASS | PASS | PASS | PASS (absent) | PASS (absent) | PASS | No gaps |

All 6 command files were already V09-conformant. Zero edits needed for command layer.

Acceptance criteria verified:
- All files have `<objective>` as first content block after frontmatter: confirmed (lines 13–14)
- All files have `<execution_context>` with at least one @file include: confirmed
- No `<step>` tags inside `<process>` blocks: confirmed (grep -c returned 0 for all)
- No `<persona>` blocks: confirmed

## Task 2: V09 Audit — 5 Workflow Files and 8 Reference Files

### Workflow Files

Three workflow files audited: sketch-wrap-up.md, spec-phase.md, spike-wrap-up.md. (sketch.md and spike.md serve as conformant analogs.)

| File | Gap Found | Fix Applied |
|------|-----------|-------------|
| get-shit-done/workflows/sketch-wrap-up.md | None | Already conformant — no edits needed |
| get-shit-done/workflows/spec-phase.md | **Two gaps**: (1) Missing `<required_reading>` block; (2) Process steps used `## Step N:` Markdown headers instead of `<step name="...">` XML tags | Added `<required_reading>` block; converted all 8 `## Step` headers to `<step name="...">` / `</step>` pairs |
| get-shit-done/workflows/spike-wrap-up.md | None | Already conformant — no edits needed |

### Reference Files

Seven reference files audited (sketch-interactivity.md serves as analog).

| File | Classification | Gap Found | Fix Applied |
|------|---------------|-----------|-------------|
| get-shit-done/references/autonomous-smart-discuss.md | Behavioral instruction | None — has title + one-line purpose | Already conformant — no edits needed |
| get-shit-done/references/debugger-philosophy.md | Data/taxonomy | None — has title + one-line purpose | Already conformant — no edits needed |
| get-shit-done/references/mandatory-initial-read.md | Behavioral (critical directive) | Missing `# Title` heading — file used `**CRITICAL:**` bold text only, no Markdown `#` heading | Added `# Mandatory Initial Read` heading as first line |
| get-shit-done/references/project-skills-discovery.md | Behavioral instruction | None — has title + one-line purpose | Already conformant — no edits needed |
| get-shit-done/references/sketch-theme-system.md | Data/taxonomy | None — has title + one-line purpose | Already conformant — no edits needed |
| get-shit-done/references/sketch-tooling.md | Data/taxonomy | None — has title + one-line purpose | Already conformant — no edits needed |
| get-shit-done/references/sketch-variant-patterns.md | Data/taxonomy | None — has title + one-line purpose | Already conformant — no edits needed |

Data reference files (sketch-theme-system.md, sketch-tooling.md, sketch-variant-patterns.md, sketch-interactivity.md) confirmed clean — no XML tags added to data documents.

## Files with Zero Edits (Already V09-Conformant)

17 of 19 in-scope files required no edits:

- commands/gsd/inbox.md
- commands/gsd/sketch.md
- commands/gsd/sketch-wrap-up.md
- commands/gsd/spec-phase.md
- commands/gsd/spike.md
- commands/gsd/spike-wrap-up.md
- get-shit-done/references/autonomous-smart-discuss.md
- get-shit-done/references/debugger-philosophy.md
- get-shit-done/references/project-skills-discovery.md
- get-shit-done/references/sketch-interactivity.md
- get-shit-done/references/sketch-theme-system.md
- get-shit-done/references/sketch-tooling.md
- get-shit-done/references/sketch-variant-patterns.md
- get-shit-done/workflows/sketch.md
- get-shit-done/workflows/sketch-wrap-up.md
- get-shit-done/workflows/spike.md
- get-shit-done/workflows/spike-wrap-up.md

## Files Edited (2 of 19)

- **get-shit-done/workflows/spec-phase.md**: Added `<required_reading>` block; converted 8 `## Step N:` Markdown headers to `<step name="...">` XML tags with closing `</step>` tags — 26 insertions, 8 deletions
- **get-shit-done/references/mandatory-initial-read.md**: Added `# Mandatory Initial Read` title heading as first line — 1 insertion

## Exempt File

- get-shit-done/templates/spec.md (NEW-15) — confirmed exempt per plan. No edits made.

## Final Scanner Result

```
ℹ tests 34
ℹ pass 34
ℹ fail 0
```

## Final Full Suite Result

```
ℹ tests 4112
ℹ pass 4110
ℹ fail 2
```

Failure count is exactly 2 — the pre-existing managed-hooks.test.cjs and verification-overrides.test.cjs failures (Phase 10 scope). No new failures introduced.

## Deviations from Plan

None — plan executed exactly as written. The two fixes applied (spec-phase.md structural gaps, mandatory-initial-read.md missing title) were identified through the V09 audit process described in the plan and fall within normal task execution, not deviation territory.

## Decisions Made

- spec-phase.md workflow had a unique structure (`<ambiguity_model>`, `<interview_perspectives>`, `<critical_rules>` blocks) that is V09-compatible — these non-standard XML blocks are domain-specific vocabulary for this workflow and do not violate V09
- mandatory-initial-read.md is classified as a behavioral-instruction reference (single critical directive), not a data/taxonomy reference — title heading added to match reference standard without adding XML wrapping

## Known Stubs

None. All files are complete prompt-engineering content with no placeholder text or wired data dependencies.

## Self-Check: PASSED

- `get-shit-done/workflows/spec-phase.md` — exists and contains `<step name="initialize">` through `<step name="wrap_up">` with `<required_reading>` block
- `get-shit-done/references/mandatory-initial-read.md` — exists and begins with `# Mandatory Initial Read`
- Commit a81637d — confirmed present in git log
- Scanner: 34/34 pass
- Full suite: 4110/4112 pass (exactly 2 pre-existing failures)
