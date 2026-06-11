# Project Research Summary

**Project:** GSD — Prompt-Engineered Fork (v2.1.0-h Fork Feature Specification)
**Domain:** Reimplementation-ready feature specification writing for a fork's unique behaviors
**Researched:** 2026-06-11
**Confidence:** HIGH

## Executive Summary

Milestone v2.1.0-h produces a set of written specifications in `.planning/spec/` that capture every unique feature of the GSD prompt-engineered fork so each feature can be faithfully reimplemented on a heavily-refactored future upstream. The research establishes that the correct medium for these specs is one Markdown file per feature, using RFC 2119 MUST/SHOULD/MAY keywords and EARS notation for behavioral invariants, with a mandatory traceability table linking each invariant to an existing test file and subtest name. The eight fork features divide into two implementation waves: four independent features (positive framing, SHA versioning, Eta materialization, test infrastructure) that can be specced in parallel, and four that depend on at least one Wave 1 spec (hooks build, step numbering, thinking effort, citation guard).

The most dangerous spec-writing failure mode is capturing implementation details (file paths, function names, current line numbers) without capturing the behavioral contract — the observable stimulus/response pairs, invariants that must hold on all inputs, and settled decisions with rationale. A reimplementation on a refactored upstream has no stable file paths to anchor to; the spec must be the sole source of truth, and that source must be grounded in tier-1 evidence (test assertions, source code behavior) rather than tier-4 reference guides, which are known-stale for several features. XML tag hierarchy features (`<persona>`, `<intent>`, `<objective>`) are explicitly excluded from this milestone by user decision and must not appear in any spec.

The recommended output is 10 files: `INDEX.md` (manifest + dependency graph + build order), `00-CONVENTIONS.md` (REQ-ID scheme, status vocabulary, how to navigate), and one `SPEC.md` per feature in numbered subdirectories `01-positive-framing/` through `08-test-infrastructure/`. This structure maps directly to GSD's wave execution model: Wave 1 specs (01, 02, 04, 08) can be written in parallel phases; Wave 2 specs (03, 05, 06, 07) follow after their prerequisites are complete.

---

## Key Findings

### Recommended Stack (from STACK.md)

Every spec is a CommonMark Markdown file. No build step is needed — the implementing agent reads it directly. RFC 2119 keywords (MUST/SHOULD/MAY) provide unambiguous requirement strength. EARS notation (five sentence patterns) ensures each invariant is a single, testable claim. A `SPEC-NNN` stable ID prefix enables cross-referencing from roadmap and test files without fragility to renames.

**Core conventions:**
- **CommonMark Markdown** — per-feature spec file format; human-readable, version-control native, no build step
- **RFC 2119 MUST/SHOULD/MAY** — normative requirement levels; maps directly to "test must pass" vs "preferred but flexible"
- **EARS notation** — five patterns (Ubiquitous, Event-driven, State-driven, Unwanted-behavior, Optional-feature) producing single testable claims
- **`SPEC-NNN` ID prefix** — stable cross-reference handle that survives file renames
- **`<!-- advisory -->` marker** — machine-parseable signal on any section describing current code structure that will not survive the upstream refactor
- **Traceability table** — every MUST-level invariant maps to a test file and subtest name; absence signals an unspecifiable feature

### Recommended Per-Feature Spec Template (from STACK.md)

The canonical section order for every `SPEC.md`:

