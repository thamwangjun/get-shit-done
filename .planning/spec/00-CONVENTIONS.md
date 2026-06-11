# Spec Conventions — v2.1.0-h Fork Feature Specification

**Defines:** per-feature spec template, ID scheme, status vocabulary, source-of-truth hierarchy
**Status:** Ready
**Authored:** 2026-06-11

---

This document is the meta-spec for the `.planning/spec/` spec set. It locks the canonical
per-feature spec template, the three-tier ID scheme, the status vocabulary, and the
source-of-truth hierarchy that every downstream feature-spec phase (69–76) inherits. No
per-spec section drift is permitted — every `SPEC.md` in this set follows this template
exactly, in this order.

---

## 1. Canonical Per-Feature Spec Template

The mandatory section order for every feature `SPEC.md` is (7 sections total):

### Section 1 — Frontmatter block

A block-header frontmatter block directly under the `# SPEC-NN: <Feature Name>` H1,
blank-line-separated, followed by `---`. Keys in this order:

```
**ID:** NN
**Requirement:** SPEC-NN
**Status:** Draft | Ready | Implemented | Verified
**Confidence:** <set when body is written>
**Specced:** <ISO date set when body is written>
**Reimplementation target:** v2.1.0-h fork features on refactored upstream
**Depends on:** — | SPEC-NN
**Reimplementation evidence (tier-1 test):** <test file path>
```

Block-header frontmatter is NOT YAML. Do not use `---\nkey: value\n---` fences. The
H1 title is the spec's human name; the block carries structured metadata. This matches the
`.planning/` documentation convention used throughout the repo.

### Section 2 — `## Purpose`

One paragraph stating the "why" — the goal an AI implementing agent needs to understand to
avoid optimizing for the wrong outcome. Focuses on the behavioral contract, not the current
implementation. Required: explain what breaks if this feature is absent or wrong.

### Section 3 — `## Scope`

Explicit bullet lists under two subheads:

- **In scope:** behaviors, inputs, outputs, and invariants this spec governs.
- **Out of scope:** adjacent behaviors, superseded work, and related features this spec
  intentionally does NOT govern. Every out-of-scope item SHOULD have a one-line rationale.

### Section 4 — `## Invariants`

Numbered, falsifiable EARS statements with RFC 2119 strength. Minimum 2 per spec.
Invariant IDs use the `NN-INV-M` format (see §2 ID Scheme below). Each invariant must be a
single testable claim. EARS patterns: Ubiquitous (`The system SHALL …`), Event-driven (`When
… the system SHALL …`), State-driven (`While … the system SHALL …`), Unwanted-behavior
(`If … then the system SHALL NOT …`), Optional-feature (`Where … the system SHALL …`).

Example well-formed invariant:
> **01-INV-1** — When the corpus scanner processes a source file, the system MUST flag any
> string matching the `doNot` / `never` / `dont` / `antiPatterns` / `mustNot` / `shouldNot`
> / `cannot` / `wont` / `willNot` / `prohibited` / `forbidden` patterns as a negative-framing
> violation. Consequence of violating this invariant: non-conforming negative directives
> shipped to users without flagging.

This section is the normative behavioral contract. Every MUST-level invariant MUST also
appear in the Acceptance Tests traceability table.

### Section 5 — `## Acceptance Tests`

Invariant-to-test traceability table, keyed on `NN-INV-M`. Required columns:

| Invariant | Test File | Subtest / Assertion Shape |
|-----------|-----------|--------------------------|

Use `[MISSING — write test first]` if no test exists for a MUST-level invariant.
Traceability tables key on the invariant ID (`NN-INV-M`), never on a bare `INV-M` or
prose description. This table is the primary audit artifact for Phase 77 cross-spec review.

### Section 6 — `## Key Decisions`

Settled decisions the reimplementer MUST honor. Each entry:

- Decision statement
- Rationale (one sentence)
- **Settled — do not reopen.** Consequence of reopening: `<what breaks>`

This section prevents re-litigation of choices already made. It is distinct from Invariants:
decisions are architectural/design choices, invariants are observable behavioral contracts.

### Section 7 — `## Code Context`

`<!-- advisory -->` — Current file paths, function names, and symbols that point a
reimplementer to the existing implementation. This section is ADVISORY ONLY. Every path and
symbol listed here will likely not survive the upstream refactor. Requirements in §
Invariants must survive a file move; this section must not be the source of any normative
claim. Use `<!-- advisory -->` marker on the section or on individual items.

---

**This 7-section order is the locked template. No per-spec section drift is permitted.**
A spec that adds, removes, reorders, or renames these sections is non-conforming and will
be rejected at the Phase 77 cross-spec consistency review.

---

## 2. ID Scheme (D-04, LOCKED)

Three tiers. This scheme is collision-free and move-proof across the full spec set.

### Tier 1 — Requirement IDs (whole-feature handles)

