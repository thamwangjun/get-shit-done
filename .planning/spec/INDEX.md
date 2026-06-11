# Spec-Set Manifest — v2.1.0-h Fork Feature Specification

**Manifest of:** v2.1.0-h Fork Feature Specification (8 feature specs)
**Status:** Draft
**Authored:** 2026-06-11

---

This is the index a reimplementer reads first. It records the full feature inventory,
the dependency graph driving phase sequencing, and the explicit exclusion list that is the
primary guard against carrying forward abandoned work.

---

## Feature-Status Table

| ID | Feature | Spec | Status | Depends On |
|----|---------|------|--------|------------|
| SPEC-01 | Positive Framing | [01-positive-framing/SPEC.md](01-positive-framing/SPEC.md) | Draft | — |
| SPEC-02 | SHA Versioning | [02-sha-versioning/SPEC.md](02-sha-versioning/SPEC.md) | Draft | — |
| SPEC-03 | Hooks Build | [03-hooks-build/SPEC.md](03-hooks-build/SPEC.md) | Draft | SPEC-02 |
| SPEC-04 | Eta Materialization | [04-eta-materialization/SPEC.md](04-eta-materialization/SPEC.md) | Draft | — |
| SPEC-05 | Step Numbering | [05-step-numbering/SPEC.md](05-step-numbering/SPEC.md) | Draft | SPEC-08 |
| SPEC-06 | Thinking Effort | [06-thinking-effort/SPEC.md](06-thinking-effort/SPEC.md) | Draft | SPEC-08 |
| SPEC-07 | Citation Guard | [07-citation-guard/SPEC.md](07-citation-guard/SPEC.md) | Draft | SPEC-08 |
| SPEC-08 | Test Infrastructure | [08-test-infrastructure/SPEC.md](08-test-infrastructure/SPEC.md) | Draft | — |

---

## Dependency Graph

```
SPEC-01 ───────────────────────────────────────────── (no deps)
SPEC-02 ────────────────── SPEC-03 (blocked on SPEC-02)
SPEC-04 ───────────────────────────────────────────── (no deps)
SPEC-08 ────────────────── SPEC-05 (blocked on SPEC-08)
             │
             ├──────────── SPEC-06 (blocked on SPEC-08)
             │
             └──────────── SPEC-07 (blocked on SPEC-08)
```

Dependency arrows:
- SPEC-02 → SPEC-03
- SPEC-08 → SPEC-05
- SPEC-08 → SPEC-06
- SPEC-08 → SPEC-07

Root nodes (no dependencies): SPEC-01, SPEC-02, SPEC-04, SPEC-08

---

## Build Order

**Wave 1** *(no dependencies — specced in parallel)*

- SPEC-01 Positive Framing
- SPEC-02 SHA Versioning
- SPEC-04 Eta Materialization
- SPEC-08 Test Infrastructure

**Wave 2** *(blocked on Wave 1 completion)*

- SPEC-03 Hooks Build      ← depends on SPEC-02
- SPEC-05 Step Numbering   ← depends on SPEC-08
- SPEC-06 Thinking Effort  ← depends on SPEC-08
- SPEC-07 Citation Guard   ← depends on SPEC-08

Wave 1 maps to ROADMAP Phases 69 (SPEC-01), 70 (SPEC-02), 71 (SPEC-04), 72 (SPEC-08).
Wave 2 maps to ROADMAP Phases 73 (SPEC-03), 74 (SPEC-05), 75 (SPEC-06), 76 (SPEC-07).
Review: Phase 77 (Cross-Spec Consistency Review — depends on Phases 69–76).

---

## Excluded from Scope

Superseded or abandoned work a reimplementer MUST NOT carry forward. Each entry records
**what** the feature/artifact was, **why** it is excluded, and **where** it lived so a
reimplementer can recognize and skip it.

---

### XML tag hierarchy (`<persona>` / `<intent>` / `<objective>`)

- **What:** A four-level XML tag convention requiring agents to use `<persona>` as their
  primary directive, commands to use `<intent>`, and workflows to use `<objective>`. The
  tag hierarchy was enforced by `fork-intent-tag.test.cjs` (79 commands validated) and
  a separate conversion pass.
- **Why excluded:** Dropped from fork scope on 2026-04-30 (PROJECT.md Key Decisions).
  The overhead of enforcing tag standards on every upstream merge outweighs the benefit.
  Positive framing and quality-bar improvements remain the fork's core value; the tag
  hierarchy does not.
- **Where it lived:** Agent, command, and workflow `.md` files as the outermost structural
  wrapper. The test `tests/fork-intent-tag.test.cjs` was the enforcement point.

---

### `resolveIncludes()` stepping stone

- **What:** A custom include-resolution function (`resolveIncludes()`) written as a stepping
  stone during Phase 44, before the pivot to Eta v4 as the install-time template engine.
  It resolved `@~/` bare-line static refs by reading and inlining referenced files.
