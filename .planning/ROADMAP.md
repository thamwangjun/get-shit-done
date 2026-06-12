# Roadmap: GSD Prompt-Engineered Fork

## Milestones

- ✓ **v1.36.0 Files** — Phases 1–3 (shipped 2026-04-16)
- ✓ **v1.36.0.b Fix Hooks Installation** — Phases 4–5 (shipped 2026-04-17)
- ✓ **v1.36.0.a Fix Update Functionality** — Phases 4–6 (shipped 2026-04-18)
- ✓ **v1.37.1 Files** — Phases 7–12 (shipped 2026-04-22)
- ✓ **v1.37.1a Do-Not Framing Pass** — Phases 13–17 (shipped 2026-04-23)
- ✓ **v1.37.1b Fork Tag Corpus Tests** — Phases 18–19 (shipped 2026-04-29)
- ✗ **v1.37.1c Tag Hierarchy Completion** — Phases 20–24 (abandoned 2026-04-29, 1/5 phases complete)
- ✅ **v1.37.2 Positive Framing TDD Pass** — Phases 25–27 (shipped 2026-05-02)
- ✅ **v1.38.6 Positive Framing Pass** — Phases 28–31 (shipped 2026-05-03)
- ✅ **v1.41.3 Upstream v1.41.2 Fork Compliance** — Phases 32–34 (shipped 2026-05-19)
- ✅ **v1.41.5 Refactor Git Commit History** — Phases 35–41 (shipped 2026-05-24)
- ✅ **v2.1.0-a SHA Versioning Reimplementation** — Phases 42–43 (shipped 2026-05-26)
- ✗ **v2.1.0-b Workflow Compliance Reinforcement** — Phases 44–48 (abandoned 2026-05-28, 0/5 phases complete)
- ✅ **v2.1.0-c Install-Time Content Materialization** — Phases 44–47.1 (shipped 2026-05-29)
- ✅ **v2.1.0-d Whole-Integer Step Numbering** — Phases 48–51 (shipped 2026-05-31)
- ✅ **v2.1.0-e Per-Agent Thinking Effort** — Phases 52–58 (shipped 2026-06-06)
- ✅ **v2.1.0-f Testing Coverage Gaps** — Phases 59–63 (shipped 2026-06-08)
- ✅ **v2.1.0-g Citation Cleanup** — Phases 64–67 (shipped 2026-06-10)
- 🚧 **v2.1.0-h Fork Feature Specification** — Phases 68–77 (in progress)

## Phases

<details>
<summary>✓ v1.36.0 Files (Phases 1–3) — SHIPPED 2026-04-16</summary>

**Goal:** All prompt files added or changed in the v1.36.0 upstream merge pass the fork's prompt engineering quality bar before it ships. CATALOGUE in sync. Tests updated to reflect fork standards.

- [x] Phase 1: Accurate CATALOGUE (1/1 plans) — completed 2026-04-15
- [x] Phase 2: Apply Fork Standards to v1.36.0 Files (4/4 plans) — completed 2026-04-16
- [x] Phase 3: Align Tests with Fork Standards (2/2 plans) — completed 2026-04-16

Full details: `.planning/milestones/v1.36.0-ROADMAP.md`

</details>

<details>
<summary>✓ v1.36.0.b Fix Hooks Installation (Phases 4–5) — SHIPPED 2026-04-17</summary>

**Goal:** install.js correctly copies hooks even when hooks/dist/ has not been built; regression test prevents silent-skip bug from returning.

- [x] Phase 4: Fix Hooks Installation (1/1 plans) — completed 2026-04-17
- [x] Phase 5: Regression Coverage (1/1 plans) — completed 2026-04-17

Full details: `.planning/milestones/v1.36.0.b-ROADMAP.md`

</details>

<details>
<summary>✓ v1.36.0.a Fix Update Functionality (Phases 4–6) — SHIPPED 2026-04-18</summary>

**Goal:** Fix the /gsd-update command and background update-check hook so update detection works correctly with the fork's SHA-based versioning.

- [x] Phase 4: Fix Background Update-Check Hook (1/1 plans) — completed 2026-04-17
- [x] Phase 5: Fix Version Detection and Update Workflow (2/2 plans) — completed 2026-04-17
- [x] Phase 6: Produce Phase 4 Verification Artifacts (1/1 plans) — completed 2026-04-18

Full details: `.planning/milestones/v1.36.0.a-ROADMAP.md`

</details>

<details>
<summary>✓ v1.37.1 Files (Phases 7–12) — SHIPPED 2026-04-22</summary>

**Goal:** Merge upstream v1.37.1 into main, sync CATALOGUE.json, apply the fork's positive framing and XML structure standards to all new and modified prompt files, and keep the test suite green.

- [x] Phase 7: Merge and Conflict Resolution (2/2 plans) — completed 2026-04-17
- [x] Phase 8: CATALOGUE Sync (1/1 plans) — completed 2026-04-17
- [x] Phase 9: Fork Standards Pass (2/2 plans) — completed 2026-04-18
- [x] Phase 10: Test Suite Green (1/1 plans) — completed 2026-04-19
- [x] Phase 11: Documentation Sync & Nyquist Completion (1/1 plans) — completed 2026-04-21
- [x] Phase 12: Tech Debt Remediation (3/3 plans) — completed 2026-04-21

Full details: `.planning/milestones/v1.37.1-ROADMAP.md`

</details>

<details>
<summary>✓ v1.37.1a Do-Not Framing Pass (Phases 13–17) — SHIPPED 2026-04-23</summary>

**Goal:** Fix all 17 bare "do not" directive violations across agents, workflows, references, and commands; corpus scan 4/4 subtests green; test suite 4168/4168 pass.

- [x] Phase 13: Agent Fixes (3/3 plans) — completed 2026-04-22
- [x] Phase 14: Workflow, Reference, and Command Fixes (2/2 plans) — completed 2026-04-22
- [x] Phase 15: Test Suite Gate (1/1 plans) — completed 2026-04-23
- [x] Phase 16: Nyquist Validation Pass (3/3 plans) — completed 2026-04-23
- [x] Phase 17: Working Tree & Docs Housekeeping (3/3 plans) — completed 2026-04-23

Full details: `.planning/milestones/v1.37.1a-ROADMAP.md`

</details>

<details>
<summary>✓ v1.37.1b Fork Tag Corpus Tests (Phases 18–19) — SHIPPED 2026-04-29</summary>

**Goal:** Add fork-specific corpus test guards for tag consistency and convert all remaining command files to use a consistent primary directive tag.

- [x] Phase 18: Fork Tag Corpus Tests (2/2 plans) — completed 2026-04-28
- [x] Phase 19: Convert objective tags to intent in skill files (3/3 plans) — completed 2026-04-29

Full details: `.planning/milestones/v1.37.1b-ROADMAP.md`

</details>

<details>
<summary>✗ v1.37.1c Tag Hierarchy Completion (Phases 20–24) — ABANDONED 2026-04-29</summary>

**Goal:** *(Abandoned; requirement subsequently dropped 2026-04-30 — see PROJECT.md Key Decisions)*
**Abandoned after:** Phase 20 only (1/5 phases, 1/13 requirements)

- [x] Phase 20: Baseline Audit (1/1 plans) — completed 2026-04-29
- [ ] Phase 21: L1 + L2 Validation — not started
- [ ] Phase 22: L3 Conversion — not started
- [ ] Phase 23: L4 Conversion — not started
- [ ] Phase 24: Gate + Documentation — not started

Full details: `.planning/milestones/v1.37.1c-ROADMAP.md`

</details>

<details>
<summary>✅ v1.37.2 Positive Framing TDD Pass (Phases 25–27) — SHIPPED 2026-05-02</summary>

**Goal:** Re-apply and expand the positive framing quality bar across all prompt content files using TDD — write failing tests first, fix all violations and warnings, full test suite green.

- [x] **Phase 25: Scanner Expansion** (3/3 plans) — completed 2026-05-01
- [x] **Phase 26: Violation Fixes** (3/3 plans) — completed 2026-05-02
- [x] **Phase 27: Quality Gate** (3/3 plans) — completed 2026-05-02

Full details: `.planning/milestones/v1.37.2-ROADMAP.md`

</details>

<details>
<summary>✅ v1.38.6 Positive Framing Pass (Phases 28–31) — SHIPPED 2026-05-03</summary>

**Goal:** Manual read audit of all prompt content files surfaces every negative framing violation; findings drive scanner expansion (TDD red gate); all violations are fixed; then test failures after fixes identify any upstream test assertions that check for outlawed strings — those are disabled and the suite goes green.

- [x] Phase 28: Full Manual Audit (6/6 plans) — completed 2026-05-02
- [x] Phase 29: TDD Scanner Expansion (2/2 plans) — completed 2026-05-03
- [x] Phase 30: Violation Fixes (2/2 plans) — completed 2026-05-03
- [x] Phase 31: Conflicting Test Handling + Final Gate (1/1 plans) — completed 2026-05-03

Full details: `.planning/milestones/v1.38.6-ROADMAP.md`

</details>

<details>
<summary>✅ v1.41.3 Upstream v1.41.2 Fork Compliance (Phases 32–34) — SHIPPED 2026-05-19</summary>

**Milestone Goal:** Resolve all known test failures on thamw-v1.41.2, pass the negative-framing scanner across all upstream-introduced files, fix any new violations, and fast-forward main to thamw-v1.41.3.

- [x] Phase 32: Quick Test Fixes (1/1 plans) — completed 2026-05-13
- [x] Phase 33: Positive Framing Pass (2/2 plans) — completed 2026-05-14
- [x] Phase 34: Gate and Merge (1/1 plans) — completed 2026-05-14

