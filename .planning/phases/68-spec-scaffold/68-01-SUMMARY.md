---
phase: 68-spec-scaffold
plan: "01"
subsystem: planning/spec
tags: [spec-scaffold, conventions, stubs, id-scheme, status-vocabulary]
dependency_graph:
  requires: []
  provides:
    - .planning/spec/00-CONVENTIONS.md
    - .planning/spec/01-positive-framing/SPEC.md
    - .planning/spec/02-sha-versioning/SPEC.md
    - .planning/spec/03-hooks-build/SPEC.md
    - .planning/spec/04-eta-materialization/SPEC.md
    - .planning/spec/05-step-numbering/SPEC.md
    - .planning/spec/06-thinking-effort/SPEC.md
    - .planning/spec/07-citation-guard/SPEC.md
    - .planning/spec/08-test-infrastructure/SPEC.md
  affects: []
tech_stack:
  added: []
  patterns:
    - block-header frontmatter (H1 + bold-key block + --- rule, no YAML)
    - NN-INV-M invariant ID format
    - 7-section per-feature spec template (D-01 order)
key_files:
  created:
    - .planning/spec/00-CONVENTIONS.md
    - .planning/spec/01-positive-framing/SPEC.md
    - .planning/spec/02-sha-versioning/SPEC.md
    - .planning/spec/03-hooks-build/SPEC.md
    - .planning/spec/04-eta-materialization/SPEC.md
    - .planning/spec/05-step-numbering/SPEC.md
    - .planning/spec/06-thinking-effort/SPEC.md
    - .planning/spec/07-citation-guard/SPEC.md
    - .planning/spec/08-test-infrastructure/SPEC.md
  modified: []
decisions:
  - "D-04 ID scheme locked: SCAF/SPEC requirement IDs unchanged as whole-feature handles; invariant IDs are feature-scoped NN-INV-M; each stub carries a Requirement: back-reference"
  - "D-01 template order locked: 7 sections (Frontmatter, Purpose, Scope, Invariants, Acceptance Tests, Key Decisions, Code Context) — no per-spec drift permitted"
  - "Block-header frontmatter (not YAML) used for all .planning/spec/ files, matching repo-wide .planning/ convention"
metrics:
  duration: "3m"
  completed: "2026-06-11T14:06:31Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 9
  files_modified: 0
---

# Phase 68 Plan 01: Spec Scaffold — Conventions and Stubs Summary

**One-liner:** Meta-spec `00-CONVENTIONS.md` locks the 7-section template + `NN-INV-M` ID scheme + status vocabulary + tier hierarchy; eight `SPEC.md` stubs ship with populated block-header frontmatter and empty skeleton ready for feature-spec phases 69–76.

## What Was Built

### Task 1: 00-CONVENTIONS.md meta-spec

Created `.planning/spec/00-CONVENTIONS.md` using block-header frontmatter (H1 title + bold-key block + `---` rule, no YAML). The file defines:

- **Canonical 7-section template** (D-01, locked): Frontmatter block → `## Purpose` → `## Scope` → `## Invariants` → `## Acceptance Tests` → `## Key Decisions` → `## Code Context`. No per-spec section drift permitted.
- **Three-tier ID scheme** (D-04, locked): Requirement IDs `SCAF-01..03` / `SPEC-01..08` are whole-feature handles (unchanged); invariant IDs are feature-scoped `NN-INV-M` (two-digit dir number + `-INV-` + sequence), globally unique, sortable, move-proof; each spec frontmatter carries a `Requirement:` back-reference. Explicitly rejects `SPEC-NNN`-as-invariant-ID collision with REQUIREMENTS.md handles.
- **Status vocabulary**: `Draft | Ready | Implemented | Verified` with one-line meaning per stage.
- **Tier-1..tier-4 source-of-truth hierarchy**: test assertions (1) → source behavior (2) → project history (3) → reference guides (4, known-stale). Hard rule: every spec must cite tier-1 or tier-2.

### Task 2: Eight SPEC.md stubs

Created `.planning/spec/01-positive-framing/SPEC.md` through `.planning/spec/08-test-infrastructure/SPEC.md`, one per feature. Each stub:

- Block-header frontmatter (not YAML) with keys: `ID`, `Requirement`, `Status: Draft`, `Confidence`, `Specced`, `Reimplementation target`, `Depends on`, `Reimplementation evidence (tier-1 test)`.
- Empty 7-section skeleton matching the locked D-01 template order, with one HTML comment placeholder per section describing what the feature-spec phase (69–76) will fill.
- No pre-written invariants, scope bullets, or decisions — those belong to the feature-spec phases.

Dependency values:

| Stub | Depends on | Tier-1 test |
|------|------------|-------------|
| 01-positive-framing | — | tests/negative-framing-scan.test.cjs |
| 02-sha-versioning | — | tests/version-detection.test.cjs |
| 03-hooks-build | SPEC-02 | tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs |
| 04-eta-materialization | — | tests/install-eta-regression.test.cjs |
| 05-step-numbering | SPEC-08 | tests/step-numbering-scan.test.cjs |
| 06-thinking-effort | SPEC-08 | tests/feat-58-regression.test.cjs |
| 07-citation-guard | SPEC-08 | tests/no-issue-citations.test.cjs |
| 08-test-infrastructure | — | fork test-suite layout / SERIAL_FILES convention |

## Decisions Made

1. **D-04 ID scheme locked** — Three-tier, collision-free. SCAF/SPEC requirement IDs stay unchanged as whole-feature handles; invariant IDs use `NN-INV-M` format (feature-scoped, globally unique, move-proof). Traceability tables key on `NN-INV-M`, never bare `INV-M`. Explicitly rejects research-proposed `SPEC-NNN`-as-invariant approach.

2. **D-01 template order locked** — 7 sections in the fixed canonical order (Frontmatter, Purpose, Scope, Invariants, Acceptance Tests, Key Decisions, Code Context). All eight stubs conform. No section drift permitted at Phase 77 review.

3. **Block-header frontmatter throughout** — No YAML frontmatter in `.planning/spec/` files. All docs use the H1 + bold-key block + `---` convention matching the rest of the `.planning/` directory.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

All eight `SPEC.md` files are intentional stubs. Their bodies are empty by design per D-02: each has populated frontmatter and an empty skeleton. Feature-spec phases 69–76 will fill the bodies. This is expected and documented in the plan.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. This plan creates Markdown files only under `.planning/spec/` (developer-local planning directory). No executable code, no runtime surface added.

## Self-Check: PASSED

- `.planning/spec/00-CONVENTIONS.md` exists: FOUND
- `.planning/spec/01-positive-framing/SPEC.md` exists: FOUND
- `.planning/spec/02-sha-versioning/SPEC.md` exists: FOUND
- `.planning/spec/03-hooks-build/SPEC.md` exists: FOUND
- `.planning/spec/04-eta-materialization/SPEC.md` exists: FOUND
- `.planning/spec/05-step-numbering/SPEC.md` exists: FOUND
- `.planning/spec/06-thinking-effort/SPEC.md` exists: FOUND
- `.planning/spec/07-citation-guard/SPEC.md` exists: FOUND
- `.planning/spec/08-test-infrastructure/SPEC.md` exists: FOUND
- Commit 3a438106 (Task 1): FOUND
- Commit a6ecaedf (Task 2): FOUND
