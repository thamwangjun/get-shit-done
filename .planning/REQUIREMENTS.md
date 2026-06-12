# Requirements — Milestone v2.1.0-h Fork Feature Specification

**Goal:** Produce a complete, reimplementation-ready specification of every unique fork feature in `.planning/spec/`, so the fork's value can be rebuilt on a heavily-refactored future upstream where a direct merge of hundreds of conflicting changes is infeasible.

**Source of truth (per research):** test assertions (tier 1) > source code (tier 2) > project history — PROJECT.md / PROJECT_HISTORY.md / MILESTONES.md (tier 3) > reference guides (tier 4, known stale).

**Deliverable shape:** one Markdown `SPEC.md` per feature in a numbered subdirectory under `.planning/spec/`, plus an `INDEX.md` manifest and a `00-CONVENTIONS.md` meta-spec. Specs use RFC 2119 (MUST/SHOULD/MAY) + EARS notation for invariants, with traceability tables linking invariants to existing fork tests.

---

## v2.1.0-h Requirements

### Scaffold

- [x] **SCAF-01**: `.planning/spec/INDEX.md` exists as the spec-set manifest with a feature-status table (ID, feature, spec link, status, depends-on), a dependency graph, and a Wave 1 / Wave 2 build order
- [x] **SCAF-02**: `.planning/spec/00-CONVENTIONS.md` defines the per-feature spec template, the REQ-ID/SPEC-ID scheme, the status vocabulary (Draft/Ready/Implemented/Verified), and the source-of-truth hierarchy
- [x] **SCAF-03**: `INDEX.md` contains an explicit "Excluded from scope" section listing superseded/abandoned work the reimplementer must NOT carry forward (XML tag hierarchy `<persona>`/`<intent>`/`<objective>`, `resolveIncludes()` stepping stone, `parseV()` semver block, and any other PROJECT.md Out-of-Scope items)

### Feature Specs

- [x] **SPEC-01**: `01-positive-framing/SPEC.md` specifies the positive/affirmative-framing standard and the negative-framing corpus scanner — all 12+ detection branches enumerated (doNot, never, dont, antiPatterns, mustNot, shouldNot, cannot, wont, willNot, prohibited, forbidden, warn-only variants), the replacement rule (rewrite negatives as affirmative instructions), the paired-pattern exception, and the four scan directories
- [x] **SPEC-02**: `02-sha-versioning/SPEC.md` specifies the SHA-based versioning system — install.js git-SHA emit, `no-network` sentinel semantics, update worker via the GitHub Commits API with `isNewer` SHA equality, statusline display, `check-latest-version.cjs` injectable seam, and the `{{GSD_REPO}}`/`{{GSD_BRANCH}}` template placeholder boundary
- [ ] **SPEC-03**: `03-hooks-build/SPEC.md` specifies the on-demand hooks build (`ensureHooksDist`) — trigger condition (absent `hooks/dist/`), `spawnSync` vs `execSync` decision, console notice, and abort-on-failure behavior
- [x] **SPEC-04**: `04-eta-materialization/SPEC.md` specifies Eta v4 install-time content materialization — engine configuration (default delimiters, `autoEscape: false`, `<%~` raw output), `<%~ include() %>` conversion from `@~/` refs, the `ALLOWED_INLINE_REFS` exception list, and coverage of every copy path including the skills `wrappedConverter`
- [x] **SPEC-05**: `05-step-numbering/SPEC.md` specifies whole-integer step numbering — the scanner (decimal + letter-suffix + out-of-order detection), `normalize-step-numbers.cjs` cross-file-aware idempotent CLI, the cross-file-step-refs scanner, and the explicit Pattern C exclusion (`## N.N.` section headings in plan files)
- [ ] **SPEC-06**: `06-thinking-effort/SPEC.md` specifies per-agent thinking effort — `parseModelEffort` semicolon parser (input/output/error modes), the unified `{claude, codex}` resolver precedence chain (override → slot → D-08 medium floor), the static runtime allowlist, the per-runtime behavior matrix, catalog schema, 20 `*_effort` init siblings, spawn-template wiring, install.js Codex emit seam, the `rawSlotForRuntime` Codex fix, and the CATALOG-02 user-handover boundary
- [ ] **SPEC-07**: `07-citation-guard/SPEC.md` specifies the citation cleanup guard — `no-issue-citations.test.cjs` detection (inline/parenthetical/feat-form), the two-tier allowlist (`PLACEHOLDER_DIGITS` vs `FILE_ALLOWLIST`) with per-tier semantics, and the 5-directory detection scope
- [ ] **SPEC-08**: `08-test-infrastructure/SPEC.md` specifies the fork test infrastructure — the scanner-precedence rule (fork standard wins when a test conflicts), serial test isolation (`SERIAL_FILES`, `describe({ concurrency: false })`), and the fork-owned test suite layout/conventions