Full details: `.planning/milestones/v1.41.3-ROADMAP.md`

</details>

<details>
<summary>✅ v1.41.5 Refactor Git Commit History (Phases 35–41) — SHIPPED 2026-05-24</summary>

- [x] Phase 35: Backup and Soft Reset (1/1 plans) — completed 2026-05-22
- [x] Phase 36: Stage and Commit Configuration & Rules (1/1 plans) — completed 2026-05-22
- [x] Phase 37: Stage and Commit Scanner Logic (1/1 plans) — completed 2026-05-22
- [x] Phase 38: Stage and Commit Workflows, Agents, & Templates (1/1 plans) — completed 2026-05-22
- [x] Phase 39: Stage and Commit Tests & SDK Validation (1/1 plans) — completed 2026-05-22
- [x] Phase 40: Stage and Commit Maintenance, Logs, & State (1/1 plans) — completed 2026-05-23
- [x] Phase 41: Final Verification & Parity Audit (1/1 plans) — completed 2026-05-23

Full details: `.planning/milestones/v1.41.5-ROADMAP.md`

</details>

<details>
<summary>✅ v2.1.0-a SHA Versioning Reimplementation (Phases 42–43) — SHIPPED 2026-05-26</summary>

- [x] Phase 42: SHA Hook and Install Reimplementation (1/1 plans) — completed 2026-05-25
- [x] Phase 43: Update Workflow SHA Migration + Full Gate (1/1 plans) — completed 2026-05-26

Full details: `.planning/milestones/v2.1.0-a-ROADMAP.md`

</details>

<details>
<summary>✗ v2.1.0-b Workflow Compliance Reinforcement (Phases 44–48) — ABANDONED 2026-05-28</summary>

**Goal:** *(Abandoned before any phase started — milestone scope invalidated by v2.1.0-c decision to address install-time content materialization first)*
**Abandoned after:** 0/5 phases complete

- [x] Phase 44: Investigation — not started (completed 2026-05-28)
- [x] Phase 45: Command Layer Fixes — not started (completed 2026-05-28)
- [x] Phase 46: Workflow Layer Fixes — not started (completed 2026-05-29)
- [ ] Phase 47: Agent Layer Fixes — not started
- [x] Phase 48: Quality Gate — not started (completed 2026-05-30)

</details>

<details>
<summary>✅ v2.1.0-c Install-Time Content Materialization (Phases 44–47.1) — SHIPPED 2026-05-29</summary>

**Milestone Goal:** Replace runtime `@` and `` !`<bash>` `` content injection with install-time template substitution so every installed file is fully self-contained — no reliance on Claude to inject referenced content at runtime.

- [x] **Phase 44: Resolver Core** — Build and unit-test `resolveIncludes()` in isolation; pivoted in Phase 45 to Eta v4 (completed 2026-05-28)
- [x] **Phase 45: Pipeline Integration** — Wire Eta v4 into install.js; convert ~180 static ref lines to `<%~ include() %>` tags across 82 files; remove resolveIncludes() (completed 2026-05-28)
- [x] **Phase 46: Regression Test Suite** — 5 regression tests running against installed output; TEST-06 dropped per D-11 (completed 2026-05-29)
- [x] **Phase 47: Full Runtime Matrix + Verification** — Validate all supported runtimes produce zero unresolved references; `npm test` green (completed 2026-05-29)
- [x] **Phase 47.1: Close Gap INTG-04/GATE-03** — Wire renderEtaContent into skills path; expand TEST-01 to detect `<%~` survivors (completed 2026-05-29)

Full details: `.planning/milestones/v2.1.0-c-ROADMAP.md`

</details>

<details>
<summary>✅ v2.1.0-d Whole-Integer Step Numbering (Phases 48–51) — SHIPPED 2026-05-31</summary>

**Milestone Goal:** Enforce whole-integer-only step labels across all prompt content files and provide a durable maintenance script to re-enforce after every upstream merge.

- [x] Phase 48: TDD Red Gate (1/1 plan) — completed 2026-05-30
- [x] Phase 49: Survey and Normalization (14/13 plans) — completed 2026-05-30
- [x] Phase 50: Maintenance Script and Cross-Ref Scanner (3/3 plans) — completed 2026-05-30
- [x] Phase 51: Quality Gate (1/1 plan) — completed 2026-05-31

Full details: `.planning/milestones/v2.1.0-d-ROADMAP.md`

</details>

<details>
<summary>✅ v2.1.0-e Per-Agent Thinking Effort (Phases 52–58) — SHIPPED 2026-06-06</summary>

**Milestone Goal:** Add a unified, Claude-first thinking-effort dimension encoded inline as `model;effort` labels (semicolon delimiter — chosen so colons in provider IDs are never ambiguous), resolved through the existing model machinery and passed to `Agent()` spawns.

- [x] Phase 52: Parser Foundation (3/3 plans) — completed 2026-05-31
- [x] Phase 53: Unified Effort Resolver (2/2 plans) — completed 2026-06-01
- [x] Phase 54: SDK & Tools JSON Exposure (2/2 plans) — completed 2026-06-02
- [x] Phase 55: Catalog Schema + User Handover (3/3 plans) — completed 2026-06-03
- [x] Phase 55.1: Fix Tests Failing from Phase 55 Work (4/4 plans) — completed 2026-06-04
- [x] Phase 55.2: Fix SDK Golden-Parity Suite Failures (5/5 plans) — completed 2026-06-04
- [x] Phase 56: Spawn-Template Wiring (3/3 plans) — completed 2026-06-04
- [x] Phase 57: Install-Time Translation (3/3 plans) — completed 2026-06-05
- [x] Phase 58: Regression Coverage (3/3 plans) — completed 2026-06-06

Full details: `.planning/milestones/v2.1.0-e-ROADMAP.md`

</details>

<details>
<summary>✅ v2.1.0-f Testing Coverage Gaps (Phases 59–63) — SHIPPED 2026-06-08</summary>

**Milestone Goal:** Close all behavioral and documentation testing gaps identified in the v2.1.0-e gap report before they accumulate into undetected regressions. Work is entirely additive test code across four existing test files — no agent or workflow source files change.

- [x] **Phase 59: Comment Cleanup** - Remove stale Phase 48 RED expectation comment from step-numbering-scan.test.cjs (completed 2026-06-07)
- [x] **Phase 60: Effort Wiring Coverage** - Add 8 Group B effort-wiring regression tests to phase-56-effort-wiring.test.cjs (completed 2026-06-07)
- [x] **Phase 61: Worktree Safety Coverage** - Assert submodule exclusion logic in executor worktree path-safety test (completed 2026-06-08)
- [x] **Phase 62: Rubric Inlining Coverage** - Assert gsd-user-profiler.md load_rubric step references Eta-inlined rubric (completed 2026-06-08)
- [x] **Phase 63: Security Framing Coverage** - Rewrite skipped debugger security test to assert fork's hardened language (completed 2026-06-08)

Full details: `.planning/milestones/v2.1.0-f-ROADMAP.md`

</details>

<details>
<summary>✅ v2.1.0-g Citation Cleanup (Phases 64–67) — SHIPPED 2026-06-10</summary>

**Milestone Goal:** Remove all issue/PR-number citations from prompt content `.md` files in the 5 scoped dirs and add a permanent regression guard that blocks reintroduction.

- [x] **Phase 64: Citation Pattern Exploration** - Identify all citation formats beyond `#NNN` in the 5 scoped dirs (completed 2026-06-09)
- [x] **Phase 65: Guard Test (RED)** - Permanent guard test exists, covers all patterns, and fails RED enumerating real violations (completed 2026-06-09)
- [x] **Phase 66: Citation Cleanup** - All citations removed; sentences read naturally; frontmatter preserved (completed 2026-06-09)
- [x] **Phase 67: Full Verification** - npm test 0 failures; guard test GREEN; all content tests unaffected (completed 2026-06-10)

Full details: `.planning/milestones/v2.1.0-g-ROADMAP.md`

</details>

<details open>
<summary>🚧 v2.1.0-h Fork Feature Specification (Phases 68–77) — IN PROGRESS</summary>

**Milestone Goal:** Produce a complete, reimplementation-ready specification of every unique fork feature in `.planning/spec/`, so the fork's value can be rebuilt on a heavily-refactored future upstream where a direct merge is infeasible. One Markdown `SPEC.md` per feature, plus an `INDEX.md` manifest and `00-CONVENTIONS.md` meta-spec; RFC 2119 + EARS invariants with test traceability.

- [x] **Phase 68: Spec Scaffold** - INDEX.md manifest, 00-CONVENTIONS.md meta-spec, and explicit exclusion list (must come first) (completed 2026-06-11)
- [x] **Phase 69: spec-01 Positive Framing** - Spec the affirmative-framing standard and negative-framing scanner (Wave 1) (completed 2026-06-12)
- [ ] **Phase 70: spec-02 SHA Versioning** - Spec the SHA-based versioning system across install.js, worker, statusline (Wave 1)
- [ ] **Phase 71: spec-04 Eta Materialization** - Spec Eta v4 install-time content materialization, all copy paths (Wave 1)
- [ ] **Phase 72: spec-08 Test Infrastructure** - Spec scanner-precedence rule, serial isolation, fork test-suite layout (Wave 1)
- [ ] **Phase 73: spec-03 Hooks Build** - Spec on-demand `ensureHooksDist` build (Wave 2, depends on Phase 70)
- [ ] **Phase 74: spec-05 Step Numbering** - Spec whole-integer step numbering scanner + normalizer + cross-ref scanner (Wave 2, depends on Phase 72)
- [ ] **Phase 75: spec-06 Thinking Effort** - Spec per-agent thinking effort parser/resolver/catalog/wiring (Wave 2, depends on Phase 72)
- [ ] **Phase 76: spec-07 Citation Guard** - Spec the citation-cleanup guard and two-tier allowlist (Wave 2, depends on Phase 72)
- [ ] **Phase 77: Cross-Spec Consistency Review** - Reconcile INDEX dependency graph, traceability tables, exclusion list (depends on Phases 69–76)

