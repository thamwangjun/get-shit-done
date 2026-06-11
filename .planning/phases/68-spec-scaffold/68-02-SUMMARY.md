---
phase: 68-spec-scaffold
plan: "02"
subsystem: spec-scaffold
tags: [spec, manifest, index, dependency-graph, exclusion-list]
dependency_graph:
  requires: ["68-01"]
  provides: [".planning/spec/INDEX.md"]
  affects: ["69-spec-01", "70-spec-02", "71-spec-04", "72-spec-08"]
tech_stack:
  added: []
  patterns: [block-header-frontmatter, github-markdown-table, wave-build-order]
key_files:
  created:
    - .planning/spec/INDEX.md
  modified: []
decisions:
  - "INDEX.md uses ASCII dependency graph (not Mermaid) — legible and consistent with repo's plain-text convention; both arrows and wave split are clear"
  - "XML tag hierarchy exclusion recorded once (not duplicated) — PROJECT.md item and SCAF-03 floor item describe the same thing; single consolidated entry with complete what/why/where"
  - "Excluded from scope section uses H3 subsections per item (not a table) — each entry needs multi-sentence what/why/where; a table would truncate rationale"
metrics:
  duration: "~2m"
  completed: "2026-06-11"
  tasks_completed: 1
  files_changed: 1
---

# Phase 68 Plan 02: INDEX.md Manifest Summary

**One-liner:** Spec-set manifest INDEX.md with 8-row feature-status table, ASCII dependency graph, Wave 1/Wave 2 build order, and 9 exhaustive exclusion entries covering all PROJECT.md Out-of-Scope items plus 3 SCAF-03 floor items.

## What Was Built

Created `.planning/spec/INDEX.md` — the spec-set manifest that every downstream feature-spec phase (69–76) reads before authoring. The file uses block-header frontmatter (not YAML), matching the `.planning/` documentation convention.

**Feature-status table** (columns: ID, Feature, Spec, Status, Depends On) — one row per SPEC-01..08, all at Draft status, keyed on REQUIREMENTS.md handles. Spec column links resolve to the 8 stub paths created in plan 68-01. Depends On uses the em-dash glyph for independent features (01, 02, 04, 08) and REQUIREMENTS.md handle references for dependent ones (03→SPEC-02; 05/06/07→SPEC-08).

**Dependency graph** — ASCII render showing SPEC-02→SPEC-03 and SPEC-08→{SPEC-05, SPEC-06, SPEC-07} arrows, with root nodes labeled.

**Build order** — `**Wave N** *(blocked-on note)*` with bulleted spec lines, matching ROADMAP Phases 69–77 exactly (Wave 1 = 69/70/71/72, Wave 2 = 73/74/75/76).

**Excluded from scope section** — 9 entries with what/why/where triads:
1. XML tag hierarchy (`<persona>` / `<intent>` / `<objective>`)
2. `resolveIncludes()` stepping stone
3. `parseV()` semver block
4. Changing GSD core functionality or runtime behavior
5. Separate per-file changelog
6. Applying fork standards to `get-shit-done/templates/`
7. Applying fork standards to `get-shit-done/references/`
8. Em-dash complement pattern (`do not X — use Y`) deferral
9. Fixing DO NOT violations in `sdk/` or `tests/`

Plus a consolidation note: "XML tag hierarchy conversion decision (2026-04-30)" is not a separate entry because it is the same exclusion as item 1 — recorded once with a cross-reference note.

## Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Write INDEX.md (feature-status table + dependency graph + wave order + exclusion sweep) | 177dfe0c | .planning/spec/INDEX.md |

## Verification

- `.planning/spec/INDEX.md` exists with block-header frontmatter (H1 + bold key block + `---`), not YAML: PASS
- Feature-status table has one row per SPEC-01..08 with all five columns; all 8 Spec links present: PASS
- Dependency graph shows SPEC-02→SPEC-03 and SPEC-08→{SPEC-05, SPEC-06, SPEC-07}: PASS
- Wave 1 (01/02/04/08) and Wave 2 (03/05/06/07) agree with ROADMAP Phases 69–77: PASS
- "Excluded from scope" section contains resolveIncludes, parseV, persona: PASS
- Every PROJECT.md Out-of-Scope item has a what/why/where entry: PASS

Automated verification script (from plan): all checks passed, exit code 0.

## Deviations from Plan

None — plan executed exactly as written.

The plan listed SCAF-03 as naming "four floor items" but the action description explicitly enumerates three non-overlapping items (XML tag hierarchy, resolveIncludes(), parseV()) — the XML tag hierarchy conversion decision (2026-04-30) is the same item as the XML tag hierarchy entry, not a fourth distinct item. This was correctly handled by recording the XML hierarchy once with a consolidation note, satisfying the plan requirement.

## Requirements Satisfied

- SCAF-01: INDEX.md is the spec-set manifest with feature-status table, dependency graph, and Wave 1/Wave 2 build order — SATISFIED
- SCAF-03: INDEX.md "Excluded from scope" exhaustively sweeps PROJECT.md Out-of-Scope plus SCAF-03 floor items, each with what/why/where triad — SATISFIED
- Phase 68 success criteria 1 and 3 — SATISFIED

## Self-Check: PASSED

- `.planning/spec/INDEX.md` — FOUND
- Commit 177dfe0c — FOUND
