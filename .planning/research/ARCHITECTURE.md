# Architecture Research: Spec Set Organization

**Domain:** Multi-document feature-spec collection for fork reimplementation
**Researched:** 2026-06-11
**Confidence:** HIGH — derived directly from the fork's own GSD conventions, existing milestone artifacts, and the eight named features in PROJECT.md

## Standard Architecture

### System Overview

```
.planning/spec/
├── INDEX.md                   # manifest + dependency graph + build order
├── 00-CONVENTIONS.md          # how to read a spec, traceability model, REQ-ID scheme
│
├── 01-positive-framing/
│   └── SPEC.md
├── 02-sha-versioning/
│   └── SPEC.md
├── 03-hooks-build/
│   └── SPEC.md
├── 04-eta-materialization/
│   └── SPEC.md
├── 05-step-numbering/
│   └── SPEC.md
├── 06-thinking-effort/
│   └── SPEC.md
├── 07-citation-guard/
│   └── SPEC.md
└── 08-test-infrastructure/
    └── SPEC.md
```

Each numbered directory holds exactly one `SPEC.md`. The number encodes the suggested reimplementation order and is the stable anchor for cross-spec dependency references (`spec-02`, `spec-06`, etc.).

### Component Responsibilities

| Component | Responsibility | How It Works |
|-----------|----------------|--------------|
| `INDEX.md` | Single entry point; manifest of all specs, dependency graph, build order, status column | Human-readable table + Mermaid or ASCII dependency diagram |
| `00-CONVENTIONS.md` | Meta-spec: explains REQ-ID scheme, traceability model, status vocabulary, how a cold reader navigates | Written once; spec authors reference it |
| `NN-feature/SPEC.md` | Complete, self-contained specification for one feature | Structured sections (see below); no runtime code |

## Recommended Project Structure

```
.planning/spec/
├── INDEX.md               # ALWAYS the first file a reader opens
├── 00-CONVENTIONS.md      # read second; explains the system
│
├── 01-positive-framing/
│   └── SPEC.md            # framing standard + negative-framing scanner
├── 02-sha-versioning/
│   └── SPEC.md            # update worker + install.js SHA + statusline + check-latest-version
├── 03-hooks-build/
│   └── SPEC.md            # ensureHooksDist on-demand build
├── 04-eta-materialization/
│   └── SPEC.md            # Eta v4 install-time include resolution
├── 05-step-numbering/
│   └── SPEC.md            # scanner + normalize CLI + cross-file-ref scanner
├── 06-thinking-effort/
│   └── SPEC.md            # model;effort label + resolver + catalog + spawn wiring + install.js
├── 07-citation-guard/
│   └── SPEC.md            # no-issue-citations.test.cjs guard + corpus cleanup process
└── 08-test-infrastructure/
    └── SPEC.md            # scanner-precedence rule + serial isolation + fork test suite layout
```

### Structure Rationale

- **One directory per feature:** keeps each spec's future supporting files (diagrams, fixtures) co-located without polluting the index level.
- **Numeric prefix on directories, not files:** the prefix is the build-order encoding; `SPEC.md` is always the filename so tooling and humans find it without guessing.
- **`INDEX.md` at root level, not inside a subfolder:** the orchestrator and a cold reader both want `ls .planning/spec/` to reveal the entry point immediately.
- **`00-CONVENTIONS.md` numbered 00:** never conflicts with a feature spec; sorts to top; read before any `SPEC.md`.

## Architectural Patterns

### Pattern 1: INDEX.md as Manifest + DAG

**What:** The index document contains three things in order: a feature-status table, a dependency diagram, and a reimplementation-order table. These are the three questions a cold reader asks first.

**When to use:** Always. The index is the contract between the spec set and the roadmapper.

**Structure:**