</details>

## Phase Details

<details>
<summary>✅ v2.1.0-d Phase Details (Phases 48–51) — SHIPPED 2026-05-31</summary>

### Phase 48: TDD Red Gate

**Goal**: Scanner tests for decimal step labels, letter-suffix step labels (e.g., Step 7a), and out-of-order step numbering exist and fail against the current unmodified corpus
**Depends on**: Nothing (first phase of milestone)
**Requirements**: SCAN-01, SCAN-02
**Success Criteria** (what must be TRUE):

  1. `tests/step-numbering-scan.test.cjs` exists and all corpus subtests fail RED against the unmodified corpus (confirming actual violations are detected)
  2. Scanner correctly detects Pattern A/B (`**Step N.M**` headings), Pattern D (ordered-list decimal items like `2.5.`), and letter-suffix steps (e.g., `Step 7a`) as violations requiring renumbering to whole integers; code-fenced content is excluded
  3. Scanner correctly detects out-of-order step sequences (e.g., Step 1 then Step 3 then Step 2) in each file
  4. Running `npm test -- tests/step-numbering-scan.test.cjs` shows failures attributable to the 6 known violating files (not unrelated files)**Plans**: 1 plan
- [x] 48-01-PLAN.md — Write step-numbering scanner test (tests/step-numbering-scan.test.cjs)

### Phase 49: Survey and Normalization

**Goal**: Every decimal step label across all in-scope prompt content files is renamed to whole-integer sequential numbering; all same-file cross-references and co-located test assertions are updated in the same commits; the Phase 48 scanner goes GREEN
**Depends on**: Phase 48
**Requirements**: MAP-01, NORM-01
**Success Criteria** (what must be TRUE):

  1. A cross-file step reference index exists (produced before any renaming) enumerating every prose reference of the form "filename.md step N" with source file, source line, target file, and target step number
  2. `tests/step-numbering-scan.test.cjs` decimal-label and letter-suffix-label corpus subtests pass GREEN after normalization (0 violations in agents/, commands/gsd/, get-shit-done/workflows/)
  3. All 14+ affected test assertions (quick-branching, execute-phase-step-5-5-deviation-doc, agent-frontmatter, and others) are updated to reference the new whole-integer step labels
  4. Every cross-file reference updated in the same commit as the file rename it corresponds to (execute-plan.md step 5.5 references, post-merge-gate.md step 5.8 reference, fast.md Step 7 comment)
  5. `npm test` passes with 0 new failures after each individual file rename commit

**Plans**: TBD

### Phase 50: Maintenance Script and Cross-Ref Scanner

**Goal**: A cross-file-aware maintenance script can detect and renumber decimal steps on a clean or dirty corpus; a cross-file reference integrity scanner prevents stale step references from surviving future upstream merges
**Depends on**: Phase 49
**Requirements**: NORM-02, XREF-01
**Success Criteria** (what must be TRUE):

  1. `scripts/normalize-step-numbers.cjs --dry-run` exits 0 and reports "no changes needed" on the post-Phase-49 clean corpus
  2. `scripts/normalize-step-numbers.cjs` correctly renumbers a synthetic dirty file (decimal steps introduced) and updates its cross-file references, producing output identical to manual normalization
  3. `tests/cross-file-step-refs.test.cjs` exists and passes GREEN against the clean corpus — detecting any prose reference of the form "filename.md step N" where step N does not exist as a heading in the target file
  4. `tests/cross-file-step-refs.test.cjs` goes RED when a synthetic stale cross-file reference is injected (confirming detection works)

**Known input from Phase 48**: `scanForOutOfOrder` in `tests/step-numbering-scan.test.cjs` uses a line-start anchor (`^\s*\*?\*?`) that misses step labels preceded by list markers (`- **Step N:**`, `1. **Step N:**`) or blockquotes (`>`). No such patterns exist in the corpus as of 2026-05-30, but upstream merges could introduce them. Phase 50 hardening should replace the anchor with `^[\s*]*` and add list-marker stripping. See comment in `tests/step-numbering-scan.test.cjs:scanForOutOfOrder`.
**Plans**: 3 plans
**Wave 1**

- [x] 50-01-PLAN.md — Harden scanForOutOfOrder anchor in tests/step-numbering-scan.test.cjs (list-marker / blockquote stripping + flip G-01 limitation test) [NORM-02 prereq]

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 50-02-PLAN.md — Build scripts/normalize-step-numbers.cjs (cross-file-aware, idempotent, --dry-run) [NORM-02]

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 50-03-PLAN.md — Build tests/cross-file-step-refs.test.cjs (cross-file ref integrity scanner + RED test via tmp file) [XREF-01]

### Phase 51: Quality Gate

**Goal**: The full test suite passes with 0 regressions and the negative-framing scanner remains at 99/99 after all v2.1.0-d changes
**Depends on**: Phase 50
**Requirements**: GATE-01
**Success Criteria** (what must be TRUE):

  1. `npm test` reports 0 new failures compared to the v2.1.0-c baseline (7459 pass / 49 fail baseline)
  2. Negative-framing scanner remains at 99/99 subtests passing
  3. `tests/step-numbering-scan.test.cjs` and `tests/cross-file-step-refs.test.cjs` both pass in the full suite run

**Plans**: 1 plan
Plans:

- [x] 51-01-PLAN.md — Run npm test gate, produce 51-VERIFICATION.md and 51-01-SUMMARY.md closing Phase 51 [GATE-01]

</details>

<details>
<summary>✅ v2.1.0-e Phase Details (Phases 52–58) — SHIPPED 2026-06-06</summary>

**Milestone Goal:** Add a unified, Claude-first thinking-effort dimension encoded inline as `model;effort` labels (semicolon delimiter — chosen so colons in provider IDs are never ambiguous), resolved through the existing model machinery and passed to `Agent()` spawns. The parsing/resolver plumbing is additive, but the effort *semantics* deliberately change: per Phase 56 D-08, a bare (un-assigned) slot on `{claude, codex}` now floors to `medium` instead of resolving to `null`/omit (intended behavior change, not a regression). `inherit` slots and the 8 non-effort runtimes still omit.

#### Phase 52: Parser Foundation