### Quality (applies to every SPEC.md)

- [x] **QUAL-01**: Each spec states behavioral invariants as numbered, falsifiable EARS statements with RFC 2119 strength — the normative contract is behavior, not implementation
- [x] **QUAL-02**: Each spec has an Acceptance-Tests traceability table mapping each MUST-level invariant to a test file and subtest name; invariants without a test are flagged `[MISSING — write test first]`
- [x] **QUAL-03**: Each spec separates the normative behavioral contract from advisory implementation notes; any current file path or symbol is marked advisory (`<!-- advisory -->`) and survives a file move
- [x] **QUAL-04**: Each spec cites at least one tier-1 (test) or tier-2 (source) artifact; reference guides are cited only as background
- [x] **QUAL-05**: Each spec has a Key Decisions section recording settled decisions with rationale, marked "settled — do not reopen", with the consequence of reopening stated inline

### Review

- [ ] **REV-01**: Cross-spec consistency pass — the `INDEX.md` dependency graph is reconciled against every spec's Dependencies section, all traceability tables are complete (no unflagged `[MISSING]` rows), and the exclusion list covers all known abandoned features

---

## Future Requirements (deferred)

- Reimplementation execution itself (rebuilding the features on the new upstream) — out of scope for this milestone; this milestone produces the specs only
- A spec-conformance/verification harness that diffs a reimplementation against the specs — deferred until reimplementation begins

## Out of Scope

- **XML tag conventions** (`<intent>` commands / `<persona>` agents / `<objective>`) — explicitly excluded by user decision; not carried to the new fork
- **Reimplementing or modifying any fork feature** — this is a documentation/spec milestone; no runtime or prompt-content code changes
- **CATALOGUE.json inventory feature** — superseded tooling; not specced unless surfaced as still-load-bearing during authoring
- **Transcribing original implementations line-by-line** — specs capture behavioral contracts + advisory pointers, not code dumps
- **Updating the stale reference guides** — guides are tier-4 background; this milestone does not refresh them

## Traceability

Maps each REQ-ID to its phase. Every requirement maps to exactly one phase; QUAL-01–QUAL-05 are cross-cutting acceptance criteria applied to every feature-spec phase (69–76) rather than owned by one.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCAF-01 | Phase 68 | Complete |
| SCAF-02 | Phase 68 | Complete |
| SCAF-03 | Phase 68 | Complete |
| SPEC-01 | Phase 69 | Complete |
| SPEC-02 | Phase 70 | Complete |
| SPEC-04 | Phase 71 | Complete |
| SPEC-08 | Phase 72 | Pending |
| SPEC-03 | Phase 73 | Pending |
| SPEC-05 | Phase 74 | Complete |
| SPEC-06 | Phase 75 | Pending |
| SPEC-07 | Phase 76 | Pending |
| REV-01 | Phase 77 | Pending |
| QUAL-01 | Phases 69–76 (shared) | Complete |
| QUAL-02 | Phases 69–76 (shared) | Complete |
| QUAL-03 | Phases 69–76 (shared) | Complete |
| QUAL-04 | Phases 69–76 (shared) | Complete |
| QUAL-05 | Phases 69–76 (shared) | Complete |

**Coverage:** 17/17 requirements mapped (12 feature/scaffold/review requirements each to exactly one phase + 5 QUAL criteria applied across all 8 feature-spec phases). No orphans, no duplicates.