```markdown
# Fork Feature Spec — Index

## Feature Status

| # | Feature | Spec | Status | Depends On |
|---|---------|------|--------|------------|
| 01 | Positive Framing | [SPEC](01-positive-framing/SPEC.md) | DRAFT | — |
| 02 | SHA Versioning | [SPEC](02-sha-versioning/SPEC.md) | DRAFT | — |
| 03 | Hooks Build | [SPEC](03-hooks-build/SPEC.md) | DRAFT | spec-02 |
| 04 | Eta Materialization | [SPEC](04-eta-materialization/SPEC.md) | DRAFT | — |
| 05 | Step Numbering | [SPEC](05-step-numbering/SPEC.md) | DRAFT | spec-08 |
| 06 | Thinking Effort | [SPEC](06-thinking-effort/SPEC.md) | DRAFT | spec-08 |
| 07 | Citation Guard | [SPEC](07-citation-guard/SPEC.md) | DRAFT | spec-08 |
| 08 | Test Infrastructure | [SPEC](08-test-infrastructure/SPEC.md) | DRAFT | — |

## Dependency Graph

spec-02 ──→ spec-03
spec-08 ──→ spec-05
spec-08 ──→ spec-06
spec-08 ──→ spec-07
(all others: no hard dependencies)

## Reimplementation Order

Wave 1 (no deps):   spec-01, spec-02, spec-04, spec-08
Wave 2 (after w1):  spec-03, spec-05, spec-06, spec-07
```

**Trade-offs:** The index must be kept in sync as specs are written. Stale status column is the main failure mode — mitigate by making status values minimal: DRAFT / READY / IMPLEMENTED.

### Pattern 2: Self-Contained SPEC.md

**What:** Every `SPEC.md` is written so it can be read cold, with no other file required. It opens with a one-paragraph summary, states the "why this feature exists" explicitly, then proceeds through requirements and implementation notes.

**When to use:** Always. The reimplementation target is a refactored upstream where current file paths and module names will not match. Specs that depend on knowing the current code structure will become invalid.

**Canonical SPEC.md section order:**

```markdown
# Spec: [Feature Name]

**ID:** spec-NN
**Status:** DRAFT | READY | IMPLEMENTED
**Depends on:** spec-XX, spec-YY (or "none")
**Reimplementation phase:** Phase N (from roadmap, filled in after roadmapping)

## Summary

[One paragraph. What this feature does. Why the fork has it. What breaks without it.]

## Motivation

[Why upstream does not have this. What problem it solves for the fork. The decision rationale
that justifies the implementation cost — draw from PROJECT.md Key Decisions.]

## Requirements

### Validated REQ-IDs

List every REQ-ID from PROJECT.md that this feature owns. These are the acceptance criteria.

| REQ-ID | Description | Test File | Test Name / Subtest |
|--------|-------------|-----------|---------------------|
| SCAN-01 | Scanner detects bare `avoid [verb]` directives | negative-framing-scan.test.cjs | "avoid verb" subtest |

### Behavioral Requirements

Narrative requirements not yet encoded as tests. Written as SHALL statements.
The reimplementer converts these to tests before coding.

## Implementation Notes

[Subsystem map: which files/modules are involved. Written at the conceptual level —
describe what each subsystem does, not what the current file path is. Current paths
cited in parentheses as orientation only.]

## Test Surface

[Which test files cover this feature. For each: what it guards, what makes it RED.]

## Known Constraints and Gotchas

[The "Key Decisions" relevant to this feature, extracted from PROJECT.md.
This is the distilled wisdom that prevents the reimplementer from repeating mistakes.]

## Done Criteria

[Checklist. "Feature is IMPLEMENTED when:" — must be verifiable by running tests.]
```

**Trade-offs:** Verbose per spec. Justified because the reimplementation context is a heavily-refactored codebase; the spec must be the source of truth, not the current code.

### Pattern 3: Traceability via REQ-ID Table

**What:** Every spec contains a Requirements table that maps each validated REQ-ID (from PROJECT.md) to its test file and subtest name. This is the traceability link.

**When to use:** Always. The roadmapper and the reimplementer both need to know "how will I know this is done?"

**Model:**

```
PROJECT.md (REQ-IDs) → SPEC.md Requirements table → test file → subtest
```

For REQ-IDs that are validated but whose test file has been identified, the table entry is complete. For requirements that exist as narrative only (not yet tested), the Test File column reads "none — add test first."

**Trade-offs:** Requires reading PROJECT.md to populate the table. This is unavoidable — PROJECT.md is the authoritative source of validated requirements for this fork.

### Pattern 4: Multi-Subsystem Features Stay in One Spec

**What:** Features that span multiple subsystems (e.g., thinking effort spans `model-catalog.json`, `init.cjs`, `resolve.cjs`, spawn templates, and `install.js`) stay in a single `SPEC.md`. The Implementation Notes section uses a subsystem table to map the feature's touch points.