- **Why excluded:** Superseded entirely by Eta v4 (`<%~ include() %>`) in Phase 45
  (v2.1.0-c). The pivot was justified because Eta v4 is a production-grade zero-config
  engine with proper include resolution; the custom resolver had growing edge-case complexity.
  The Key Decision "Pivot from custom resolveIncludes() to Eta v4" is recorded in
  PROJECT.md.
- **Where it lived:** `bin/install.js` in the include-resolution path. All source files
  were converted from `@~/` refs to `<%~ include() %>` tags.

---

### `parseV()` semver block

- **What:** A semver parsing block in `gsd-statusline.js` that parsed the installed version
  as a semantic version string and performed ordering comparisons, including a special
  dev-install detection branch.
- **Why excluded:** Removed as part of v2.1.0-a SHA-based versioning. SHAs have no
  inherent ordering; the `isNewer()` equality check (`latest.slice(0,7) !== installed`)
  is the correct semantic for "am I current?" The semver block was also incompatible with
  the fork's SHA-first update model.
- **Where it lived:** `hooks/gsd-statusline.js`, semver dev-install detection block.
  Requirement STAT-01 (`parseV()` semver dev-install block removed) confirmed removal
  in v2.1.0-a.

---

### Changing GSD core functionality or runtime behavior

- **What:** Any modification to GSD's runtime behavior, install logic (beyond template
  materialization), CLI tooling, or agent/workflow execution model that changes what GSD
  *does*, as opposed to what it *says*.
- **Why excluded:** The fork is prompt content only. Every agent, command, and workflow
  file meets the fork's quality bar — the fork does not add new GSD features or alter
  GSD runtime semantics.
- **Where it lived:** Not applicable — this is a standing scope boundary, not a retired
  artifact. Applies everywhere in `bin/`, `get-shit-done/bin/`, and the SDK.

---

### Separate per-file changelog

- **What:** Maintaining a dedicated changelog file for every upstream-modified file,
  tracking changes file-by-file across merges.
- **Why excluded:** Git history is the authoritative record. A per-file changelog would
  duplicate git log with no additional traceability value and high maintenance cost.
- **Where it lived:** Not implemented. Rejected as a tracking approach during milestone
  planning (PROJECT.md Out of Scope).

---

### Applying fork standards to `get-shit-done/templates/`

- **What:** Running the positive-framing scanner, step-numbering scanner, or other fork
  quality gates against files in `get-shit-done/templates/`. Also converting any XML tag
  hierarchy (`<persona>`, `<intent>`, `<objective>`) in template files.
- **Why excluded:** Templates are user-facing boilerplate, not AI prompts. The fork's
  quality bar applies to AI prompt content (agents, commands, workflows). Template style
  and tag hierarchy are both out of scope.
- **Where it lived:** `get-shit-done/templates/` directory. Explicitly excluded from
  `SCAN_DIRS` in the negative-framing scanner test.

---

### Applying fork standards to `get-shit-done/references/`

- **What:** Running the positive-framing scanner, step-numbering scanner, or other fork
  quality gates against files in `get-shit-done/references/`. Also converting XML tag
  hierarchy in reference documents.
- **Why excluded:** Reference documents are background material, not AI prompts. Both
  style standards and tag hierarchy conversion are out of scope for this directory.
- **Where it lived:** `get-shit-done/references/` directory. Explicitly excluded from
  `SCAN_DIRS` in the negative-framing scanner test.

---

### Em-dash complement pattern (`do not X — use Y`) deferral

- **What:** A specific negative-directive pattern where a prohibition is immediately followed
  by an affirmative complement (`do not X — use Y instead`). The replacement rule requires
  a full positive rewrite; the negative phrase must not remain.
- **Why excluded:** Candidates matching this pattern were identified but deferred to a
  future upstream merge pass. The complexity of producing a correct affirmative rewrite
  for each case without degrading instruction quality justified deferral.
- **Where it lived:** Specific files in `agents/`, `commands/gsd/`, and
  `get-shit-done/workflows/`. Tracked in PROJECT.md Out of Scope.

---

### Fixing DO NOT violations in `sdk/` or `tests/`

- **What:** Applying the positive-framing replacement rule (converting `do not X`, `never X`,
  `avoid X` directives to affirmative instructions) to files in `sdk/` or `tests/`.
- **Why excluded:** These directories are explicitly outside `SCAN_DIRS` in
  `tests/negative-framing-scan.test.cjs`. The fork's quality bar applies to AI prompt
  content, not to test assertions or SDK TypeScript source.
- **Where it lived:** `sdk/` and `tests/` directories. Scan scope is defined in the test
  file's `SCAN_DIRS` constant.

---

### XML tag hierarchy conversion decision (2026-04-30)

This item is fully captured under the "XML tag hierarchy (`<persona>` / `<intent>` /
`<objective>`)" entry above. The PROJECT.md Out-of-Scope item and the SCAF-03 floor item
describe the same exclusion; it is recorded once here.
