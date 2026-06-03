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
- 🚧 **v2.1.0-e Per-Agent Thinking Effort** — Phases 52–58 (in progress)

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

### 🚧 v2.1.0-e Per-Agent Thinking Effort (In Progress)

**Milestone Goal:** Add a unified, Claude-first thinking-effort dimension encoded inline as `model;effort` labels (semicolon delimiter — chosen so colons in provider IDs are never ambiguous), resolved through the existing model machinery and passed to `Agent()` spawns. The work is purely additive — bare configs must resolve identically to today.

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

**Goal**: `resolveReasoningEffortInternal` resolves effort for the `claude` runtime (Claude gate lifted via an explicit `{claude, codex}` allowlist), follows the same precedence chain as the model resolver, and accepts `model;effort` in all three config override sites — while bare configs continue to omit effort everywhere
**Depends on**: Phase 52
**Requirements**: RESOLVE-01, RESOLVE-02, RESOLVE-03, RESOLVE-04, RESOLVE-05, RESOLVE-06, CONFIG-01, CONFIG-02, CONFIG-03, CONFIG-04
**Plan-time verification**: Confirm whether `effort: max` is accepted in Claude Code subagent frontmatter before emitting it on the Claude path. If rejected (the settings file rejects it; frontmatter behavior is undocumented), add a `max`→`xhigh` clamp on the Claude spawn path as well.
**Success Criteria** (what must be TRUE):

  1. With effort assigned in a profile slot, the resolver emits that effort for the `claude` runtime — the Claude gate is lifted via an explicit static `{claude, codex}` allowlist, never a data-derived "any tier carrying reasoning_effort" set
  2. Effort resolution follows the model precedence chain exactly: per-agent override → phase-type slot → profile slot → adaptiveTierMap → omit; the `inherit` profile and bare adaptive entries omit effort
  3. Profile-slot effort overrides the Codex per-tier `reasoning_effort`; the per-tier value is used only as fallback when the resolved slot carries no effort suffix; `max`→`xhigh` when emitted for Codex and `xhigh` is never emitted for the Codex haiku tier
  4. Every runtime outside `{claude, codex}` omits effort (hard no-op for the 8 null-tier runtimes)
  5. `model;effort` is accepted in `model_overrides.<agent>`, `models.<phase-type>`, and `model_profile_overrides.<runtime>`; config validation rejects/warns on malformed effort tokens consistent with existing tier-typo handling

**Plans**: 2 plans

**Wave 1**

- [x] 53-01-PLAN.md — Rewrite `resolveReasoningEffortInternal` as a unified `{claude,codex}` precedence chain on `_resolveAgentSlot` + static allowlist [RESOLVE-01..06, CONFIG-01, CONFIG-04]

**Wave 2** *(blocked on 53-01)*

- [x] 53-02-PLAN.md — Config-site acceptance (`models.<phase-type>`, `model_profile_overrides.<runtime>`) + cross-resolver golden snapshot [CONFIG-02, CONFIG-03, CONFIG-04]

#### Phase 54: SDK & Tools JSON Exposure

**Goal**: Resolved effort is observable in init/agent-skills JSON via `*_effort` siblings and a canonical `effort` field, with SDK and CLI producing identical model+effort shapes — plumbing that no-ops on a bare catalog
**Depends on**: Phase 53
**Requirements**: EXPOSE-01, EXPOSE-02, EXPOSE-03
**Success Criteria** (what must be TRUE):

  1. The init JSON exposes a `*_effort` sibling for every resolved `*_model` field consumed by workflows
  2. `cmdResolveModel` / agent-skills output includes a canonical resolved `effort` field
  3. SDK (`sdk/src/`) and CLI (`bin/lib/`) resolution produce byte-identical model+effort shapes for the same inputs, verified by a parity test
  4. On a bare (un-assigned) catalog, every exposed `*_effort` value is `null`/omitted — confirming the exposure layer is inert until catalog values are assigned

**Plans**: 2 plans

**Wave 1**

- [x] 54-01-PLAN.md — CLI exposure: *_effort siblings at all 20 init.cjs *_model sites + cmdResolveModel always-emit canonical `effort` (rename from reasoning_effort) + inertness tests [EXPOSE-01, EXPOSE-02]

**Wave 2** *(blocked on 54-01 — SDK mirrors the final CLI shape)*

- [x] 54-02-PLAN.md — SDK port: mirror effort precedence into config-query.ts resolveModel + static {claude,codex} allowlist + init *_effort siblings + extend golden parity harness with init-builder row [EXPOSE-03]

#### Phase 55: Catalog Schema + User Handover

**Goal**: The catalog schema/type widens to carry `model;effort` slot strings (Claude-built), then the user hand-assigns per-agent effort values across all 33 agents during an explicit execution handover
**Depends on**: Phase 54
**Requirements**: CATALOG-01, CATALOG-02, CATALOG-03
**⚠️ USER-HANDOVER BOUNDARY**: This phase contains a manual handover. Claude prepares the schema/type widening (CATALOG-01 in `model-catalog.json`, CATALOG-03 in the `sdk/src/model-catalog.ts` mirror) but does NOT auto-fill effort values. The user hand-assigns the per-agent `model;effort` values in `sdk/shared/model-catalog.json` and its TS mirror themselves (CATALOG-02), then hands back. Before handover, all plumbing is inert (every slot returns `effort: null`); after assignment, the first real integration test exercises live values.
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

### Phase 55.1: Update old tests found failing due to phase 55 work (INSERTED)