**When to use:** When a feature has one coherent behavioral contract, regardless of how many files it touches. Split into multiple specs only when two distinct features happen to be implemented in the same file — not when one feature happens to touch many files.

**Subsystem table format:**

```markdown
## Implementation Notes

| Subsystem | Role in Feature | Current File (orientation) |
|-----------|-----------------|---------------------------|
| Parser | Parses `model;effort` label strings | `bin/lib/init.cjs` — `parseModelEffort()` |
| Resolver | Applies precedence chain | `bin/lib/init.cjs` — `resolveReasoningEffortInternal()` |
| Catalog | Stores per-agent effort assignments | `model-catalog.json` + `sdk/src/model-catalog.ts` |
| Spawn templates | Carry effort to Agent() call sites | `get-shit-done/workflows/*.md` |
| Install seam | Materializes effort for non-Claude runtimes | `bin/install.js` — Codex emit boundary |
```

**Trade-offs:** A single large spec is harder to assign to multiple implementers in parallel. Accept this: the fork's reimplementation is sequential by nature (one developer, GSD phases).

### Pattern 5: GSD Phase Mapping

**What:** Each spec maps to one GSD phase in the reimplementation roadmap. The `INDEX.md` wave structure maps directly to GSD's wave execution model. The spec set as a whole maps to a single GSD milestone.

**Recommended phase structure for the reimplementation milestone:**

```
Phase 0:  Index + Conventions setup (produce .planning/spec/ skeleton)
Phase 1:  spec-01 — Positive Framing
Phase 2:  spec-02 — SHA Versioning
Phase 3:  spec-04 — Eta Materialization
Phase 4:  spec-08 — Test Infrastructure  ← completes Wave 1
Phase 5:  spec-03 — Hooks Build          ← depends on spec-02
Phase 6:  spec-05 — Step Numbering       ← depends on spec-08
Phase 7:  spec-06 — Thinking Effort      ← depends on spec-08
Phase 8:  spec-07 — Citation Guard       ← depends on spec-08
Phase 9:  Review + consistency pass across all specs
```

Phases 1–4 are Wave 1 (independent) and can run in parallel under GSD's wave execution. Phases 5–8 are Wave 2 and can also run in parallel with each other once Wave 1 completes.

**Trade-offs:** One spec per phase means 9 phases for 8 features plus the index phase. This is the right granularity — each phase has a single clear deliverable and a clear done criterion (spec READY).

## Data Flow

### Cold-Reader Navigation

```
New reader opens .planning/spec/
    ↓
Reads INDEX.md (status table + dependency graph + build order)
    ↓
Reads 00-CONVENTIONS.md (REQ-ID scheme, status vocab, how to interpret specs)
    ↓
Reads spec for the feature they are implementing (e.g. spec-06)
    ↓
Checks "Depends on" → reads spec-08 first if not done
    ↓
Reads "Validated REQ-IDs" table → locates test files → runs tests RED to confirm baseline
    ↓
Reads "Implementation Notes" → maps to refactored upstream's equivalent modules
    ↓
Reads "Done Criteria" → knows exactly what passing looks like
```

### Roadmapper Consumption

```
Roadmapper reads INDEX.md
    ↓
Reads wave structure → generates Phase N entries in ROADMAP.md
    ↓
For each phase: reads SPEC.md "Done Criteria" → becomes phase acceptance criteria
    ↓
Reads "Depends on" → encodes as depends_on: in PLAN.md frontmatter
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 8 features (current) | One directory per feature, flat layout, single index |
| 15-20 features | Group into functional clusters (enforcement, infrastructure, content-quality); add a cluster-level README |
| 30+ features | Two-level hierarchy: cluster directories each containing feature subdirectories |

The current 8-feature set does not need clustering. The flat layout with numeric prefixes is sufficient and keeps navigation simple.

## Anti-Patterns

### Anti-Pattern 1: Spec Per Subsystem Instead of Spec Per Feature

**What people do:** Create `spec-06a-parser.md`, `spec-06b-resolver.md`, `spec-06c-catalog.md` because the feature touches many files.

**Why it's wrong:** The feature's behavioral contract is one thing. Splitting by subsystem creates artificial dependencies between spec documents and forces the reimplementer to synthesize the feature from fragments. The implementation will naturally discover the subsystem split.

**Do this instead:** One spec per feature. Use an Implementation Notes subsystem table to enumerate touch points within that one spec.

### Anti-Pattern 2: Specs That Reference Current File Paths as Requirements

**What people do:** Write requirements like "parseModelEffort in bin/lib/init.cjs must parse semicolon-delimited strings."

**Why it's wrong:** The refactored upstream will have different file paths and module structure. A spec that requires the current path is invalid before the reimplementation starts.

**Do this instead:** Write behavioral requirements ("the parser SHALL accept `model;effort` format and return `{ model, effort }` or `{ model, effort: null }` for bare model strings"). Cite current paths in Implementation Notes as orientation only, clearly labeled "(current path — will differ on refactored upstream)."

### Anti-Pattern 3: No Cold-Start Entry Point

**What people do:** Put all spec files at the flat root with no index, or name them `feature-positive-framing.md` without a manifest.

**Why it's wrong:** The roadmapper agent spawned months later has no context. It must infer dependencies from content rather than reading a dependency graph. Build order becomes guesswork.

**Do this instead:** `INDEX.md` at the root of `.planning/spec/` is mandatory. It is the first file the roadmapper reads. The numeric prefix on directories encodes order so the manifest and directory listing agree.

### Anti-Pattern 4: REQ-IDs Without Test Pointers

**What people do:** List REQ-IDs as acceptance criteria without mapping them to specific test files and subtest names.

**Why it's wrong:** "SCAN-01 is satisfied" is not verifiable without knowing which test subtest to run. The reimplementer has to grep through the test suite to find coverage.

**Do this instead:** Every REQ-ID in a spec's requirements table has a `Test File` and `Test Name` column. If no test exists, the entry reads "none — write test first (TDD gate)."

### Anti-Pattern 5: Mixing SPEC Content With Planning Artifacts

**What people do:** Put phase plans, wave assignments, or PLAN.md-style content inside `SPEC.md`.

**Why it's wrong:** Specs are requirements documents. Plans are execution documents. Mixing them makes the spec stale the moment planning changes and makes the requirements harder to find.

**Do this instead:** `SPEC.md` contains only: summary, motivation, requirements, implementation notes, test surface, constraints, done criteria. Phase assignments live in the roadmap. Wave assignments live in `INDEX.md`.

## Integration Points

### With GSD Planning Infrastructure

| Boundary | How It Connects | Notes |
|----------|-----------------|-------|
| `SPEC.md` → PLAN.md | PLAN.md `description:` cites the spec; `acceptance_criteria:` copies "Done Criteria" verbatim | Roadmapper agent reads SPEC.md to generate PLAN.md |
| `INDEX.md` wave structure → PLAN.md `depends_on:` | Dependency graph entries become `depends_on: [phase-N]` in PLAN frontmatter | Direct mechanical translation |
| `SPEC.md` REQ-ID table → PLAN.md `requirements:` | Each validated REQ-ID with test pointer becomes a requirement row | Traceability chain: PROJECT.md → SPEC.md → PLAN.md → test |
| `00-CONVENTIONS.md` → roadmapper agent prompt | Conventions doc is injected as required reading for the roadmapper | Ensures consistent interpretation |

### With Existing Fork Artifacts

| Artifact | Role in Spec Set |
|----------|------------------|
| `PROJECT.md` `## Requirements` section | Source of all validated REQ-IDs; each spec harvests the REQ-IDs that belong to its feature |
| `PROJECT.md` `## Key Decisions` | Source of "Known Constraints and Gotchas" in each spec |
| `MILESTONES.md` | Source of implementation detail for "what was actually built" — supplements spec's Implementation Notes |
| Test files in `tests/` | The ground truth for "Done Criteria" — each spec's done criteria must be runnable |

## Sources

- Derived from `PROJECT.md` current milestone (v2.1.0-h) and all eight named features
- Derived from `MILESTONES.md` shipped milestones v2.1.0-a through v2.1.0-g
- Derived from GSD's own phase/plan/wave execution model as described in `CLAUDE.md`
- No external sources needed — this is a structural organization question with all inputs available locally

---
*Architecture research for: Fork Feature Spec Set Organization (.planning/spec/)*
*Researched: 2026-06-11*