1. **Frontmatter block** — ID, Status (Draft/Ready/Implemented/Verified), Confidence, Specced date, Reimplementation target
2. **Purpose** — one paragraph; the "why" an AI implementing agent needs to avoid optimizing for the wrong outcome
3. **Scope** — explicit "in scope" / "out of scope" bullet lists; prevents scope creep and re-litigation
4. **Invariants** — numbered, falsifiable EARS statements with RFC 2119 strength; the normative behavioral contract
5. **Acceptance Tests** — invariant-to-test traceability table (invariant | test file | subtest name); `[MISSING — must be created]` if no test exists
6. **Key Decisions** — settled decisions the reimplementer MUST honor, with rationale; marked "do not reopen" where applicable
7. **Behavior vs. Current Implementation** — advisory section with current file locations; `<!-- advisory -->` on any path that may not survive the refactor; no line-for-line code transcription
8. **Edge Cases and Known Pitfalls** — each entry: condition → correct behavior
9. **Verification Checklist** — after-reimplementation gate: all MUST invariants pass, MUST NOT invariants hold, Key Decisions honored, edge cases handled, `npm test` green
10. **References** — PROJECT.md REQ-IDs, milestone links, external standards

### Required Content Dimensions / Acceptance Criteria for a "Good" Spec (from FEATURES.md)

A spec is launch-gate ready when it contains all six of the following:

| Dimension | Why Mandatory | Most Often Lost |
|-----------|---------------|-----------------|
| Observable behavior as stimulus/response pairs | Without this the spec is narrative, not contract | Resolver and install-transform specs |
| Acceptance test contract (exact file, describe block, assertion shape) | These features are largely defined by their tests | Prose summaries replace assertion quotes |
| Input/output signatures with types and error modes | Enables drop-in reimplementation | Multi-return helpers and injectable seams |
| Invariants as numbered, falsifiable statements | Encodes hard constraints that naive implementations violate on edge inputs | Documented constantly for happy path only |
| Explicit non-goals with one-line rationale each | Prevents scope creep; stops re-litigation of settled decisions | The most commonly missing section |
| Single most important settled decision with its rationale | Without rationale, every decision looks reversible | Outcome documented; reasoning omitted |

Additional dimensions required before the roadmapper consumes the spec set: feature dependency map, per-runtime behavior matrix for cross-runtime features, allowlist structure (tiers, entry format) for scanner and guard features, and user-handover boundaries where human judgment is required.

**Anti-features to exclude from every spec:**
- Line-number references (dead on refactored upstream)
- Current test counts as correctness proof (counts change with every upstream merge)
- Implementation path narrative (development history, not requirement)
- Semver comparison logic for SHA versioning (SHA equality is not semver)
- Auto-assigned effort values in the catalog (CATALOG-02 user-handover boundary)
- XML tag hierarchy content (`<persona>`, `<intent>`) — explicitly excluded from this milestone

### Recommended Directory Layout and Feature Mapping (from ARCHITECTURE.md)

**8 features → 10 files → flat numeric-prefix layout:**

```
.planning/spec/
├── INDEX.md                   # manifest + dependency graph + build order
├── 00-CONVENTIONS.md          # REQ-ID scheme, status vocab, cold-reader guide
├── 01-positive-framing/
│   └── SPEC.md                # framing standard + negative-framing scanner (12+ patterns)
├── 02-sha-versioning/
│   └── SPEC.md                # install.js SHA + update worker + statusline + check-latest-version
├── 03-hooks-build/
│   └── SPEC.md                # ensureHooksDist on-demand build
├── 04-eta-materialization/
│   └── SPEC.md                # Eta v4 include resolution (all copy paths including skills)
├── 05-step-numbering/
│   └── SPEC.md                # scanner + normalize CLI + cross-file-ref scanner
├── 06-thinking-effort/
│   └── SPEC.md                # model;effort label + resolver + catalog + spawn wiring + install.js
├── 07-citation-guard/
│   └── SPEC.md                # no-issue-citations guard + two-tier allowlist + corpus process
└── 08-test-infrastructure/
    └── SPEC.md                # scanner-precedence rule + serial isolation + fork test suite layout
```

**INDEX.md must contain three sections in order:** feature-status table (ID, feature, spec link, status, depends-on), dependency graph (ASCII or Mermaid), and reimplementation build order (Wave 1 and Wave 2).