**Goal:** The ~201 pre-existing tests that fail due to Phase 55 catalog changes are back to green WITHOUT regressing real behavior — each failure cluster root-caused (stale expectation → update test; regression → fix source); `npm test` (root + SDK) passes with 0 failures.
**Requirements**: none mapped (test-reconciliation phase)
**Depends on:** Phase 55
**Plans:** 3/4 plans executed

**Wave 1**

- [x] 55.1-01-PLAN.md — Root-cause + fix codex model-leak SOURCE regression (cluster #1) + update stale _resolveAgentSlot literal

**Wave 2** *(both blocked on 55.1-01; no file overlap)*

- [x] 55.1-02-PLAN.md — Root-cause cluster #2 (D-08 bare-config back-compat) + realign expectations to hand-assigned slot effort + regenerate golden
- [x] 55.1-03-PLAN.md — Bulk-update 7 stale-literal test files (opus 4-8, codex effort, runtime tiers)

**Wave 3** *(blocked on 55.1-02 + 55.1-03)*

- [ ] 55.1-04-PLAN.md — Whole-suite gate: npm test (root + SDK) green, no skips, 55.1-VERIFICATION.md

#### Phase 56: Spawn-Template Wiring

**Goal**: Spawn templates across `agents/`, `commands/`, and `get-shit-done/workflows/` conditionally pass resolved effort to spawned agents, omitting it entirely when absent, while preserving all fork quality gates
**Depends on**: Phase 55 (catalog values assigned so the first integration test exercises live effort)
**Requirements**: SPAWN-01, SPAWN-02, SPAWN-03
**Plan-time verification**: Enumerate the spawn-template blocks before committing scope — grep `agents/*.md`, `commands/gsd/*.md`, `get-shit-done/workflows/*.md` for `subagent_type` + `model=` patterns to size the edit list (count not pre-enumerated by research).
**Success Criteria** (what must be TRUE):

  1. The verified Claude effort carrier (subagent frontmatter `effort:` vs an `Agent()` argument, resolved at plan time against the current Agent/Task API) is wired so resolved effort reaches spawned agents
  2. Spawn templates across `agents/`, `commands/`, and `get-shit-done/workflows/` pass effort conditionally, omitting it entirely when resolved effort is absent
  3. Spawn-template edits preserve every fork quality gate (agent-frontmatter 155/155, negative-framing 99/99, step-numbering 632/632, cross-file-refs 219/219, eta-include) — achieved by extending existing `model=` lines rather than renumbering steps

**Plans**: TBD

#### Phase 57: Install-Time Translation

**Goal**: `bin/install.js` translates canonical Claude effort to Codex `reasoning_effort` only at the Codex emit boundary, with each runtime materializing effort correctly at install time
**Depends on**: Phase 53 (resolver); independent of Phases 55–56 and may proceed in parallel after Phase 54
**Requirements**: INSTALL-01, INSTALL-02
**Success Criteria** (what must be TRUE):

  1. `bin/install.js` translates Claude `effort` to Codex `model_reasoning_effort` only at the Codex emit boundary; the runtime-agnostic resolver stays effort-format-neutral
  2. Effort materializes correctly per runtime at install time — Claude effort preserved, Codex translated (`max`→`xhigh`, haiku tier never `xhigh`), unsupported runtimes omit
  3. The omit guard is preserved — installing a bare (un-assigned) config produces zero effort emission in every runtime's output

**Plans**: TBD

#### Phase 58: Regression Coverage

**Goal**: A comprehensive regression suite locks in the additive-only guarantee — a pre-change golden snapshot proves bare configs resolve identically, parser fixtures cover all edge cases, and per-runtime omit/translate contracts hold, with `npm test` green and coverage maintained
**Depends on**: Phase 57 (and spans Phases 52–57)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):

  1. A pre-change golden snapshot of model resolution proves the change is additive — existing bare configs resolve identically before and after across all 33 agents and all profile variants
  2. Parser fixtures cover effort suffixes, bare models, and colon-containing provider IDs (e.g. `openrouter:anthropic/claude-opus` → effort null)
  3. Precedence and omit-contract tests pass per runtime: claude emits, codex translates with `max`→`xhigh`, all other runtimes omit
  4. Regression assertions use strict equality on parsed structures — no `indexOf`-as-boolean false-passes and no substring collisions on `medium`/`high`; each new test confirmed RED before its fix lands
  5. Full `npm test` passes with zero new regressions versus the pre-milestone baseline; ≥70% line coverage on `get-shit-done/bin/lib/*.cjs` maintained

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
| 55. Catalog Schema + User Handover | v2.1.0-e | 3/3 | Complete    | 2026-06-03 |
| 56. Spawn-Template Wiring | v2.1.0-e | 0/TBD | Not started | - |
| 57. Install-Time Translation | v2.1.0-e | 0/TBD | Not started | - |
| 58. Regression Coverage | v2.1.0-e | 0/TBD | Not started | - |

*v1.41.3 shipped 2026-05-19 — see `.planning/milestones/v1.41.3-ROADMAP.md`*
*v1.41.5 shipped 2026-05-24 — see `.planning/milestones/v1.41.5-ROADMAP.md`*
*v2.1.0-a shipped 2026-05-26 — see `.planning/milestones/v2.1.0-a-ROADMAP.md`*
*v2.1.0-c shipped 2026-05-29 — see `.planning/milestones/v2.1.0-c-ROADMAP.md`*
*v2.1.0-d shipped 2026-05-31 — see `.planning/milestones/v2.1.0-d-ROADMAP.md`*
*v2.1.0-e in progress — Phases 52–58, started 2026-05-31*