`SCAF-01`, `SCAF-02`, `SCAF-03`, `SPEC-01` through `SPEC-08` are the requirement IDs from
`REQUIREMENTS.md`. These are **whole-feature handles** — each identifies a complete feature
or scaffold artifact, not an individual invariant. `INDEX.md` keys its feature-status table
on these IDs.

**These IDs stay unchanged.** They must not be used as invariant IDs.

### Tier 2 — Invariant IDs (feature-scoped, `NN-INV-M`)

Every individual invariant within a spec has a stable ID in the format `NN-INV-M`:

- `NN` = two-digit directory number of the feature's subdirectory (e.g. `01` for
  `01-positive-framing/`)
- `-INV-` = literal separator
- `M` = sequence number within the spec (1, 2, 3, …)

Examples: `01-INV-1`, `01-INV-2`, `02-INV-1`, `08-INV-3`.

Properties:
- **Globally unique** across the entire spec set (no two features share the same prefix).
- **Sortable** — alphanumeric sort is meaningful.
- **Move-proof** — the two-digit number is stable even if the slug portion of the directory
  name changes.

Traceability tables in `## Acceptance Tests` MUST key on `NN-INV-M`. Using a bare `INV-M`
is non-conforming because it is ambiguous across features.

**This scheme explicitly rejects** the research-proposed `SPEC-NNN`-as-invariant-ID approach
because `SPEC-NN` already denotes a whole feature in `REQUIREMENTS.md` and would collide.

### Tier 3 — Requirement back-reference (`Requirement:` frontmatter key)

Each spec's frontmatter MUST carry a `Requirement:` field pointing to its `REQUIREMENTS.md`
handle:

```
**Requirement:** SPEC-01
```

This links each spec to its requirement for traceability without ambiguity.

### ID reference table

| Directory | ID (NN) | Requirement (Tier 1) | Invariant prefix (Tier 2) |
|-----------|---------|----------------------|--------------------------|
| `01-positive-framing/` | 01 | SPEC-01 | `01-INV-M` |
| `02-sha-versioning/` | 02 | SPEC-02 | `02-INV-M` |
| `03-hooks-build/` | 03 | SPEC-03 | `03-INV-M` |
| `04-eta-materialization/` | 04 | SPEC-04 | `04-INV-M` |
| `05-step-numbering/` | 05 | SPEC-05 | `05-INV-M` |
| `06-thinking-effort/` | 06 | SPEC-06 | `06-INV-M` |
| `07-citation-guard/` | 07 | SPEC-07 | `07-INV-M` |
| `08-test-infrastructure/` | 08 | SPEC-08 | `08-INV-M` |

---

## 3. Status Vocabulary

Each `SPEC.md` carries a `**Status:**` field in its frontmatter. The allowed values form a
pipeline:

`Draft | Ready | Implemented | Verified`

| Status | Meaning |
|--------|---------|
| **Draft** | Stub created; frontmatter populated; section skeleton present; body not yet written. The feature-spec phase (69–76) has not run. |
| **Ready** | Body fully written; all invariants stated; acceptance-tests table complete; key decisions recorded. Ready for reimplementation. |
| **Implemented** | The feature has been reimplemented on the refactored upstream against this spec. |
| **Verified** | Reimplementation has been verified — all tier-1 tests pass, all MUST invariants confirmed, Phase 77 review passed. |

A spec MUST NOT advance to `Ready` unless it satisfies QUAL-01 through QUAL-05 (all from
`REQUIREMENTS.md`). A spec MUST NOT advance to `Verified` unless `npm test` is green and
Phase 77 reconciliation has completed.

---

## 4. Source-of-Truth Hierarchy

For any feature's current behavior, sources are authoritative in this order:

1. **Test assertions** (tier 1) — the test IS the spec. For corpus scanners and guards, the
   test file's assertion list is the primary normative source.
2. **Source code behavior** (tier 2) — what the code actually does, not what reference docs
   claim. Consult the actual implementation for edge cases and error modes.
3. **Project history** — `PROJECT.md` Key Decisions, `PROJECT_HISTORY.md`, `MILESTONES.md`
   (tier 3). Use for rationale and decision provenance; not authoritative for current behavior.
4. **Reference guides** — `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` and similar
   (tier 4 — background context only, known-stale for several features).

**Hard rule:** Every spec MUST cite at least one tier-1 (test) or tier-2 (source) artifact.
A spec that cites only tier-4 guides without also citing a test file or source file is
relying on stale source and will be rejected at review.

**Gap-to-address note:** Each feature spec harvests its `Requirement:` handle from
`REQUIREMENTS.md`. Corpus counts (e.g., "12+ detection patterns") are recorded "current as of
<date>" in the spec body with the assertion *shape* — not the count — being normative. Counts
change with every upstream merge; the shape of what is asserted is the durable contract.

**Advisory markers:** Any claim in `## Code Context` that references a current file path,
function name, or symbol MUST be marked `<!-- advisory -->`. Advisory content is informational
only and does not constitute a normative requirement.