**One directory per feature** — not one per subsystem. The thinking-effort spec covers parser + resolver + catalog + init siblings + spawn wiring + install.js Codex seam as a single behavioral contract. Splitting by subsystem creates artificial inter-spec dependencies and forces the reimplementer to synthesize a feature from fragments.

**Numeric prefix encodes build order** — the manifest and the directory listing must agree. `SPEC.md` is always the filename so tooling can locate it without guessing.

### Dependency Graph and Build Order (from ARCHITECTURE.md + FEATURES.md)

```
Wave 1 (no dependencies — can be specced in parallel):
  spec-01  Positive Framing
  spec-02  SHA Versioning
  spec-04  Eta Materialization
  spec-08  Test Infrastructure

Wave 2 (depends on Wave 1 — can be specced in parallel with each other):
  spec-03  Hooks Build         <- depends on spec-02
  spec-05  Step Numbering      <- depends on spec-08
  spec-06  Thinking Effort     <- depends on spec-08
  spec-07  Citation Guard      <- depends on spec-08
```

**Critical dependency chains the build order must preserve:**

- `spec-02 -> spec-03`: SHA versioning hooks worker uses {{GSD_REPO}}/{{GSD_BRANCH}} template placeholders processed by the installer's template engine (Eta). ensureHooksDist must exist before hooks are installed.
- `spec-08 -> spec-05, 06, 07`: The scanner-precedence rule and serial isolation conventions govern how each of these features' tests are written. Speccing those tests without the infrastructure spec in place risks missing the policy.
- Within spec-05 (step numbering): scanner -> normalizer -> cross-file-ref scanner ordering is a spec-internal dependency that must be stated explicitly.
- Within spec-06 (thinking effort): parseModelEffort -> init siblings -> spawn wiring -> install.js Codex emit seam; the rawSlotForRuntime pre-strip fix is the correctness linchpin.

### Source-of-Truth Hierarchy (from PITFALLS.md)

For any feature's current behavior, sources are authoritative in this order:

1. **Existing test file assertions** (tier 1) — the test IS the spec for corpus scanners and guards
2. **Source code behavior** (tier 2) — what the code actually does, not what reference docs claim
3. **Project history** — PROJECT.md Key Decisions, PROJECT_HISTORY.md, MILESTONES.md (tier 3)
4. **Reference guides** — `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` and similar (tier 4 — background context only)

**Hard rule:** Every spec must cite a tier-1 or tier-2 source. A spec that cites only tier-4 guides without also citing a test file or source file is relying on stale source. The positive-framing scanner has 12+ detection branches (doNot, never, dont, antiPatterns, mustNot, shouldNot, cannot, wont, willNot, prohibited, forbidden, warn-only variants) that are not documented in the reference guides.

### Critical Pitfalls and Spec-Section Gates (from PITFALLS.md)

| Pitfall | Spec-Section Gate That Prevents It |
|---------|-----------------------------------|
| **File-path coupling** — specs describe behavior in terms of bin/install.js:198 or wrappedConverter; invalid on refactored upstream | "Behavior vs. Current Implementation" section is advisory-only; every requirement in "Invariants" must survive a file move |
| **Lost behavioral invariants** — implementation details captured, but "if violated X breaks" omitted; D-08 floor treated as optional | Required "Invariants" section with consequence for each MUST-level claim; review gate requires at least two invariants per feature |
| **Settled decisions reopened** — GitHub API vs npm reversal, static allowlist refactored to dynamic, semicolon delimiter changed to colon | Required "Key Decisions" section; each decision marked "settled — do not reopen" with consequence of reopening stated inline |
| **Missing test contracts** — features verified against "it should work" rather than the fork's actual test assertions | Required "Acceptance Tests" traceability table; specs without it are rejected at review; for golden snapshots, describe snapshot structure not just existence |
| **Stale scope / superseded features** — XML tag hierarchy, resolveIncludes() stepping stone, parseV() semver block specced and reimplemented | INDEX.md must include explicit "Excluded from scope" section before any per-feature spec is written; validate against PROJECT.md Out of Scope |
| **Lost interdependencies** — SHA versioning implemented without realizing it depends on Eta template engine; thinking effort implemented without init siblings | Required "Dependencies" section per SPEC.md; dependency matrix in INDEX.md drives phase sequencing |
| **Stale guides as primary source** — spec for positive-framing scanner derived from reference guides that underspecify the 12+ detection branches | Source-of-truth hierarchy enforced at review; reject specs with no tier-1 or tier-2 citation |

