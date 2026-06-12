---
phase: 71-spec-04-eta-materialization
plan: "01"
subsystem: spec
tags: [documentation, spec, eta, materialization]
dependency_graph:
  requires: []
  provides: [SPEC-04]
  affects: [.planning/spec/04-eta-materialization/SPEC.md]
tech_stack:
  added: []
  patterns: [EARS-invariants, NN-INV-M-scheme, advisory-code-context, shape-normative-not-count]
key_files:
  created: []
  modified:
    - .planning/spec/04-eta-materialization/SPEC.md
decisions:
  - "04-INV-3 kept as one invariant (not split to 04-INV-6) — the three observable engine-config claims fit without overloading the invariant"
  - "ALLOWED_INLINE_REFS rendered as grouped table (prose vs conditional) per RESEARCH recommendation"
  - "Confidence set to High — all claims derived directly from test file reads in Phase 71 research session"
metrics:
  duration: "201s (~3m)"
  completed: "2026-06-12"
  tasks: 2
  files: 1
---

# Phase 71 Plan 01: Eta Materialization Spec Body Summary

SPEC-04 body authored as five EARS invariants (`04-INV-1`..`04-INV-5`) with full Acceptance
Tests traceability, two settled Key Decisions, and advisory Code Context; Status advanced to
`Ready` with Confidence High and Specced 2026-06-12.

## What Was Built

The full body of `.planning/spec/04-eta-materialization/SPEC.md` was authored, filling the
Phase 68 stub. The spec narrates `tests/install-eta-regression.test.cjs` (the sole tier-1
source) into a durable behavioral contract covering the Eta v4 install-time materialization
pipeline across all three copy paths:

- **Purpose:** Explains why the pipeline exists, what breaks when any copy path skips
  rendering, and cites the tier-1 test as behavioral authority.
- **Scope:** In-scope (all three copy paths, ALLOWED_INLINE_REFS rule, include inlining,
  engine config, error contracts) and out-of-scope (SPEC-02 `{{...}}` substitution,
  superseded `resolveIncludes()`, per-runtime skill converters).
- **Invariants:** Five numbered EARS statements `04-INV-1`..`04-INV-5` covering copy-path
  coverage, include inlining, observable engine config, circular-include failure, and
  missing-include failure.
- **Acceptance Tests:** Traceability table keyed on `04-INV-M`; seven rows citing verbatim
  subtest names from the single tier-1 file; `04-INV-3` shares rows with `04-INV-1` and
  `04-INV-2` (no standalone engine-config test exists — acceptable per QUAL-02).
- **Key Decisions:** Two ROADMAP-mandated settled decisions (KD-A: Eta v4 over custom
  `resolveIncludes()`; KD-B: default Eta delimiters) each with consequence-of-reopening.
- **Code Context:** Marked `<!-- advisory -->`; dated opening sentence; advisory symbol
  inventory across `bin/install.js`, `runtime-artifact-layout.cjs`, and the test file;
  explicit correction note that `_copyCommandsAsSkillsViaConverter` is JSDoc-only.
- **Frontmatter:** Status `Ready`, Confidence `High`, Specced `2026-06-12`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 + 2 | Author normative core + Key Decisions/Code Context/Status | c4d483c6 | .planning/spec/04-eta-materialization/SPEC.md |

Both tasks were completed in a single write pass and committed atomically in `c4d483c6`.
Task 1 (Purpose, Scope, Invariants, Acceptance Tests) and Task 2 (Key Decisions, Code Context,
frontmatter Status transition) are both fully satisfied by the committed file.

## Deviations from Plan

None — plan executed exactly as written.

The only discretionary choices made:

1. **04-INV-3 kept as one invariant (not split to 04-INV-6):** The three observable engine-config
   claims (`autoEscape: false`, raw `<%~` output, views-root `resolvePath`) fit cleanly in one
   invariant without overloading it. Claude's Discretion per D-03 / RESEARCH Open Question 1.

2. **ALLOWED_INLINE_REFS rendered as grouped table (prose vs conditional):** The 30-entry list
   is presented as a grouped two-column table matching the comment structure in the test file,
   dated `current as of 2026-06-12`. Claude's Discretion per D-04 / RESEARCH Open Question 2.

3. **Both tasks committed atomically:** Task 1 and Task 2 were authored in a single write pass
   because both sections target the same file. The single commit `c4d483c6` satisfies the
   done criteria for both tasks.

## Verification Results

All automated checks passed:

| Check | Result |
|-------|--------|
| `grep -c '04-INV-'` >= 5 | 15 (five invariant IDs appear across invariants + traceability table) |
| Section headers == 6 | 6 (locked order: Purpose, Scope, Invariants, Acceptance Tests, Key Decisions, Code Context) |
| `tests/install-eta-regression.test.cjs` cited | OK |
| `MISSING — write test first` count == 0 | 0 |
| `TEST-02` count == 0 | 0 |
| `Settled — do not reopen` count >= 2 | 2 |
| `resolveIncludes` present | OK |
| `Default Eta delimiters` present | OK |
| `wrappedConverter` present | OK |
| `**Status:** Ready` | OK |
| `**Specced:** 2026-06-12` | OK |
| `to be filled` count == 0 | 0 |

## Key Decisions Made This Plan

1. **04-INV-3 as one invariant:** The engine-config invariant covers `autoEscape: false`, raw
   `<%~` output, and views-root `resolvePath` in a single `04-INV-3`. Splitting to `04-INV-6`
   was within Claude's Discretion but judged unnecessary — the invariant is not overloaded.

2. **ALLOWED_INLINE_REFS as grouped table:** The 30 allowlisted entries are rendered as a
   two-column table (entry / class) grouped by prose vs conditional, matching the structure
   in the test file's comment annotations.

3. **Confidence: High:** All claims were verified directly against the tier-1 test file in
   the Phase 71 research session. No external web searches were required.

## Known Stubs

None — the spec body is complete. All seven sections are filled; no placeholder comments
remain; Status is `Ready`.

## Threat Flags

None — this plan authored a static Markdown documentation artifact. No new network endpoints,
auth paths, file access patterns, or schema changes were introduced.

## Self-Check: PASSED

- File exists: `.planning/spec/04-eta-materialization/SPEC.md` — confirmed
- Commit `c4d483c6` exists in git log — confirmed