**Goal**: A correct, exported `parseModelEffort` parser and a shared `_resolveAgentSlot` helper exist so model and effort always derive from the same resolved tier slot, with the colon-in-provider-ID pitfall structurally avoided
**Depends on**: Phase 51 (previous milestone complete)
**Requirements**: PARSE-01, PARSE-02, PARSE-03, PARSE-04
**Success Criteria** (what must be TRUE):

  1. `parseModelEffort('opus;high')` returns `{model: 'opus', effort: 'high'}`, and `parseModelEffort('openrouter:anthropic/claude-opus')` returns `{model: 'openrouter:anthropic/claude-opus', effort: null}` — the effort delimiter is `;` (split on `lastIndexOf(';')`), so colons in provider IDs are never treated as delimiters; the suffix is stripped only when it is an exact member of `{low, medium, high, xhigh, max}`. A typo suffix (`opus;hihg`) strips to the base model, returns `effort: null`, and warns.
  2. A bare model string with no recognized effort suffix returns `effort: null` (backward-compatible omit)
  3. A shared `_resolveAgentSlot(cwd, agentType)` helper returns the single raw slot string, so both the model resolver and the effort resolver read from the identical tier entry (structurally eliminates the #3023 divergence class)
  4. `parseModelEffort` is exported from the JS lib (`core.cjs`) and mirrored in `sdk/src/model-catalog.ts` with identical semantics, verified by a parity test

**Plans**: 3 plans

**Wave 1**

- [x] 52-01-PLAN.md — Implement and export `parseModelEffort(label)` with one-time typo warning [PARSE-01, PARSE-02]

**Wave 2** *(both blocked on Wave 1; parallel, no file overlap)*

- [x] 52-02-PLAN.md — Extract `_resolveAgentSlot` + refactor `resolveModelInternal` behind a pre-change golden snapshot [PARSE-03]
- [x] 52-03-PLAN.md — Mirror `parseModelEffort` into the SDK + shared parity fixture + cross-runner parity suites [PARSE-04]

#### Phase 53: Unified Effort Resolver

**Goal**: `resolveReasoningEffortInternal` resolves effort for the `claude` runtime (Claude gate lifted via an explicit `{claude, codex}` allowlist), follows the same precedence chain as the model resolver, and accepts `model;effort` in all three config override sites — while bare slots within `{claude, codex}` now floor to `medium` (Phase 56 D-08), and `inherit` slots plus the non-effort runtimes still omit effort
**Depends on**: Phase 52
**Requirements**: RESOLVE-01, RESOLVE-02, RESOLVE-03, RESOLVE-04, RESOLVE-05, RESOLVE-06, CONFIG-01, CONFIG-02, CONFIG-03, CONFIG-04
**Success Criteria** (what must be TRUE):

  1. With effort assigned in a profile slot, the resolver emits that effort for the `claude` runtime — the Claude gate is lifted via an explicit static `{claude, codex}` allowlist, never a data-derived "any tier carrying reasoning_effort" set
  2. Effort resolution follows the model precedence chain exactly: per-agent override → phase-type slot → profile slot → adaptiveTierMap → default; the bare-`{claude, codex}` fallthrough is now `medium` (the Phase 56 D-08 floor), not omit, while the `inherit` profile and bare adaptive entries still omit effort
  3. Profile-slot effort overrides the Codex per-tier `reasoning_effort`; the per-tier value is used only as fallback when the resolved slot carries no effort suffix; `max`→`xhigh` when emitted for Codex and `xhigh` is never emitted for the Codex haiku tier
  4. Every runtime outside `{claude, codex}` omits effort (hard no-op for the 8 null-tier runtimes)
  5. `model;effort` is accepted in `model_overrides.<agent>`, `models.<phase-type>`, and `model_profile_overrides.<runtime>`; config validation rejects/warns on malformed effort tokens consistent with existing tier-typo handling

**Plans**: 2 plans

**Wave 1**

- [x] 53-01-PLAN.md — Rewrite `resolveReasoningEffortInternal` as a unified `{claude,codex}` precedence chain on `_resolveAgentSlot` + static allowlist [RESOLVE-01..06, CONFIG-01, CONFIG-04]

**Wave 2** *(blocked on 53-01)*

- [x] 53-02-PLAN.md — Config-site acceptance (`models.<phase-type>`, `model_profile_overrides.<runtime>`) + cross-resolver golden snapshot [CONFIG-02, CONFIG-03, CONFIG-04]

#### Phase 54: SDK & Tools JSON Exposure

**Goal**: Resolved effort is observable in init/agent-skills JSON via `*_effort` siblings and a canonical `effort` field, with SDK and CLI producing identical model+effort shapes — the exposure layer reflects whatever the resolver returns, including the Phase 56 D-08 `medium` floor for bare `{claude, codex}` slots
**Depends on**: Phase 53
**Requirements**: EXPOSE-01, EXPOSE-02, EXPOSE-03
**Success Criteria** (what must be TRUE):

  1. The init JSON exposes a `*_effort` sibling for every resolved `*_model` field consumed by workflows
  2. `cmdResolveModel` / agent-skills output includes a canonical resolved `effort` field
  3. SDK (`sdk/src/`) and CLI (`bin/lib/`) resolution produce byte-identical model+effort shapes for the same inputs, verified by a parity test
  4. On a bare (un-assigned) catalog, exposed `*_effort` values track the resolver: bare `{claude, codex}` slots expose `medium` (the Phase 56 D-08 floor), while `inherit` slots and the 8 non-effort runtimes remain `null`/omitted — confirming the exposure layer faithfully mirrors the resolver floor (the explicit-null sibling contract from Phase 54 D-01 still holds for inherit/non-effort runtimes)

**Plans**: 2 plans

**Wave 1**

- [x] 54-01-PLAN.md — CLI exposure: *_effort siblings at all 20 init.cjs *_model sites + cmdResolveModel always-emit canonical `effort` (rename from reasoning_effort) + inertness tests [EXPOSE-01, EXPOSE-02]

**Wave 2** *(blocked on 54-01 — SDK mirrors the final CLI shape)*

- [x] 54-02-PLAN.md — SDK port: mirror effort precedence into config-query.ts resolveModel + static {claude,codex} allowlist + init *_effort siblings + extend golden parity harness with init-builder row [EXPOSE-03]

#### Phase 55: Catalog Schema + User Handover

**Goal**: The catalog schema/type widens to carry `model;effort` slot strings (Claude-built), then the user hand-assigns per-agent effort values across all 33 agents during an explicit execution handover
**Depends on**: Phase 54
**Requirements**: CATALOG-01, CATALOG-02, CATALOG-03
**Success Criteria** (what must be TRUE):

  1. `model-catalog.json` profile slots (`golden`/`balanced`/`budget`) and `adaptiveTierMap` entries accept inline `model;effort` labels — the schema/type widens from the fixed alias union to a string (Claude-built, CATALOG-01)
  2. `sdk/src/model-catalog.ts` mirror is widened to accept `model;effort` slot strings (Claude-built, CATALOG-03)
  3. Per-agent effort values are assigned across all 33 agents' slots by the user during handover (guidance heuristic: heavy → high, light → none/low, default → medium; higher is not monotonically better); `inherit` stays effort-free (user-owned, CATALOG-02)
  4. After handover, resolving a heavy agent yields its assigned effort and a light agent yields its assigned (or omitted) effort — confirming the hand-assigned values flow through the resolver built in Phase 53

**Plans**: 3 plans

**Wave 1**

- [x] 55-01-PLAN.md — Widen AgentCatalogEntry/ModelCatalog types to string + JSON schema note + strip ;effort suffix in resolveModelInternal & config-query.ts [CATALOG-01, CATALOG-03]

**Wave 2** *(blocked on 55-01)*

- [x] 55-02-PLAN.md — Write check-completeness.js (reuses Phase 53 resolveReasoningEffortInternal; temp claude-runtime config) [CATALOG-01]

**Wave 3** *(blocked on 55-02)*

- [x] 55-03-PLAN.md — USER HANDOVER: HANDOVER.md 33-agent table + blocking checkpoint + post-handover completeness verification [CATALOG-02]

### Phase 55.2: Fix SDK golden-parity suite failures (regression triage from phase 55) (INSERTED)

**Goal:** The 17 failing SDK golden native-handler parity tests (from /tmp/gsd-55-1-sdk.txt) are back to green WITHOUT relaxing assertions to hide divergence.
**Requirements**: none mapped (test-reconciliation phase)
**Depends on:** Phase 55
**Plans:** 5/5 plans complete

**Success criteria:**

- SDK suite → 0 failures (confirmed from the `Tests N passed / N failed` summary line in the piped file, NOT the tee exit code).
- ROOT suite stays green (`npm test` → fail 0) — no regression.
- VERIFICATION records, per test, whether the cause was missing-handler / stale-fixture / real-divergence, plus the introducing commit found during investigation.

Plans:
**Wave 1**

- [x] 55.2-01-PLAN.md — Investigation gate: confirm regression, name introducing commit, build 17-test classification skeleton (D-202/D-205)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 55.2-02-PLAN.md — Register intel.* + verify.codebase-drift native handlers (D-204); clears hard missing-handler failures, unblocks intel parity
- [x] 55.2-03-PLAN.md — Non-intel JSON-parity: audit-open, validate.health, history.digest, phase-plan-index, init.* (D-203)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 55.2-04-PLAN.md — Intel JSON-parity (coupled to 02) + meta/policy: native_failure classification, golden coverage policy (D-203)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 55.2-05-PLAN.md — Terminal gate: SDK fail 0 + ROOT stays green from summary lines; finalize VERIFICATION (D-201/D-205)

### Phase 55.1: Update old tests found failing due to phase 55 work (INSERTED)

**Goal:** The ~201 pre-existing tests that fail due to Phase 55 catalog changes are back to green WITHOUT regressing real behavior — each failure cluster root-caused (stale expectation → update test; regression → fix source); `npm test` (root + SDK) passes with 0 failures.
**Requirements**: none mapped (test-reconciliation phase)
**Depends on:** Phase 55
**Plans:** 4/4 plans complete

**Wave 1**

- [x] 55.1-01-PLAN.md — Root-cause + fix codex model-leak SOURCE regression (cluster #1) + update stale _resolveAgentSlot literal

**Wave 2** *(both blocked on 55.1-01; no file overlap)*

- [x] 55.1-02-PLAN.md — Root-cause cluster #2 (D-08 bare-config back-compat) + realign expectations to hand-assigned slot effort + regenerate golden
- [x] 55.1-03-PLAN.md — Bulk-update 7 stale-literal test files (opus 4-8, codex effort, runtime tiers)

**Wave 3** *(blocked on 55.1-02 + 55.1-03)*

- [x] 55.1-04-PLAN.md — Whole-suite gate: npm test (root + SDK) green, no skips, 55.1-VERIFICATION.md

#### Phase 56: Spawn-Template Wiring

**Goal**: Spawn templates across `agents/`, `commands/`, and `get-shit-done/workflows/` pass resolved effort to spawned agents via a pre-built carrier token
**Depends on**: Phase 55
**Requirements**: SPAWN-01, SPAWN-02, SPAWN-03
**Success Criteria** (what must be TRUE):

  1. The verified Claude effort carrier is wired so resolved effort reaches spawned agents
  2. Spawn templates across `agents/`, `commands/`, and `get-shit-done/workflows/` pass resolved effort via the pre-built carrier token; bare `{claude, codex}` slots floor to `medium` (D-08)
  3. Spawn-template edits preserve every fork quality gate (agent-frontmatter 155/155, negative-framing 99/99, step-numbering 632/632, cross-file-refs 219/219, eta-include)

**Plans**: 3 plans (2 waves)
**Wave 1**

- [x] 56-01-PLAN.md — Wave 1: D-08 medium floor in core resolver + resolve-model-effort SDK query + unit tests + D-02 carrier-verification gate

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 56-02-PLAN.md — Wave 2: wire effort into 8 Group A init-fed workflows (parse instruction + pre-built token per Agent() block)
- [x] 56-03-PLAN.md — Wave 2: wire effort into 9 Group B standalone-resolve workflows + gsd-debug-session-manager agent (adjacent resolve-model-effort line + Agent() token)

#### Phase 57: Install-Time Translation

**Goal**: `bin/install.js` translates canonical Claude effort to Codex `reasoning_effort` only at the Codex emit boundary, with each runtime materializing effort correctly at install time
**Depends on**: Phase 53 (resolver); independent of Phases 55–56
**Requirements**: INSTALL-01, INSTALL-02
**Success Criteria** (what must be TRUE):

  1. `bin/install.js` translates Claude `effort` to Codex `model_reasoning_effort` only at the Codex emit boundary
  2. Effort materializes correctly per runtime at install time — Claude effort preserved, Codex translated (`max`→`xhigh`, haiku tier never `xhigh`), unsupported runtimes omit
  3. The omit guard is preserved for runtimes that cannot carry effort

**Plans**: 3 plans (3 waves)

**Wave 1**

- [x] 57-01-PLAN.md — Wave 0 RED test stubs (tests/feat-57-install-translation.test.cjs) for INSTALL-01/INSTALL-02 [INSTALL-01, INSTALL-02]

**Wave 2** *(blocked on 57-01)*

- [x] 57-02-PLAN.md — core.cjs: haiku exclusion (override + bareTier paths, A1) + translateEffortForCodex helper + export [INSTALL-01, INSTALL-02]

**Wave 3** *(blocked on 57-02)*

- [x] 57-03-PLAN.md — install.js: redirect Codex emit seam through floored resolver + translateEffortForCodex + full-suite/coverage gate [INSTALL-01, INSTALL-02]

#### Phase 58: Regression Coverage

**Goal**: A comprehensive regression suite locks in the intended post-D-08 resolution — a golden snapshot proves bare `{claude, codex}` slots now resolve to `medium`, parser fixtures cover all edge cases, and per-runtime omit/translate contracts hold, with `npm test` green and coverage maintained
**Depends on**: Phase 57 (and spans Phases 52–57)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):

  1. A golden snapshot of model resolution proves the intended post-D-08 resolution across all 33 agents and all profile variants
  2. Parser fixtures cover effort suffixes, bare models, and colon-containing provider IDs
  3. Precedence and omit-contract tests pass per runtime: claude emits, codex translates, all other runtimes omit
  4. Regression assertions use strict equality on parsed structures — each new test confirmed RED before its fix lands
  5. Full `npm test` passes with zero new regressions versus the pre-milestone baseline; coverage ≥70%

**Plans**: 3 plans (2 waves)

**Wave 1** *(no file overlap — parallel)*

- [x] 58-01-PLAN.md — Build scripts/gen-golden-effort-snapshot.mjs (atomic write) + commit literal golden fixture tests/fixtures/golden-effort-snapshot.json [TEST-01]
- [x] 58-02-PLAN.md — Extend tests/fixtures/parse-model-effort.json with colon-provider-ID gap cases [TEST-02]

**Wave 2** *(blocked on Wave 1 — consumes the golden + parser fixtures)*

- [x] 58-03-PLAN.md — Write tests/feat-58-regression.test.cjs: static golden + omit/translate contract + antipattern guard + full-suite/coverage gate [TEST-01, TEST-03, TEST-04, TEST-05]

Full details: `.planning/milestones/v2.1.0-e-ROADMAP.md`

</details>

<details>
<summary>✅ v2.1.0-f Phase Details (Phases 59–63) — SHIPPED 2026-06-08</summary>

**Milestone Goal:** Close all behavioral and documentation testing gaps identified in the v2.1.0-e gap report before they accumulate into undetected regressions. Work is entirely additive test code across four existing test files — no agent or workflow source files change. Baseline: `npm test` 8,243 pass / 8,255 total. Target: that suite plus all new tests passing.

#### Phase 59: Comment Cleanup

**Goal**: The stale Phase 48 RED expectation comment is removed from `tests/step-numbering-scan.test.cjs`, establishing a clean baseline before any substantive test additions
**Depends on**: Phase 58 (previous milestone complete)
**Requirements**: DOC-01
**Success Criteria** (what must be TRUE):

  1. Lines 18–26 of `tests/step-numbering-scan.test.cjs` (the "Phase 48 RED expectation" JSDoc comment) are absent from the file
  2. Running `node --test tests/step-numbering-scan.test.cjs` reports the same test count as before the edit — no tests lost, no parse errors introduced
  3. `npm test 2>&1 | tee /tmp/gsd-test-output.txt` still passes with 0 new failures after the deletion**Plans**: 1 plan
- [x] 59-01-PLAN.md — Remove stale Phase 48 RED expectation JSDoc comment from tests/step-numbering-scan.test.cjs [DOC-01]

#### Phase 60: Effort Wiring Coverage

**Goal**: Eight Group B workflow effort-wiring regression tests exist in `tests/phase-56-effort-wiring.test.cjs`, guarding the spawn-template wiring added in v2.1.0-e Phase 56 against silent regression
**Depends on**: Phase 59
**Requirements**: EWC-01, EWC-02, EWC-03, EWC-04, EWC-05, EWC-06, EWC-07, EWC-08
**Success Criteria** (what must be TRUE):

  1. A passing test asserts `audit-fix.md` contains both `resolve-model-effort gsd-executor` and `executor_model_effort_arg`
  2. Passing tests assert `diagnose-issues.md`, `code-review.md`, `explore.md`, `import.md`, and `discuss-phase-assumptions.md` each contain their respective `resolve-model-effort <agent>` and `<agent>_model_effort_arg` tokens
  3. A passing test asserts `code-review-fix.md` contains `resolve-model-effort gsd-code-reviewer`, `resolve-model-effort gsd-code-fixer`, `code_reviewer_model_effort_arg`, and `code_fixer_model_effort_arg` (two agents — both spawn sites covered)
  4. A passing test asserts `ingest-docs.md` contains `resolve-model-effort gsd-doc-synthesizer`, `resolve-model-effort gsd-roadmapper`, `doc_synthesizer_model_effort_arg`, and `roadmapper_model_effort_arg` (two agents — both spawn sites covered)
  5. `npm test 2>&1 | tee /tmp/gsd-test-output.txt` passes with 0 new failures; the new tests are live (not skipped)

**Plans**: 1 plan
Plans:

- [x] 60-01-PLAN.md — Add 8 Group B effort-wiring regression tests (EWC-01..EWC-08) to tests/phase-56-effort-wiring.test.cjs

#### Phase 61: Worktree Safety Coverage

**Goal**: A test asserts that the `<task_commit_protocol>` block in `gsd-executor.md` explicitly distinguishes submodule `.git` files from worktree `.git` files — the worktree guards fire for `.git/worktrees/` paths but are skipped for submodule paths
**Depends on**: Phase 60
**Requirements**: WSC-01
**Success Criteria** (what must be TRUE):

  1. A passing test in `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` slices the `<task_commit_protocol>` XML block from `gsd-executor.md` and asserts the slice contains `.git/worktrees/` (the worktree-positive condition)
  2. The same test asserts the protocol block contains the submodule skip-branch mechanism (e.g., `GIT_CONTENT=` or `skip worktree guards`) so the guard is provably not activated for submodule paths
  3. Assertions are scoped to the `<task_commit_protocol>` block slice, not the full file, preventing vacuous passes from documentation text elsewhere in `gsd-executor.md`
  4. `npm test 2>&1 | tee /tmp/gsd-test-output.txt` passes with 0 new failures

**Plans**: 1 planPlans:

- [x] 61-01-PLAN.md — Append phase-61 submodule exclusion guard describe block to tests/bug-3097-3099-executor-worktree-path-safety.test.cjs [WSC-01]

#### Phase 62: Rubric Inlining Coverage

**Goal**: A test asserts that `gsd-user-profiler.md` load_rubric step references the Eta-inlined rubric via a `<reference>` block rather than a bare file read instruction
**Depends on**: Phase 61
**Requirements**: RIC-01
**Success Criteria** (what must be TRUE):

  1. A passing test in `tests/debug-session-management.test.cjs` (or a nearby appropriate file) reads `agents/gsd-user-profiler.md` and asserts the content contains `<step name="load_rubric">` (confirming the load_rubric step exists)
  2. The same test asserts the content contains `user-profiling.md` (confirming the specific rubric filename is referenced, not generic include language)
  3. The two assertions are separate `assert.ok()` calls so failure attribution is unambiguous
  4. `npm test 2>&1 | tee /tmp/gsd-test-output.txt` passes with 0 new failures

**Plans**: 1 planPlans:

- [x] 62-01-PLAN.md — Append phase-62 rubric inlining coverage describe block to tests/debug-session-management.test.cjs [RIC-01]

#### Phase 63: Security Framing Coverage

**Goal**: The previously-skipped test in `tests/debug-session-management.test.cjs` is active and passing, asserting that `gsd-debugger.md` contains the fork's hardened security paragraph rather than the upstream's `DATA_START` sentinel
**Depends on**: Phase 62
**Requirements**: SFC-01
**Success Criteria** (what must be TRUE):

  1. The test block at lines 99–101 of `tests/debug-session-management.test.cjs` (D-01 line-number correction; ROADMAP's original "lines 133–139" is stale and points to a different sessionManager test) has no `{ skip: '...' }` option — it executes unconditionally
  2. The test asserts `gsd-debugger.md` content contains `untrusted user input` (fork's affirmative security language)
  3. The test asserts `gsd-debugger.md` content contains `evidence data only` (fork's scope-restriction language)
  4. The stale `DATA_START` assertion is absent — it has been replaced entirely by the two fork-language assertions above
  5. `npm test 2>&1 | tee /tmp/gsd-test-output.txt` passes with 0 new failures; `debug-session-management.test.cjs` reports one fewer skipped test than before this phase

**Plans**: 1 plan
Plans:

- [x] 63-01-PLAN.md — Rewrite skipped gsd-debugger security test to assert fork hardened framing (untrusted user input / evidence data only) [SFC-01]

</details>

### v2.1.0-g Phase Details (Phases 64–67)

#### Phase 64: Citation Pattern Exploration

**Goal**: All citation formats present in the 5 scoped prompt-content dirs beyond the known `#NNN` pattern are identified and documented so the guard test detector is scoped correctly
**Depends on**: Phase 63 (previous milestone complete)
**Requirements**: CITE-01, CITE-02
**Success Criteria** (what must be TRUE):

  1. A scan of `commands/`, `get-shit-done/workflows/`, `agents/`, `get-shit-done/references/`, and `get-shit-done/templates/` is complete and documents every citation format found — at minimum: word-form ("issue 3668"), hyphen-form ("feat-3347"), `#NNN` inline, and any other variant present
  2. Findings are recorded with file:line, matched text, and pattern category — the guard test author can derive detector regexes directly from this document without re-scanning
  3. The count of `#NNN` hits in the scoped dirs is confirmed (establishes the cleanup target for Phase 66)
  4. Any citation formats that overlap with allowlisted tokens (hex colors, heading markers, illustrative placeholders) are called out explicitly so the guard test allowlist in Phase 65 is pre-scoped

**Plans**: 1 plan
Plans:

- [x] 64-01-PLAN.md — Build scripts/scan-citations.cjs scanner and write 64-FINDINGS.md [CITE-01, CITE-02]

#### Phase 65: Guard Test (RED)

**Goal**: A permanent test `tests/no-issue-citations.test.cjs` exists, runs under `npm test`, covers all citation patterns found in Phase 64, and fails RED before any cleanup — enumerating each offending file:line
**Depends on**: Phase 64
**Requirements**: CITE-03, CITE-04, CITE-05
**Success Criteria** (what must be TRUE):

  1. `tests/no-issue-citations.test.cjs` exists and is included in the `npm test` run without manual intervention
  2. Before any cleanup edits, the test fails RED and its failure output enumerates each offending file, line number, and matched text — not just a count
  3. The allowlist correctly exempts hex color codes (including `color:` frontmatter fields such as `color: '#e8c170'`), illustrative placeholders (`#123`, `#45`), and markdown heading markers (`## Heading`) — none of these produce a test failure
  4. Agent YAML frontmatter blocks are not flagged — the scanner skips or exempts frontmatter sections

**Plans**: 2 plans

**Wave 1**

- [x] 65-01-PLAN.md — Create tests/no-issue-citations.test.cjs with inline detection, allowlist, exclusion state machines, and corpus subtests (RED) [CITE-03, CITE-04, CITE-05]

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 65-02-PLAN.md — Delete scripts/scan-citations.cjs and tests/citation-scan.test.cjs (D-02, D-03); re-verify guard test independence [CITE-03]

#### Phase 66: Citation Cleanup

**Goal**: All citations are removed from the 5 scoped dirs, cleaned sentences read naturally, and agent frontmatter is preserved exactly
**Depends on**: Phase 65
**Requirements**: CITE-06, CITE-07, CITE-08, CITE-09
**Success Criteria** (what must be TRUE):

  1. `grep -rEn '#[0-9]+' commands/ get-shit-done/workflows/ agents/ get-shit-done/references/ get-shit-done/templates/` returns only hits that match the Phase 65 allowlist (hex colors, illustrative placeholders, heading markers) — no bare issue/PR number citations remain
  2. All additional citation forms found in Phase 64 (word-form, hyphen-form, etc.) are removed from the same scoped dirs
  3. Every cleaned sentence reads naturally — no double spaces, space-before-punctuation, empty parentheses, or dangling connectors (`—`, `,`, `see`, `by`, `in`, `from`) at sentence boundaries
  4. `agent-frontmatter.test.cjs` passes with the same count as before Phase 66 — no YAML frontmatter blocks were modified during cleanup

**Plans**: 4 plans

**Wave 1** *(all 4 plans parallel — no file overlap; templates/ already clean per guard test)*

- [x] 66-01-PLAN.md — Clean citations from 9 commands/gsd/ files (config, graphify, ns-context, ns-ideate, ns-manage, ns-project, ns-review, ns-workflow, plan-phase) [CITE-06, CITE-07, CITE-08, CITE-09]
- [x] 66-02-PLAN.md — Clean citations from 20 get-shit-done/workflows/ files including execute-plan.md line-111 dense paragraph [CITE-06, CITE-07, CITE-08, CITE-09]
- [x] 66-03-PLAN.md — Clean citations from 6 agents/ files with baseline/after agent-frontmatter test-count gate [CITE-06, CITE-07, CITE-08, CITE-09]
- [x] 66-04-PLAN.md — Clean citations from 10 get-shit-done/references/ files [CITE-06, CITE-07, CITE-08, CITE-09]

#### Phase 67: Full Verification

**Goal**: The full test suite passes with zero failures; the guard test is GREEN; all pre-existing content tests are unaffected
**Depends on**: Phase 66
**Requirements**: CITE-10, CITE-11, CITE-12
**Success Criteria** (what must be TRUE):

  1. `tests/no-issue-citations.test.cjs` passes GREEN — zero citations detected in the scoped dirs after cleanup
  2. `npm test 2>&1 | tee /tmp/gsd-test-output.txt` reports 0 failures — agent-frontmatter, negative-framing-scan, step-numbering-scan, cross-file-step-refs, and all other suite members pass
  3. The negative-framing scanner result is unchanged from the v2.1.0-f baseline (99/99 subtests passing)

**Plans**: 1 plan
Plans:

- [x] 67-01-PLAN.md — Confirm guard test GREEN, reconcile CITE-11 grep, and run the full npm test suite to zero failures

### v2.1.0-h Phase Details (Phases 68–77)

**Shared acceptance criteria (QUAL-01–QUAL-05) — apply to every feature-spec phase (69–76):**

  - QUAL-01: Behavioral invariants are numbered, falsifiable EARS statements with RFC 2119 strength (≥2 per spec); the normative contract is behavior, not implementation
  - QUAL-02: An Acceptance-Tests traceability table maps each MUST-level invariant to a test file + subtest name; untested invariants are flagged `[MISSING — write test first]`
  - QUAL-03: The normative contract is separated from advisory implementation notes; every current file path/symbol is marked `<!-- advisory -->` and survives a file move
  - QUAL-04: At least one tier-1 (test) or tier-2 (source) artifact is cited; reference guides appear only as background
  - QUAL-05: A Key Decisions section records settled decisions with rationale, marked "settled — do not reopen", with the consequence of reopening stated inline

#### Phase 68: Spec Scaffold

**Goal**: The spec set has a manifest, a meta-spec defining conventions, and an explicit exclusion list — so every downstream feature-spec phase has the template, ID scheme, dependency order, and scope guardrails in place before any feature is specced
**Depends on**: Phase 67 (previous milestone complete)
**Requirements**: SCAF-01, SCAF-02, SCAF-03
**Success Criteria** (what must be TRUE):

  1. `.planning/spec/INDEX.md` exists with a feature-status table (ID, feature, spec link, status, depends-on), a dependency graph, and a Wave 1 / Wave 2 build order [SCAF-01]
  2. `.planning/spec/00-CONVENTIONS.md` exists and defines the per-feature spec template, the REQ-ID/SPEC-ID scheme, the status vocabulary (Draft/Ready/Implemented/Verified), and the source-of-truth hierarchy [SCAF-02]
  3. `INDEX.md` contains an explicit "Excluded from scope" section listing superseded/abandoned work the reimplementer must not carry forward — at minimum XML tag hierarchy (`<persona>`/`<intent>`/`<objective>`), the `resolveIncludes()` stepping stone, the `parseV()` semver block, and every PROJECT.md Out-of-Scope item [SCAF-03]
  4. Eight numbered feature subdirectories (`01-positive-framing/` through `08-test-infrastructure/`) each contain a `SPEC.md` stub with populated frontmatter, matching the INDEX manifest order**Plans**: 2 plans

**Wave 1**

- [x] 68-01-PLAN.md — 00-CONVENTIONS.md meta-spec (locked 7-section template, NN-INV-M ID scheme, status vocab, source-of-truth hierarchy) + eight NN-*/SPEC.md stubs [SCAF-02]

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 68-02-PLAN.md — INDEX.md manifest (feature-status table + dependency graph + Wave 1/2 build order + exhaustive Excluded-from-scope sweep) [SCAF-01, SCAF-03]

#### Phase 69: spec-01 Positive Framing

**Goal**: `01-positive-framing/SPEC.md` fully specifies the affirmative-framing standard and the negative-framing corpus scanner as a behavioral contract a reimplementer can rebuild on a refactored upstream
**Depends on**: Phase 68
**Requirements**: SPEC-01 (+ shared QUAL-01–05)
**Success Criteria** (what must be TRUE):

  1. `01-positive-framing/SPEC.md` enumerates all 12+ scanner detection branches (doNot, never, dont, antiPatterns, mustNot, shouldNot, cannot, wont, willNot, prohibited, forbidden, warn-only variants), the affirmative-rewrite replacement rule, the paired-pattern exception, and the four scan directories [SPEC-01]
  2. Invariants are numbered EARS statements (≥2) citing `tests/negative-framing-scan.test.cjs` as the tier-1 source; the traceability table maps each MUST to a subtest [QUAL-01, QUAL-02, QUAL-04]
  3. Current file paths/symbols are advisory-marked and the spec survives a file move; a Key Decisions section records settled framing decisions "do not reopen" [QUAL-03, QUAL-05]

**Plans**: 1 plan

**Wave 1**

- [x] 69-01-PLAN.md — Author SPEC.md body: Purpose, Scope, five 01-INV-M invariants + Acceptance Tests table, Key Decisions, advisory Code Context; advance Status Draft -> Ready [SPEC-01, QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05]

#### Phase 70: spec-02 SHA Versioning

**Goal**: `02-sha-versioning/SPEC.md` fully specifies the SHA-based versioning system and its coordination topology across the five files that implement it
**Depends on**: Phase 68
**Requirements**: SPEC-02 (+ shared QUAL-01–05)
**Success Criteria** (what must be TRUE):

  1. `02-sha-versioning/SPEC.md` specifies install.js git-SHA emit, `no-network` sentinel semantics (signals an invalid install, not an empty string), the update worker via the GitHub Commits API with `isNewer` SHA-equality, statusline display, the `check-latest-version.cjs` injectable seam, and the `{{GSD_REPO}}`/`{{GSD_BRANCH}}` template-placeholder boundary [SPEC-02]
  2. The "GitHub Commits API, not npmjs.com" and "SHA equality, not semver ordering" decisions are recorded as settled in Key Decisions with the consequence of reopening stated [QUAL-05]
  3. Invariants are EARS statements citing the version/semver/SHA test files as tier-1 sources; traceability table is complete [QUAL-01, QUAL-02, QUAL-04]; current paths advisory-marked [QUAL-03]

**Plans**: TBD

#### Phase 71: spec-04 Eta Materialization

**Goal**: `04-eta-materialization/SPEC.md` fully specifies Eta v4 install-time content materialization, including the skills-path `wrappedConverter` coverage that was found only via post-milestone audit
**Depends on**: Phase 68
**Requirements**: SPEC-04 (+ shared QUAL-01–05)
**Success Criteria** (what must be TRUE):

  1. `04-eta-materialization/SPEC.md` specifies the engine configuration (default delimiters, `autoEscape: false`, `<%~` raw output), the `<%~ include() %>` conversion from `@~/` refs, the `ALLOWED_INLINE_REFS` exception list, and coverage of every copy path — including the skills `wrappedConverter` — stated as an explicit invariant [SPEC-04]
  2. Invariants are EARS statements (≥2) citing `tests/install-eta-regression.test.cjs` as tier-1; traceability table maps each MUST to a subtest [QUAL-01, QUAL-02, QUAL-04]
  3. Current paths/symbols advisory-marked; Key Decisions records the Eta-v4-over-custom-resolver and default-delimiter decisions as settled [QUAL-03, QUAL-05]

**Plans**: TBD

#### Phase 72: spec-08 Test Infrastructure

**Goal**: `08-test-infrastructure/SPEC.md` fully specifies the fork test infrastructure as standing policy — the prerequisite governing how the Wave 2 scanner/guard specs write their acceptance tests
**Depends on**: Phase 68
**Requirements**: SPEC-08 (+ shared QUAL-01–05)
**Success Criteria** (what must be TRUE):

  1. `08-test-infrastructure/SPEC.md` specifies the scanner-precedence rule (the fork standard wins when a test conflicts) as a standing policy, the serial test-isolation mechanism (`SERIAL_FILES`, `describe({ concurrency: false })`) with rationale, and the fork-owned test-suite layout/conventions [SPEC-08]
  2. Invariants are EARS statements (≥2) citing a tier-1 test file or tier-2 source; scanner-precedence is stated as a policy invariant, not a one-time decision [QUAL-01, QUAL-04]
  3. Traceability table complete; current paths advisory-marked; Key Decisions records scanner-precedence as settled with the consequence of reopening [QUAL-02, QUAL-03, QUAL-05]

**Plans**: TBD

#### Phase 73: spec-03 Hooks Build

**Goal**: `03-hooks-build/SPEC.md` fully specifies the on-demand hooks build and its install-ordering dependency on SHA versioning
**Depends on**: Phase 70 (spec-02 SHA versioning READY — hooks build is a prerequisite for SHA-versioning hooks being installable)
**Requirements**: SPEC-03 (+ shared QUAL-01–05)
**Success Criteria** (what must be TRUE):

  1. `03-hooks-build/SPEC.md` specifies the `ensureHooksDist` trigger condition (absent `hooks/dist/`), the `spawnSync` vs `execSync` decision with rationale, the console notice, and the abort-on-failure behavior [SPEC-03]
  2. The spec states the build-order constraint relative to SHA-versioning hooks (ensureHooksDist must run before hooks are installed) in its Dependencies section, consistent with INDEX.md [SPEC-03]
  3. Invariants are EARS statements (≥2) citing `tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` as tier-1; traceability table complete; paths advisory-marked; Key Decisions settled [QUAL-01–05]

**Plans**: TBD

#### Phase 74: spec-05 Step Numbering

**Goal**: `05-step-numbering/SPEC.md` fully specifies whole-integer step numbering as a three-layer contract (scanner → normalizer → cross-file-ref scanner) with the Pattern C exclusion preserved as intentional
**Depends on**: Phase 72 (spec-08 Test Infrastructure READY — scanner-precedence and serial-isolation policies govern this spec's tests)
**Requirements**: SPEC-05 (+ shared QUAL-01–05)
**Success Criteria** (what must be TRUE):

  1. `05-step-numbering/SPEC.md` specifies the scanner (decimal + letter-suffix + out-of-order detection), the `normalize-step-numbers.cjs` cross-file-aware idempotent CLI, the cross-file-step-refs scanner, and the explicit Pattern C exclusion (`## N.N.` section headings in plan files) as an intended exclusion — not an oversight [SPEC-05]
  2. The scanner → normalizer → cross-file-ref-scanner internal ordering is stated explicitly within the spec [SPEC-05]
  3. Invariants are EARS statements (≥2) citing the step-numbering and cross-file-step-refs test files as tier-1; corpus counts recorded "current as of" with the shape (not the count) normative; traceability table complete; paths advisory-marked; Key Decisions settled [QUAL-01–05]

**Plans**: TBD

#### Phase 75: spec-06 Thinking Effort

**Goal**: `06-thinking-effort/SPEC.md` fully specifies per-agent thinking effort — the most complex spec surface — with the D-08 floor and the rawSlotForRuntime Codex fix captured as correctness linchpins
**Depends on**: Phase 72 (spec-08 Test Infrastructure READY)
**Requirements**: SPEC-06 (+ shared QUAL-01–05)
**Success Criteria** (what must be TRUE):

  1. `06-thinking-effort/SPEC.md` specifies the `parseModelEffort` semicolon parser (input/output/error modes), the unified `{claude, codex}` resolver precedence chain (override → slot → D-08 medium floor), the static runtime allowlist, the per-runtime behavior matrix, the catalog schema, the 20 `*_effort` init siblings, spawn-template wiring, the install.js Codex emit seam, the `rawSlotForRuntime` Codex fix, and the CATALOG-02 user-handover boundary [SPEC-06]
  2. The D-08 medium floor is stated as a MUST-level invariant (not optional) with the consequence of omission; the rawSlotForRuntime fix is named as the correctness linchpin [SPEC-06, QUAL-01]
  3. Invariants cite the effort-resolution regression test (330-row golden snapshot) and `init.cjs` as tier-1/tier-2 sources; the snapshot's structure is described, not just its existence; traceability table complete; paths advisory-marked; Key Decisions settled [QUAL-02–05]

**Plans**: TBD

#### Phase 76: spec-07 Citation Guard

**Goal**: `07-citation-guard/SPEC.md` fully specifies the citation-cleanup guard with its non-obvious two-tier allowlist semantics
**Depends on**: Phase 72 (spec-08 Test Infrastructure READY)
**Requirements**: SPEC-07 (+ shared QUAL-01–05)
**Success Criteria** (what must be TRUE):

  1. `07-citation-guard/SPEC.md` specifies the `no-issue-citations.test.cjs` detection (inline / parenthetical / feat-form), the two-tier allowlist (`PLACEHOLDER_DIGITS` vs `FILE_ALLOWLIST`) with distinct per-tier semantics, and the 5-directory detection scope [SPEC-07]
  2. Invariants are EARS statements (≥2) citing `tests/no-issue-citations.test.cjs` as the tier-1 source; the two allowlist tiers are distinguished as separate invariants; traceability table complete [QUAL-01, QUAL-02, QUAL-04]
  3. Current paths advisory-marked; Key Decisions records the two-tier-allowlist refactor as settled [QUAL-03, QUAL-05]

**Plans**: TBD

#### Phase 77: Cross-Spec Consistency Review

**Goal**: All eight feature specs reach READY status and the spec set is internally consistent — the manifest, the per-spec dependency declarations, the traceability tables, and the exclusion list all agree
**Depends on**: Phases 69, 70, 71, 72, 73, 74, 75, 76 (all feature specs)
**Requirements**: REV-01
**Success Criteria** (what must be TRUE):

  1. The `INDEX.md` dependency graph is reconciled against every `SPEC.md`'s Dependencies section — no mismatch between declared and manifested dependencies [REV-01]
  2. Every traceability table is complete: no `[MISSING]` rows remain unflagged, and each flagged row is acknowledged in INDEX.md status [REV-01]
  3. The `INDEX.md` "Excluded from scope" section covers all known abandoned features (validated against PROJECT.md Out of Scope); `00-CONVENTIONS.md` matches the actual structure every spec follows [REV-01]
  4. All eight feature specs carry status READY in the INDEX manifest

**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Accurate CATALOGUE | v1.36.0 | 1/1 | Complete | 2026-04-15 |
| 2. Apply Fork Standards to v1.36.0 Files | v1.36.0 | 4/4 | Complete | 2026-04-16 |
| 3. Align Tests with Fork Standards | v1.36.0 | 2/2 | Complete | 2026-04-16 |
| 4. Fix Hooks Installation | v1.36.0.b | 1/1 | Complete | 2026-04-17 |
| 5. Regression Coverage | v1.36.0.b | 1/1 | Complete | 2026-04-17 |
| 4. Fix Background Update-Check Hook | v1.36.0.a | 1/1 | Complete | 2026-04-17 |
| 5. Fix Version Detection and Update Workflow | v1.36.0.a | 2/2 | Complete | 2026-04-17 |
| 6. Produce Phase 4 Verification Artifacts | v1.36.0.a | 1/1 | Complete | 2026-04-18 |
| 7. Merge and Conflict Resolution | v1.37.1 | 2/2 | Complete | 2026-04-17 |
| 8. CATALOGUE Sync | v1.37.1 | 1/1 | Complete | 2026-04-17 |
| 9. Fork Standards Pass | v1.37.1 | 2/2 | Complete | 2026-04-18 |
| 10. Test Suite Green | v1.37.1 | 1/1 | Complete | 2026-04-19 |
| 11. Documentation Sync & Nyquist Completion | v1.37.1 | 1/1 | Complete | 2026-04-21 |
| 12. Tech Debt Remediation | v1.37.1 | 3/3 | Complete | 2026-04-21 |
| 13. Agent Fixes | v1.37.1a | 3/3 | Complete | 2026-04-22 |
| 14. Workflow, Reference, and Command Fixes | v1.37.1a | 2/2 | Complete | 2026-04-22 |
| 15. Test Suite Gate | v1.37.1a | 1/1 | Complete | 2026-04-23 |
| 16. Nyquist Validation Pass | v1.37.1a | 3/3 | Complete | 2026-04-23 |
| 17. Working Tree & Docs Housekeeping | v1.37.1a | 3/3 | Complete | 2026-04-23 |
| 18. Fork Tag Corpus Tests | v1.37.1b | 2/2 | Complete | 2026-04-28 |
| 19. Convert objective tags to intent in skill files | v1.37.1b | 3/3 | Complete | 2026-04-29 |
| 20. Baseline Audit | v1.37.1c | 1/1 | Complete    | 2026-04-29 |
| 21. L1 + L2 Validation | v1.37.1c | 0/0 | Abandoned | - |
| 22. L3 Conversion | v1.37.1c | 0/0 | Abandoned | - |
| 23. L4 Conversion | v1.37.1c | 0/0 | Abandoned | - |
| 24. Gate + Documentation | v1.37.1c | 0/0 | Abandoned | - |
| 25. Scanner Expansion | v1.37.2 | 3/3 | Complete    | 2026-05-01 |
| 26. Violation Fixes | v1.37.2 | 3/3 | Complete    | 2026-05-02 |
| 27. Quality Gate | v1.37.2 | 3/3 | Complete    | 2026-05-02 |
| 28. Full Manual Audit | v1.38.6 | 6/6 | Complete | 2026-05-02 |
| 29. TDD Scanner Expansion | v1.38.6 | 2/2 | Complete | 2026-05-03 |
| 30. Violation Fixes | v1.38.6 | 2/2 | Complete | 2026-05-03 |
| 31. Conflicting Test Handling + Final Gate | v1.38.6 | 1/1 | Complete | 2026-05-03 |
| 32. Quick Test Fixes | v1.41.3 | 1/1 | Complete   | 2026-05-13 |
| 33. Positive Framing Pass | v1.41.3 | 2/2 | Complete    | 2026-05-14 |
| 34. Gate and Merge | v1.41.3 | 1/1 | Complete    | 2026-05-14 |
| 35. Backup and Soft Reset | v1.41.5 | 1/1 | Complete | 2026-05-22 |
| 36. Stage and Commit Configuration & Rules | v1.41.5 | 1/1 | Complete | 2026-05-22 |
| 37. Stage and Commit Scanner Logic | v1.41.5 | 1/1 | Complete | 2026-05-22 |
| 38. Stage and Commit Workflows, Agents, & Templates | v1.41.5 | 1/1 | Complete | 2026-05-22 |
| 39. Stage and Commit Tests & SDK Validation | v1.41.5 | 1/1 | Complete | 2026-05-22 |
| 40. Stage and Commit Maintenance, Logs, & State | v1.41.5 | 1/1 | Complete | 2026-05-23 |
| 41. Final Verification & Parity Audit | v1.41.5 | 1/1 | Complete | 2026-05-23 |
| 42. SHA Hook and Install Reimplementation | v2.1.0-a | 1/1 | Complete | 2026-05-25 |
| 43. Update Workflow SHA Migration + Full Gate | v2.1.0-a | 1/1 | Complete | 2026-05-26 |
| 44. Investigation | v2.1.0-b | 1/1 | Complete    | 2026-05-28 |
| 45. Command Layer Fixes | v2.1.0-b | 4/4 | Complete    | 2026-05-28 |
| 46. Workflow Layer Fixes | v2.1.0-b | 2/2 | Complete    | 2026-05-29 |
| 47. Agent Layer Fixes | v2.1.0-b | 0/0 | Abandoned | - |
| 48. Quality Gate | v2.1.0-b | 2/2 | Complete    | 2026-05-30 |
| 44. Resolver Core | v2.1.0-c | 1/1 | Complete | 2026-05-28 |
| 45. Pipeline Integration | v2.1.0-c | 5/5 | Complete | 2026-05-28 |
| 46. Regression Test Suite | v2.1.0-c | 2/2 | Complete | 2026-05-29 |
| 47. Full Runtime Matrix + Verification | v2.1.0-c | 1/1 | Complete | 2026-05-29 |
| 47.1. Close gap: INTG-04/GATE-03 — wire renderEtaContent into skills path | v2.1.0-c | 2/2 | Complete   | 2026-05-29 |
| 48. TDD Red Gate | v2.1.0-d | 2/2 | Complete | 2026-05-30 |
| 49. Survey and Normalization | v2.1.0-d | 14/13 | Complete | 2026-05-31 |
| 50. Maintenance Script and Cross-Ref Scanner | v2.1.0-d | 3/3 | Complete | 2026-05-30 |
| 51. Quality Gate | v2.1.0-d | 1/1 | Complete | 2026-05-31 |
| 52. Parser Foundation | v2.1.0-e | 3/3 | Complete    | 2026-05-31 |
| 53. Unified Effort Resolver | v2.1.0-e | 2/2 | Complete    | 2026-06-01 |
| 54. SDK & Tools JSON Exposure | v2.1.0-e | 2/2 | Complete    | 2026-06-02 |
| 55. Catalog Schema + User Handover | v2.1.0-e | 3/3 | Complete   | 2026-06-03 |
| 56. Spawn-Template Wiring | v2.1.0-e | 3/3 | Complete    | 2026-06-04 |
| 57. Install-Time Translation | v2.1.0-e | 3/3 | Complete    | 2026-06-05 |
| 58. Regression Coverage | v2.1.0-e | 3/3 | Complete    | 2026-06-06 |
| 59. Comment Cleanup | v2.1.0-f | 1/1 | Complete    | 2026-06-07 |
| 60. Effort Wiring Coverage | v2.1.0-f | 1/1 | Complete    | 2026-06-07 |
| 61. Worktree Safety Coverage | v2.1.0-f | 1/1 | Complete    | 2026-06-08 |
| 62. Rubric Inlining Coverage | v2.1.0-f | 1/1 | Complete    | 2026-06-08 |
| 63. Security Framing Coverage | v2.1.0-f | 1/1 | Complete    | 2026-06-08 |
| 64. Citation Pattern Exploration | v2.1.0-g | 1/1 | Complete    | 2026-06-09 |
| 65. Guard Test (RED) | v2.1.0-g | 2/2 | Complete    | 2026-06-09 |
| 66. Citation Cleanup | v2.1.0-g | 4/4 | Complete    | 2026-06-09 |
| 67. Full Verification | v2.1.0-g | 1/1 | Complete    | 2026-06-10 |
| 68. Spec Scaffold | v2.1.0-h | 2/2 | Complete    | 2026-06-11 |
| 69. spec-01 Positive Framing | v2.1.0-h | 1/1 | Complete    | 2026-06-12 |
| 70. spec-02 SHA Versioning | v2.1.0-h | 0/TBD | Not started | - |
| 71. spec-04 Eta Materialization | v2.1.0-h | 0/TBD | Not started | - |
| 72. spec-08 Test Infrastructure | v2.1.0-h | 0/TBD | Not started | - |
| 73. spec-03 Hooks Build | v2.1.0-h | 0/TBD | Not started | - |
| 74. spec-05 Step Numbering | v2.1.0-h | 0/TBD | Not started | - |
| 75. spec-06 Thinking Effort | v2.1.0-h | 0/TBD | Not started | - |
| 76. spec-07 Citation Guard | v2.1.0-h | 0/TBD | Not started | - |
| 77. Cross-Spec Consistency Review | v2.1.0-h | 0/TBD | Not started | - |

*v1.41.3 shipped 2026-05-19 — see `.planning/milestones/v1.41.3-ROADMAP.md`*
*v1.41.5 shipped 2026-05-24 — see `.planning/milestones/v1.41.5-ROADMAP.md`*
*v2.1.0-a shipped 2026-05-26 — see `.planning/milestones/v2.1.0-a-ROADMAP.md`*
*v2.1.0-c shipped 2026-05-29 — see `.planning/milestones/v2.1.0-c-ROADMAP.md`*
*v2.1.0-d shipped 2026-05-31 — see `.planning/milestones/v2.1.0-d-ROADMAP.md`*
*v2.1.0-e shipped 2026-06-06 — see `.planning/milestones/v2.1.0-e-ROADMAP.md`*
*v2.1.0-f shipped 2026-06-08 — see `.planning/milestones/v2.1.0-f-ROADMAP.md`*
*v2.1.0-g shipped 2026-06-10 — see `.planning/milestones/v2.1.0-g-ROADMAP.md`*
