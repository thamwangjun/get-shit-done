# Phase 68: Spec Scaffold - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase builds the meta-structure that every downstream feature-spec phase (69–77) depends on. It produces four things in `.planning/spec/`:

1. `INDEX.md` — the spec-set manifest: feature-status table (ID, feature, spec link, status, depends-on), dependency graph, and Wave 1 / Wave 2 build order. Plus the explicit "Excluded from scope" section.
2. `00-CONVENTIONS.md` — the meta-spec: per-feature spec template, REQ-ID/SPEC-ID/invariant-ID scheme, status vocabulary (Draft/Ready/Implemented/Verified), and the source-of-truth hierarchy.
3. The "Excluded from scope" list (lives inside INDEX.md per SCAF-03).
4. Eight numbered feature subdirectories (`01-positive-framing/` through `08-test-infrastructure/`), each with a `SPEC.md` stub.

This phase defines structure and conventions only — no feature is specced here. It MUST come first so all eight feature-spec phases inherit a settled template, ID scheme, dependency order, and scope guardrails.

</domain>

<decisions>
## Implementation Decisions

### Spec Template (00-CONVENTIONS.md)
- **D-01:** Adopt the research-recommended per-feature spec template **verbatim** as the mandatory canonical section order. Source: `.planning/research/SUMMARY.md` → "Recommended Per-Feature Spec Template". Canonical order:
  1. Frontmatter block (ID, Status, Confidence, Specced date, Reimplementation target)
  2. Purpose (one paragraph — the "why")
  3. Scope (explicit in-scope / out-of-scope bullets)
  4. Invariants (numbered, falsifiable EARS statements with RFC 2119 strength; ≥2 per spec)
  5. Acceptance Tests (invariant→test traceability table)
  6. Key Decisions (settled decisions "do not reopen" + consequence of reopening)
  7. Code Context (advisory-marked — current paths/symbols that will not survive the upstream refactor)
- 00-CONVENTIONS.md locks this order as the required template all 8 feature specs follow. Consistency across specs is the goal; no per-spec section drift.

### Stub Depth (8 feature SPEC.md files)
- **D-02:** Each stub contains **populated frontmatter + an empty section skeleton** matching the template. Frontmatter is populated now (feature ID, `Status: Draft`, depends-on, reimplementation target); section headers from the canonical template are present but empty. The feature-spec phases (69–76) fill the bodies.
- Rationale: satisfies success criterion 4 ("populated frontmatter") and gives each feature-spec author a ready skeleton to fill, without pre-writing content that belongs to the feature phase.

### Exclusion List (INDEX.md "Excluded from scope")
- **D-03:** **Exhaustive sweep with per-item rationale.** Pull every Out-of-Scope item from `.planning/PROJECT.md` (§ Out of Scope) PLUS the four items SCAF-03 names explicitly (XML tag hierarchy `<persona>`/`<intent>`/`<objective>`, the `resolveIncludes()` stepping stone, the `parseV()` semver block). Each entry records: **what it was**, **why it's excluded**, and **where it lived** (so a reimplementer recognizes and skips it). This is the most reimplementer-proof option — the exclusion list is a primary guard against carrying forward abandoned work.

### ID Scheme (00-CONVENTIONS.md)
- **D-04:** Collision-free, three-tier ID rule (LOCKED):
  - **Requirement IDs stay unchanged** — `SCAF-01..03`, `SPEC-01..08` in REQUIREMENTS.md remain the milestone/feature handles. Each is a *whole feature*, NOT an invariant. INDEX.md keys its feature-status table on these.
  - **Invariant IDs are feature-scoped**, prefixed with the feature's two-digit directory number: `NN-INV-M` (e.g. `01-INV-1`, `02-INV-3`). Globally unique across the whole spec set, sortable, and move-proof (the number is stable even if the slug changes).
  - **Back-reference:** each feature spec's frontmatter carries a `Requirement:` field pointing to its REQUIREMENTS.md handle (e.g. `Requirement: SPEC-01`).
  - **Traceability tables** key on the invariant ID (`01-INV-1 | tests/negative-framing-scan.test.cjs | <subtest>`), so Phase 77's cross-spec reconciliation never encounters an ambiguous bare `INV-1`.
  - This explicitly **rejects** the research-proposed `SPEC-NNN`-as-invariant-ID scheme, because `SPEC-NN` already denotes a feature in REQUIREMENTS.md and would collide.