**"Looks Done But Isn't" — per-feature spec completeness checklist:**

- Positive-framing: lists all 12+ detection patterns, not just principles
- SHA versioning: states no-network sentinel semantics (not empty string; signals invalid install)
- Thinking effort: covers full precedence chain (override -> slot -> D-08 medium floor) and rawSlotForRuntime Codex fix
- Eta materialization: requires engine wired into every copy path including skills wrappedConverter
- Citation guard: distinguishes PLACEHOLDER_DIGITS tier from FILE_ALLOWLIST tier
- Test infrastructure: states scanner-precedence rule as standing policy, not one-time decision
- Step numbering: explicitly excludes Pattern C (## N.N. section headings in plan files)

---

## Implications for Roadmap

Suggested 9-phase structure. Phases 1-4 are Wave 1 (independent, can run in parallel). Phases 5-8 are Wave 2 (can run in parallel with each other after Wave 1 completes).

### Phase 0: Spec Scaffold (Index + Conventions)

**Rationale:** The exclusion list and dependency matrix must exist before any per-feature spec is written; otherwise individual spec authors pick up abandoned features (XML tags, resolveIncludes()) and build specs in wrong order.
**Delivers:** `.planning/spec/INDEX.md` with feature-status table, dependency graph, wave structure, and explicit "Excluded from scope" section; `.planning/spec/00-CONVENTIONS.md` with REQ-ID scheme and status vocabulary; eight empty NN-feature/SPEC.md stubs with frontmatter.
**Avoids:** Pitfall 5 (stale scope), Pitfall 6 (lost interdependencies).
**Research flag:** None — structure is fully defined by this research.

### Phase 1: spec-01 — Positive Framing Standard

**Rationale:** Wave 1 (no dependencies). The scanner-precedence rule (spec-08) is a policy that governs this spec's test writing, but spec-01's behavioral contract can be fully written independent of spec-08 existing on disk.
**Delivers:** Complete spec for the framing standard and negative-framing scanner; 12+ detection patterns enumerated; tier-1 source citations from negative-framing-scan.test.cjs; replacement rule specified.
**Avoids:** Pitfall 7 (guides underspecify detection branches); Pitfall 4 (99/99 corpus test is the contract).
**Research flag:** None — test file is the primary source; well-documented.

### Phase 2: spec-02 — SHA Versioning System

**Rationale:** Wave 1 (no dependencies). Prerequisite for spec-03 (hooks build). Must specify the coordination topology across 5 files, the GitHub Commits API decision with rationale, the no-network sentinel semantics, and the template placeholder asymmetry.
**Delivers:** Complete spec covering install.js SHA emit, update worker, statusline display, check-latest-version injectable seam, no-network sentinel, and template placeholder processing boundary.
**Avoids:** Pitfall 1 (file-path coupling for bin/install.js); Pitfall 3 (GitHub API vs npm regression).

### Phase 3: spec-04 — Eta v4 Install-Time Materialization

**Rationale:** Wave 1 (no dependencies). Must specify the skills-path gap scenario (wrappedConverter) explicitly — the gap was found only via post-milestone audit and will be missed without deliberate documentation.
**Delivers:** Complete spec for Eta v4 include resolution; engine configuration (default delimiters, autoEscape: false); <%~ raw-output requirement; 27-entry ALLOWED_INLINE_REFS; coverage of every copy path including skills wrappedConverter.
**Avoids:** Pitfall 6 (Eta must be wired into every copy path, not just the main agent loop).

### Phase 4: spec-08 — Fork Test Infrastructure

**Rationale:** Wave 1 (no dependencies). Prerequisite for specs 05, 06, 07. The scanner-precedence rule and serial isolation conventions are standing policies — they must be captured as spec before any scanner or guard spec is written.
**Delivers:** Complete spec for scanner-precedence rule (fork test wins on conflict), serial isolation via SERIAL_FILES, describe({ concurrency: false }) wrapper rationale, and fork test suite layout.
**Avoids:** Pitfall 3 (scanner-precedence is a standing policy, not a one-time decision); Pitfall 7 (no reference doc describes this).

### Phase 5: spec-03 — On-Demand Hooks Build

**Rationale:** Wave 2; depends on spec-02. ensureHooksDist must exist before hooks are installed — this ordering is an integration constraint between spec-02 and spec-03. Can be specced immediately after spec-02 is READY.
**Delivers:** Complete spec for ensureHooksDist; spawnSync vs execSync decision with rationale; scoped require; serial test isolation for tests that rename/restore hooks/dist/.
**Avoids:** Pitfall 1 (ensureHooksDist named as normative function reference); Pitfall 6 (build-order hazard with SHA versioning hooks).

### Phase 6: spec-05 — Step Numbering System

**Rationale:** Wave 2; depends on spec-08 (scanner-precedence and serial isolation policies govern this spec's tests). Three-layer internal dependency (scanner -> normalizer -> cross-file-ref scanner) must be stated within the spec.
**Delivers:** Complete spec for the scanner, normalize-step-numbers.cjs CLI, and cross-file-ref scanner; Pattern C exclusion explicitly documented; 632/632 corpus count as a reference point.
**Avoids:** Pitfall 5 (Pattern C must be preserved as intended exclusion, not fixed as oversight).

### Phase 7: spec-06 — Per-Agent Thinking Effort

**Rationale:** Wave 2; depends on spec-08. The most complex spec surface: parser + resolver + multi-runtime matrix + catalog + init siblings + spawn wiring + install.js Codex emit seam. The rawSlotForRuntime Codex fix is the correctness linchpin; its absence will reproduce a known regression.
**Delivers:** Complete spec with parse contract (parseModelEffort input/output/error modes), precedence chain (override -> slot -> D-08 floor), static {claude, codex} allowlist with rationale, per-runtime behavior matrix, CATALOG-02 user-handover boundary, 20 *_effort init sibling fields, and rawSlotForRuntime fix explanation.
**Avoids:** Pitfall 2 (D-08 floor treated as optional); Pitfall 4 (330-row golden snapshot defines correctness).

### Phase 8: spec-07 — Citation Cleanup Guard

**Rationale:** Wave 2; depends on spec-08. Standalone feature with no cross-feature dependencies beyond test infrastructure. Simple enough to spec quickly once spec-08 is READY.
**Delivers:** Complete spec for no-issue-citations.test.cjs guard; two-tier allowlist (PLACEHOLDER_DIGITS vs FILE_ALLOWLIST) with semantics for each tier; 5-directory detection scope; corpus cleanup process.
**Avoids:** Pitfall 4 (two-tier allowlist semantics are non-obvious; no guide documents them).

### Phase 9: Cross-Spec Consistency Review

**Rationale:** After all 8 specs reach READY status, a single pass to verify the dependency graph in INDEX.md matches what each SPEC.md's "Dependencies" section declares, traceability tables are complete (no [MISSING] entries without flagging), and the exclusion list in INDEX.md covers all known abandoned features.
**Delivers:** All 8 specs at READY status; INDEX.md dependency graph reconciled; CONVENTIONS.md verified against actual spec structure.
**Research flag:** None — mechanical consistency check, no new research needed.

### Phase Ordering Rationale

- **Wave 1 independence** enables parallel execution under GSD's wave model; the roadmapper should assign these to the same wave.
- **spec-08 before specs 05/06/07** because the scanner-precedence policy governs how those specs' acceptance tests must be written — without it, spec authors may unknowingly write test assertions that conflict with the policy.
- **spec-02 before spec-03** because on-demand hooks build is a prerequisite for SHA versioning hooks being installable; speccing them in the wrong order produces a spec-03 that omits the dependency constraint.
- **Phase 0 before everything** — the exclusion list is the safety net that prevents work on abandoned features; it must be established first.

### Research Flags

**No phase requires additional research** — all inputs are fully available in the project's own artifacts (PROJECT.md, test files, source code, MILESTONES.md). Every spec draws from tier-1 and tier-2 sources that are on disk.

**Phases that benefit from careful source reading before spec authoring:**
- Phase 1 (spec-01): read negative-framing-scan.test.cjs before writing; guides are stale.
- Phase 7 (spec-06): read feat-58-regression.test.cjs and init.cjs before writing; the golden snapshot and rawSlotForRuntime fix are not documented anywhere except the test file and source.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (spec format + tooling) | HIGH | Cross-verified across Addy Osmani, arXiv 2602.00180, GitHub Spec Kit, RFC 2119, EARS standard |
| Features (content dimensions) | HIGH | Derived from the project's own test files and Key Decisions; not generic research |
| Architecture (directory layout + build order) | HIGH | Derived directly from fork's own GSD conventions and eight named PROJECT.md features |
| Pitfalls | HIGH | Derived entirely from this project's own history (PROJECT_HISTORY.md, MILESTONES.md) — highest possible confidence |

**Overall confidence: HIGH**

### Gaps to Address

- **REQ-ID population in specs:** Each spec's Requirements table must be populated from PROJECT.md's validated REQ-IDs. The spec authors must read PROJECT.md to harvest the IDs that belong to each feature — state this requirement in 00-CONVENTIONS.md.
- **Test file subtest names for spec-06:** The feat-58-regression.test.cjs 330-row golden snapshot and suite names should be verified at spec-authoring time in case the test was renamed in a recent milestone.
- **Corpus count reference points:** The current counts (632/632 step-numbering, 99/99 negative-framing, 327/327 citation guard) are reference points as of this research date. Specs should record these with a "current as of" date and note that counts may shift with upstream merges — the shape of the assertion is normative, not the count.

---

## Sources

### Primary (HIGH confidence)

- `tests/negative-framing-scan.test.cjs` — positive-framing scanner detection branches and corpus count
- `tests/no-issue-citations.test.cjs` — citation guard two-tier allowlist structure
- `.planning/PROJECT.md` — validated REQ-IDs, Key Decisions table, Requirements section
- `.planning/PROJECT_HISTORY.md` — historical Key Decisions for shipped milestones v2.1.0-a through v2.1.0-g
- `.planning/MILESTONES.md` — implementation details and verification records
- `CLAUDE.md` — technology stack, test conventions, architecture
- Addy Osmani — How to write a good spec for AI agents — six-element model, three-tier boundaries
- arXiv 2602.00180 — Spec-Driven Development — EARS notation, four-phase artifact chain
- GitHub Spec Kit spec-driven.md — task command artifact structure
- RFC 2119 — MUST/SHOULD/MAY normative vocabulary

### Secondary (MEDIUM confidence)

- arXiv 2603.08806 — Test-Driven AI Agent Definition — specification as single source of truth
- Thoughtworks Spec-Driven Development 2025 — "Assess" ring warning on heavy up-front specification

### Tertiary (background context only)

- `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` — background only; known stale for positive-framing scanner
- `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` — background only; does not describe current enforcement mechanism

---
*Research completed: 2026-06-11*
*Ready for roadmap: yes*
