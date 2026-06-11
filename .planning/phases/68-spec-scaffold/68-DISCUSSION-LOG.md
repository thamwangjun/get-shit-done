# Phase 68: Spec Scaffold - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 68-spec-scaffold
**Areas discussed:** Spec template, Stub depth, Exclusion list, ID scheme

---

## Spec template (00-CONVENTIONS.md)

| Option | Description | Selected |
|--------|-------------|----------|
| Adopt research template verbatim | Lock the canonical section order from research/SUMMARY.md as the mandatory template | ✓ |
| Adopt with adjustments | Use the research template as a base but tweak sections before locking | |
| Discuss from scratch | Work through what sections a SPEC.md needs, research as input not default | |

**User's choice:** Adopt research template verbatim
**Notes:** Canonical order = Frontmatter → Purpose → Scope → Invariants → Acceptance Tests → Key Decisions → advisory-marked Code Context. Consistency across all 8 specs is the priority.

---

## Stub depth (8 feature SPEC.md files)

| Option | Description | Selected |
|--------|-------------|----------|
| Frontmatter + section skeleton | Populated frontmatter + empty section headers matching the template | ✓ |
| Frontmatter only | Just the frontmatter block per success criterion 4 | |
| Frontmatter + skeleton + Purpose seed | Skeleton plus a one-line Purpose placeholder from the roadmap goal | |

**User's choice:** Frontmatter + section skeleton
**Notes:** Feature-spec phases (69–76) fill the bodies; scaffold provides the ready skeleton.

---

## Exclusion list (INDEX.md "Excluded from scope")

| Option | Description | Selected |
|--------|-------------|----------|
| Exhaustive sweep + per-item rationale | Every PROJECT.md Out-of-Scope item + the 4 SCAF-03 named ones; each with what / why / where | ✓ |
| Named minimum + brief reason | Just the SCAF-03 items, one-line reason each | |
| Exhaustive sweep, names only | Comprehensive but terse, no rationale | |

**User's choice:** Exhaustive sweep + per-item rationale
**Notes:** Exclusion list is a primary guard against carrying forward abandoned work — most reimplementer-proof option chosen.

---

## ID scheme (00-CONVENTIONS.md)

| Option | Description | Selected |
|--------|-------------|----------|
| Discuss — this needs a clear rule | Work out a collision-free relationship between requirement IDs and invariant IDs | ✓ (flagged for discussion) |
| Feature-scoped invariant IDs | Local invariant numbering, REQUIREMENTS IDs as feature handle | |
| Defer to CONVENTIONS author | Lock only that a collision-free scheme must exist | |

**Follow-up decision (after discussion):**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, lock it | `NN-INV-M` invariant IDs, requirement IDs as frontmatter back-reference, traceability keyed on invariant ID | ✓ |
| Yes, but slug-based prefix | Readable prefix like POSFRAME-INV-1 | |
| Adjust the rule | Refine format or back-reference mechanism | |

**User's choice:** Yes, lock it
**Notes:** Three-tier rule — (1) requirement IDs SCAF/SPEC-NN unchanged as feature handles; (2) invariants feature-scoped `NN-INV-M` (e.g. 01-INV-1), globally unique and move-proof; (3) frontmatter `Requirement:` back-reference. Explicitly rejects research's `SPEC-NNN`-as-invariant scheme (collides with REQUIREMENTS.md SPEC-NN). Slug-based prefixes considered and rejected for move-proofing.

## Claude's Discretion

- INDEX.md table column formatting and dependency-graph rendering style.
- Exact status-vocabulary phrasing and source-of-truth hierarchy wording (must reflect the tier-1..tier-4 evidence model).

## Deferred Ideas

None — discussion stayed within phase scope.