### Claude's Discretion
- Exact INDEX.md table column formatting and dependency-graph rendering (Mermaid vs ASCII vs nested list) — planner/executor choose, provided the dependency graph and Wave 1/Wave 2 build order are both legible.
- Exact status-vocabulary phrasing and the source-of-truth hierarchy wording in 00-CONVENTIONS.md, as long as it reflects the tier-1..tier-4 evidence model from research (tier-1 = test assertions, down to tier-4 = reference guides known-stale).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope & requirements
- `.planning/REQUIREMENTS.md` — SCAF-01..03 (this phase's requirements) and SPEC-01..08 (the eight feature handles the INDEX manifest must list).
- `.planning/ROADMAP.md` §"Phase 68: Spec Scaffold" (lines ~773–782) — success criteria; also §"Phase 69–77" for the dependency/wave structure the INDEX must encode (QUAL-01..05 quality bars at ~767).
- `.planning/PROJECT.md` §"Out of Scope" (lines ~167–175) — the authoritative source for the exhaustive exclusion-list sweep (D-03). Also §"Current Milestone: v2.1.0-h" for the reimplementation-readiness goal.

### Spec format & template authority
- `.planning/research/SUMMARY.md` — recommended stack (CommonMark + RFC 2119 + EARS), the canonical per-feature spec template (D-01), the `SPEC-NNN`/advisory-marker/traceability conventions, and the tier-1..tier-4 evidence hierarchy.
- `.planning/research/STACK.md` — detailed template section order and conventions referenced by SUMMARY.
- `.planning/research/PITFALLS.md` — spec-writing failure modes (capturing implementation detail without behavioral contract); informs 00-CONVENTIONS guidance.

### Per-feature evidence anchors (for INDEX depends-on + stub frontmatter)
- ROADMAP.md Phase 69–76 detail blocks name each feature's tier-1 test file (e.g. `tests/negative-framing-scan.test.cjs`, `tests/install-eta-regression.test.cjs`, `tests/no-issue-citations.test.cjs`, step-numbering + cross-file-step-refs tests, the 330-row effort golden snapshot). Stub frontmatter `Reimplementation target` / depends-on should reflect these.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.planning/research/` is already populated (SUMMARY, STACK, PITFALLS, FEATURES, TESTS, VIOLATIONS, CATALOGUE) — the scaffold's conventions and exclusion list draw directly from these rather than re-deriving.
- Existing GSD ID conventions (SCAF/SPEC requirement IDs already in REQUIREMENTS.md, decimal phase numbering) — the invariant-ID scheme (D-04) extends rather than replaces these.

### Established Patterns
- The milestone follows GSD's wave-execution model: INDEX.md's Wave 1 (features 01, 02, 04, 08 — independent) / Wave 2 (03, 05, 06, 07 — dependent) build order maps directly onto parallel-phase execution. The dependency graph in INDEX must agree with the `Depends on` lines in ROADMAP Phases 69–77.

### Integration Points
- `.planning/spec/` is a NEW directory (confirmed absent). This phase creates it from scratch — no merge with existing spec content.
- INDEX.md feature-status table and Phase 77 (Cross-Spec Consistency Review) are coupled: Phase 77 reconciles the manifest, per-spec depends-on, traceability tables, and exclusion list. The scaffold must make all four mechanically checkable.

</code_context>

<specifics>
## Specific Ideas

- Invariant ID format is explicitly `NN-INV-M` (two-digit feature number + `-INV-` + sequence), e.g. `01-INV-1`. Not slug-based, not a global `SPEC-NNN` namespace.
- Exclusion list entries use a what / why / where structure per item.
- The four SCAF-03-named exclusions are mandatory floor items, but D-03 requires sweeping ALL PROJECT.md Out-of-Scope items on top of them.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Slug-based invariant prefixes like `POSFRAME-INV-1` were considered and rejected in favor of move-proof two-digit numbering.)

</deferred>

---

*Phase: 68-spec-scaffold*
*Context gathered: 2026-06-11*
