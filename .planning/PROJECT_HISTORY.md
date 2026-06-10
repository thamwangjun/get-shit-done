# GSD Fork — Project History

> This file is the historical archive extracted from `.planning/PROJECT.md`.
> It contains shipped milestones, the abandoned milestone, all validated requirements,
> and Key Decisions that have been fully settled and no longer guide future work.
> For active project state, see `.planning/PROJECT.md`.

## Shipped Milestone: v2.1.0-g Citation Cleanup ✓

**Shipped:** 2026-06-10
**Goal:** Remove all issue/PR-number citations from prompt content `.md` files across 5 scoped dirs; add permanent regression guard.

All issue/PR-number citations removed from prompt content `.md` files across 5 scoped dirs. Permanent regression guard `tests/no-issue-citations.test.cjs` added — covers `#NNN` inline, parenthetical, and feat-form patterns with two-tier allowlist (PLACEHOLDER_DIGITS + FILE_ALLOWLIST). TDD red→green: guard written RED (98 violations), corpus cleaned, guard GREEN (327/327). Post-milestone tightening via quick tasks 260610-gku (regex tightened, 7 agent files cleaned) and 260610-heg (two-tier allowlist refactor). `npm test` 9808 total / 9799 pass / 0 fail / 9 skipped. Full details: `.planning/milestones/v2.1.0-g-ROADMAP.md`.

## Shipped Milestone: v2.1.0-f Testing Coverage Gaps ✓

**Shipped:** 2026-06-08
**Goal:** Close all behavioral and documentation testing gaps from the v2.1.0-e gap report.

Test-only milestone — 5 phases (59–63), 5 plans, additive test code across four existing test files with no agent/workflow source changes: 8 Group B effort-wiring guards (`phase-56-effort-wiring.test.cjs`), submodule-exclusion guard scoped to `gsd-executor.md` `<task_commit_protocol>` (`bug-3097-3099-...test.cjs`), rubric-inlining guard for `gsd-user-profiler.md` and reactivated `gsd-debugger.md` hardened-security test (`debug-session-management.test.cjs`), and stale-comment removal (`step-numbering-scan.test.cjs`). `npm test` 9115 pass / 0 fail / 9 skipped. Full details: `.planning/milestones/v2.1.0-f-ROADMAP.md`.

## Shipped Milestone: v2.1.0-e Per-Agent Thinking Effort ✓

**Shipped:** 2026-06-06
**Goal:** Unified, Claude-first thinking-effort dimension encoded as `model;effort` labels (semicolon delimiter).

28 plans across 9 phases (plus 2 inserted triage phases). Core deliverables: `parseModelEffort` parser, unified `{claude, codex}` resolver with D-08 medium floor, 20 `*_effort` init siblings, catalog schema widened + 31 agents hand-assigned, spawn templates wired across all Group A/B workflows, install.js Codex emit boundary, 330-row golden snapshot + 365-test regression suite. npm test 8,243/8,255 pass. Full details: `.planning/milestones/v2.1.0-e-ROADMAP.md`.

## Shipped Milestone: v2.1.0-d Whole-Integer Step Numbering ✓

**Shipped:** 2026-05-31
**Goal:** Every step label across all prompt content files is a whole integer.

Three new enforcement layers: `tests/step-numbering-scan.test.cjs` (decimal + letter-suffix + out-of-order detection, 632/632), `scripts/normalize-step-numbers.cjs` (cross-file-aware idempotent CLI with `--dry-run`), and `tests/cross-file-step-refs.test.cjs` (stale cross-file ref detector, 219/219). Quality gate: `npm test` 11,728 pass / 3 fail, negative-framing 99/99.

## Shipped Milestone: v2.1.0-c Install-Time Content Materialization ✓

**Shipped:** 2026-05-29
**Goal:** Every file installed by `bin/install.js` is fully self-contained.

Eta v4 is wired as the install-time template engine in both copy loops; all 82 source files converted from bare-line `@~/` static refs to `<%~ include() %>` tags. Zero unresolved references in any installed runtime — verified by `tests/install-eta-regression.test.cjs` (6/6) and full Claude install walk (TEST-01 with 27-entry `ALLOWED_INLINE_REFS`).

## Abandoned Milestone: v1.37.1c Tag Hierarchy Completion ✗

**Archived:** 2026-04-29 (abandoned — 1/5 phases complete)
**Goal:** Implement and validate the full four-level XML tag hierarchy across all GSD prompt content files, using `upstream/v1.37.1` as the reference baseline.

**Completed before abandonment:**
- Phase 20 (Baseline Audit): `scripts/audit-tags.js` — 270 files across 5 levels inventoried, 146 anomalies documented; JSON + Markdown artifacts committed

**Requirements dropped (2026-04-30):** HIER-L1, HIER-L2, HIER-L3, TEST-L1, TEST-L2, TEST-L3, TEST-GATE, DOCS-01 — tag hierarchy conversion removed from fork scope entirely. See Key Decisions and Out of Scope.

## Shipped Milestone: v1.37.1b Fork Tag Corpus Tests ✓

**Shipped:** 2026-04-29
**Goal:** Add corpus-scan regression tests for the `<persona>` and `<intent>` XML tags, and convert all remaining `<objective>` command files to use `<intent>`.

**Delivered:**
- `tests/fork-persona-tag.test.cjs` — 62/62 subtests pass; guarded all 31 agents for `<persona>` presence and `<role>` absence *(deleted 2026-04-30 — requirement dropped)*
- `tests/fork-intent-tag.test.cjs` — 79/79 subtests pass; guarded all 79 command files for `<intent>` presence *(deleted 2026-04-30 — requirement dropped)*
- All 33 remaining `commands/gsd/*.md` files converted from `<objective>` to `<intent>` (Phase 19 CONVERT-01)
- Full test suite gate: 4304 pass, 2 pre-existing fails (qwen-install.test.cjs, unchanged)

## Shipped Milestone: v1.37.1a Do-Not Framing Pass ✓

**Shipped:** 2026-04-23
**Goal:** Fix all 14 bare "do not" directive violations surfaced by the new case-insensitive corpus scan, making the DO NOT corpus tests pass.

**Delivered:**
- 11 FRAMING violations fixed across agents, workflows, references, and commands (Phases 13–14)
- FRAMING-07–17 annotated in REQUIREMENTS.md with Fixed: before/after text (Phase 15)
- Test suite: 4168/4168 pass; corpus scan 4/4 DO NOT and 4/4 NEVER subtests green
- TEST-05 marked complete; v1.37.1a milestone closed

## Shipped Milestone: v1.37.1 Files ✓

**Shipped:** 2026-04-22
**Goal:** Merge upstream v1.37.1 into thamw-main and apply the fork's prompt engineering quality bar to all new and modified prompt files.

**Delivered:**
- Merged 55 upstream commits; all 3 critical fork patches (SHA equality worker, ensureHooksDist, positive-framing test) survived
- CATALOGUE.json expanded from 250→270 entries (20 new files across 4 categories)
- Fork standards applied to all 20 new files and scanner-identified modified files
- Test suite: 4142/4142 pass; `<persona>` rename applied to 24 agents
- 3 tech debt items resolved: TDZ bug in update worker, required_reading repair, positive-framing sweep (11 unpaired prohibitions across 9 files)

## Validated Requirements

### Validated

- ✓ **MERGE-01**: Fork branch `thamw-main` integrates all upstream v1.37.1 commits via merge commit 14ca3f4 — v1.37.1 Phase 7
- ✓ **CATALOGUE-01**: CATALOGUE.json in sync with all 20 v1.37.1 prompt content files (250→270 entries) — v1.37.1 Phase 8
- ✓ **FORK-01**: All 20 new v1.37.1 prompt files pass fork's positive framing and XML structure standards — v1.37.1 Phase 9
- ✓ **FORK-02**: All modified prompt files from v1.37.1 pass fork's positive framing standards (scanner-first, 8 violations fixed) — v1.37.1 Phase 9
- ✓ **TEST-01**: Full test suite 4142/4142 pass after merge and fork standards applied — v1.37.1 Phase 10
- ✓ **TEST-02**: All 31 fork agents within size-budget tiers — v1.37.1 Phase 10
- ✓ **TEST-03**: All 5 fork-specific test files pass — v1.37.1 Phase 10
- ✓ **TEST-04**: `<persona>` tag rename applied to 24 upstream-reverted agents — v1.37.1 Phase 10
- ✓ **DOC-01**: All 38 REQUIREMENTS.md checkboxes verified [x] with full traceability — v1.37.1 Phase 11
- ✓ **DOC-02**: Phase 08 Nyquist wave_0_complete confirmed; v1.37.1 audit corrected to overall: compliant — v1.37.1 Phase 11
- ✓ CATALOGUE.json synced with all prompt content files — Plan 00
- ✓ Full prompt engineering improvement pass: task spec, XML structure, context placement, priority ordering, persona review, CoT gating, constraint pairing, compression — Plan 01
- ✓ Anti-heredoc instructions simplified to positive-only form ("Only use the Write tool...") — Plan 02
- ✓ XML tags restored where dropped during the improvement pass — Plan 03
- ✓ `<task>` → `<intent>` rename in command layer to disambiguate from workflow `<task>` blocks — Plan 04
- ✓ Positive framing pass: all primary-directive negatives converted to affirmative instructions — Plan 05
- ✓ `/clear` pattern fixed in Next Up blocks (appears before the command, not after) — Plan A1
- ✓ Negative framing scan tests added to test suite
- ✓ CATALOGUE.json synced with 23 files added in v1.36.0 upstream merge (227 → 250 entries) — v1.36.0 Phase 1
- ✓ Fork standards (positive framing) applied to all 10 new v1.36.0 files — v1.36.0 Phase 2
- ✓ Fork standards (positive framing) applied to all 15 v1.36.0-modified files — v1.36.0 Phase 2
- ✓ Global boilerplate `Do NOT load full AGENTS.md files` replaced with positive form in 13 agents — v1.36.0 Phase 2
- ✓ `<available_agent_types>` block inserted in discuss-phase.md; agent-frontmatter tests 135/135 — v1.36.0 Phase 2
- ✓ Test suite aligned with fork standards: prohibition-check blocks removed, string literals updated — v1.36.0 Phase 3 (3933/3933 pass)
- ✓ **FIX-01**: `ensureHooksDist(src)` helper added to bin/install.js — on-demand build of hooks/dist/ triggered when absent — v1.36.0.b Phase 04
- ✓ **FIX-02**: Console notice printed when on-demand hooks build is triggered — v1.36.0.b Phase 05
- ✓ **FIX-03**: Regression test (8 tests) confirms hooks installed when dist/ absent — v1.36.0.b Phase 05
- ✓ **HOOK-01**: SHA-match → "GSD is up to date" in statusline — v1.36.0.a Phase 4/6
- ✓ **HOOK-02**: SHA-mismatch → update notification — v1.36.0.a Phase 4/6
- ✓ **HOOK-03**: `gsd-check-update-worker.js` runs without ReferenceError — v1.36.0.a Phase 4/6
- ✓ **HOOK-04**: Worker fetches from fork's GitHub repo (thamwangjun/get-shit-done, thamw-main) — v1.36.0.a Phase 4/6
- ✓ **INST-01**: VERSION file always contains a 7-char hex SHA after successful installation — v1.36.0.a Phase 5
- ✓ **INST-02**: Offline install writes `no-network` sentinel (not semver) so version detection never silently breaks — v1.36.0.a Phase 5
- ✓ **UPD-01**: Update workflow "already on latest" path enabled; code path verified by static analysis (live E2E unverified — deferred) — v1.36.0.a Phase 5
- ✓ **UPD-02**: Version comparison executes in a single bash context; variable state preserved — v1.36.0.a Phase 5
- ✓ **FRAMING-01**: All 6 bare "do not" directives in agent files replaced with affirmative equivalents; corpus scanner agent-files subtest passes — Phase 13
- ✓ **FRAMING-02**: All bare "do not" directives in workflow files replaced with affirmative instructions — Phase 14
- ✓ **FRAMING-03**: All bare "do not" directives in reference files replaced with affirmative instructions — Phase 14
- ✓ **FRAMING-04**: All bare "do not" directives in command files replaced with affirmative instructions — Phase 14
- ✓ **TEST-05**: Full test suite gate — 4168/4168 pass, 0 failures; corpus scan 4/4 DO NOT and 4/4 NEVER subtests green — Phase 15
- ✓ **NYQUIST-16**: VALIDATION.md records created/finalized for Phases 13, 14, and 15 with nyquist_compliant: true — Phase 16
- ✓ **PERSONA-01**: `tests/fork-persona-tag.test.cjs` — 62/62 subtests pass; all 31 agents guarded for `<persona>` presence and `<role>` absence — v1.37.1b Phase 18
- ✓ **INTENT-01**: `tests/fork-intent-tag.test.cjs` — 79/79 subtests pass; all 79 command files guarded for `<intent>` presence — v1.37.1b Phase 18
- ✓ **TEST-GATE-01**: Full suite gate at 4304 pass, 2 pre-existing fails, 0 new failures — v1.37.1b Phase 18
- ✓ **CONVERT-01**: All 79 `commands/gsd/*.md` files pass `fork-intent-tag.test.cjs`; all `<objective>` tags converted to `<intent>` — v1.37.1b Phase 19
- ✓ **AUDIT-01**: Baseline audit complete — all 270 in-scope files across 5 levels inventoried against `upstream/v1.37.1`; 146 anomalies documented in JSON + Markdown artifacts before any conversion began — v1.37.1c Phase 20

### Validated (v1.37.2 – v2.1.0-g)

- ✓ SCAN-01: Scanner detects bare `avoid [verb]` directives — v1.37.2
- ✓ SCAN-02: Scanner detects bare `don't [verb]` directives via `isFactualDont()` helper — v1.37.2
- ✓ SCAN-03: Scanner detects `<anti_patterns>` tag usage (deduped to 1 violation per block) — v1.37.2
- ✓ SCAN-04: New hard-failure subtests verified RED against unmodified upstream before any file edits — v1.37.2
- ✓ SCAN-05: Scanner detects bare `must not` / `MUST NOT` directives — v1.37.2
- ✓ SCAN-06: Scanner detects bare `should not` / `should NOT` directives — v1.37.2
- ✓ SCAN-07: Scanner detects `cannot` directives (warn-only) — v1.37.2
- ✓ SCAN-08: Scanner detects `won't` directives (warn-only) — v1.37.2
- ✓ SCAN-09: Scanner detects `will not` directives (warn-only) — v1.37.2
- ✓ FIX-01: All `agents/*.md` files pass expanded scanner with 0 violations and 0 warnings — v1.37.2
- ✓ FIX-02: All `commands/gsd/*.md` files pass expanded scanner with 0 violations and 0 warnings — v1.37.2
- ✓ FIX-03: All `get-shit-done/workflows/*.md` files pass expanded scanner with 0 violations and 0 warnings — v1.37.2
- ✓ FIX-04: Every negative directive replaced with affirmative instruction specifying correct behavior — v1.37.2
- ✓ GATE-01: Full `npm test` suite passes after all fixes with 0 regressions (4183/4184 pass, 1 intentional skip) — v1.37.2
- ✓ AUDIT-01: All `agents/`, `commands/gsd/`, and `get-shit-done/workflows/` files read line-by-line for negative framing violations — v1.38.6
- ✓ AUDIT-02: Audit inventory produced with file, line, violation text, and violation category for every finding (182 violations across 67 files) — v1.38.6
- ✓ SCAN-10: Scanner expanded with new detection branches (`prohibited`, `forbidden`) for patterns found in audit not yet covered — v1.38.6
- ✓ SCAN-11: All new scanner subtests verified RED against unmodified corpus before any fixes applied (4 corpus subtests failing) — v1.38.6
- ✓ FIX-05: All `agents/` files pass expanded scanner at 0 violations and 0 warnings — v1.38.6
- ✓ FIX-06: All `commands/gsd/` files pass expanded scanner at 0 violations and 0 warnings — v1.38.6
- ✓ FIX-07: All `get-shit-done/workflows/` files pass expanded scanner at 0 violations and 0 warnings — v1.38.6
- ✓ FIX-08: Every negative directive replaced with affirmative instruction specifying correct behavior — v1.38.6
- ✓ AUDIT-03: Post-fix test run examined-and-found-none — zero upstream test assertions conflicting with fork framing strings — v1.38.6
- ✓ TEST-01: No `.skip` modifications required — zero conflicting assertions found — v1.38.6
- ✓ GATE-02: Full `npm test` suite passes after all fixes (5705/5706 pass, 0 fail, 1 intentional HDOC skip) — v1.38.6
- ✓ HOOKS-01: `gsd-update-banner.js` added to MANAGED_HOOKS in `hooks/gsd-check-update-worker.js` — v1.41.3
- ✓ TEST-02: Windows npm spawn tests skipped with `describe.skip` in `gsd-check-update-worker-platform-gate.test.cjs` — v1.41.3
- ✓ PATH-01: `phase-30-affirmative-replacements.test.cjs` references correct `extract-learnings.md` path (hyphen) — v1.41.3
- ✓ FRAME-01: `get-shit-done/workflows/debug.md` passes negative-framing scanner at 0 violations, 0 warnings — v1.41.3
- ✓ FRAME-02: `get-shit-done/workflows/reapply-patches.md` passes negative-framing scanner at 0 violations, 0 warnings — v1.41.3
- ✓ SCAN-12: Negative-framing scanner run across all upstream v1.41.2 changed files; 0 unaddressed violations — v1.41.3
- ✓ GATE-03: Full `npm test` suite passes at 8306 pass, 0 fail, 1 intentional HDOC skip — v1.41.3
- ✓ MERGE-01: `thamw-main` fast-forwarded to `thamw-v1.41.3` after GATE-03 — v1.41.3
- ✓ GITOPS-01: Local branch backup and physical directory backup created before history refactor — v1.41.5
- ✓ GITOPS-02: Soft reset HEAD to `v1.41.2` with all modifications preserved unstaged — v1.41.5
- ✓ STAGE-01: Batch 1 committed — rules and configuration files — v1.41.5
- ✓ STAGE-02: Batch 2 committed — scanner logic and audit scripts — v1.41.5
- ✓ STAGE-03: Batch 3 committed — workflows, agents, commands, templates — v1.41.5
- ✓ STAGE-04: Batch 4 committed — core tests and SDK validation — v1.41.5
- ✓ STAGE-05: Batch 5 committed — maintenance, logs, state files — v1.41.5
- ✓ VALID-01: Zero-diff parity confirmed (10 allowlisted files, zero unexpected divergence) — v1.41.5
- ✓ VALID-02: npm test 8392 pass, 2 pre-existing failures (zero regression vs backup branch) — v1.41.5
- ✓ HOOK-01: `gsd-check-update-worker.js` SHA `isNewer()` with `latest.slice(0,7) !== installed` — v2.1.0-a
- ✓ HOOK-02: Worker fetches latest SHA via GitHub Commits API (not npmjs.com) — v2.1.0-a
- ✓ HOOK-03: Worker `function writeResult()` calls `isNewer()` and writes result cache — v2.1.0-a
- ✓ HOOK-04: `{{GSD_REPO}}` and `{{GSD_BRANCH}}` template placeholders in worker source — v2.1.0-a
- ✓ HOOK-05: Worker has no npmjs.com or npm package name references — v2.1.0-a
- ✓ INST-01: `bin/install.js` writes 7-char SHA via `git rev-parse --short=7 HEAD` — v2.1.0-a
- ✓ INST-02: `'no-network'` sentinel fallback when git unavailable — v2.1.0-a
- ✓ INST-03: `{{GSD_REPO}}`/`{{GSD_BRANCH}}` template replacements in hook files at install time — v2.1.0-a
- ✓ INST-04: `{{GSD_VERSION}}` in hook headers populated with SHA (not `pkg.version`) — v2.1.0-a
- ✓ STAT-01: `gsd-statusline.js` `parseV()` semver dev-install block removed — v2.1.0-a
- ✓ STAT-02: Stale hooks → simplified SHA mismatch display only — v2.1.0-a
- ✓ UPD-01: `check-latest-version.cjs` fetches GitHub Commits API SHA — v2.1.0-a
- ✓ UPD-02: `update.md` SHA comparison + simplified changelog (GitHub link) — v2.1.0-a
- ✓ TEST-01: `semver-compare.test.cjs` 17/17 pass — v2.1.0-a
- ✓ TEST-02: `version-detection.test.cjs` 4/4 pass — v2.1.0-a
- ✓ TEST-03: `bug-2992-check-latest-version.test.cjs` SHA-based assertions 9/9 pass — v2.1.0-a
- ✓ GATE-01: Full `npm test` 0 regressions beyond 2 pre-existing ai-evals failures — v2.1.0-a
- ✓ INTG-01: Eta v4 wired as install-time engine with default `<%`/`%>` delimiters, `autoEscape: false`, `useWith: true`, `views` = repo root — v2.1.0-c
- ✓ INTG-02: All 82 source files converted from bare-line `@~/` static refs to `<%~ include() %>` Eta tags; post-conversion grep returns 0 survivors — v2.1.0-c
- ✓ INTG-03: Runtime `.planning/` bare-line refs in agents layer converted to `` !`cat .planning/X` `` form — v2.1.0-c
- ✓ INTG-04: Eta renderer wired into `copyWithPathReplacement()` and `wrappedConverter` (skills path); all 11 skills-based runtimes render `<%~ include()` at install time — v2.1.0-c
- ✓ INTG-05: Eta renderer wired into agent install loop as first transform step — v2.1.0-c
- ✓ INTG-06: Skills path (`applyRuntimeContentRewritesInPlace`) confirmed as not requiring renderer — `SKILL.md` files contain 0 install-time include refs — v2.1.0-c
- ✓ TEST-01: Full Claude install walk with 27-entry `ALLOWED_INLINE_REFS`; TEST-01 also detects `<%~` survivors in installed output — v2.1.0-c
- ✓ TEST-02: Conditional `@~` expression in `execute-phase.md` preserved verbatim in installed output — v2.1.0-c
- ✓ TEST-04: Circular include detection verified by regression test — v2.1.0-c
- ✓ TEST-05: Missing-file handling verified by regression test — v2.1.0-c
- ✓ GATE-01: Full `npm test` 7459/49 (better than pre-milestone baseline 7458/50) — v2.1.0-c
- ✓ GATE-02: Negative-framing scanner passes at 99/99 after all edits — v2.1.0-c
- ✓ GATE-03: Zero unresolved `@~/.claude/` refs in fresh install across all runtimes; skills path `<%~` gap closed by Phase 47.1 — v2.1.0-c
- ✓ SCAN-01: `tests/step-numbering-scan.test.cjs` detects decimal step labels in agents, commands, and workflows — v2.1.0-d
- ✓ SCAN-02: Scanner detects out-of-order step numbering — v2.1.0-d
- ✓ MAP-01: Pre-normalization cross-file step reference index produced before renaming — v2.1.0-d
- ✓ NORM-01: All violating files renumbered to sequential whole integers; cross-refs co-updated — v2.1.0-d
- ✓ NORM-02: `scripts/normalize-step-numbers.cjs` cross-file-aware idempotent CLI with `--dry-run` — v2.1.0-d
- ✓ XREF-01: `tests/cross-file-step-refs.test.cjs` detects stale cross-file step references — v2.1.0-d
- ✓ GATE-01: `npm test` 11,728 pass / 3 fail, negative-framing 99/99 — v2.1.0-d
- ✓ PARSE-01: `parseModelEffort` semicolon-delimiter parser with 5-token allowlist and one-time typo warning — v2.1.0-e
- ✓ PARSE-02: Bare model strings return `effort: null` (backward-compatible) — v2.1.0-e
- ✓ PARSE-03: Shared `_resolveAgentSlot` helper eliminates model/effort divergence class — v2.1.0-e
- ✓ PARSE-04: `parseModelEffort` mirrored in SDK with shared parity fixture — v2.1.0-e
- ✓ RESOLVE-01: Static `{claude, codex}` allowlist lifts Claude gate (replaces data-derived expression) — v2.1.0-e
- ✓ RESOLVE-02: Effort precedence chain: override → slot → D-08 medium floor — v2.1.0-e
- ✓ RESOLVE-03: Profile-slot effort overrides Codex per-tier; per-tier is fallback — v2.1.0-e
- ✓ RESOLVE-04: `max`→`xhigh` on Codex; never `xhigh` for haiku tier — v2.1.0-e
- ✓ RESOLVE-05: Non-`{claude, codex}` runtimes always omit effort — v2.1.0-e
- ✓ RESOLVE-06: `inherit` profile and bare adaptive entries omit effort — v2.1.0-e
- ✓ CONFIG-01/02/03/04: `model;effort` accepted in all 3 config override sites with malformed-token warning — v2.1.0-e
- ✓ CATALOG-01/02/03: Catalog schema widened; 31 capable agents hand-assigned; SDK mirror widened — v2.1.0-e
- ✓ EXPOSE-01/02/03: 20 `*_effort` init siblings, `cmdResolveModel` canonical effort, SDK/CLI parity — v2.1.0-e
- ✓ SPAWN-01/02/03: Spawn templates wired (17 Group A + 8 Group B + debug-session-manager + 8 additional); D-08 floor; fork quality gates preserved — v2.1.0-e
- ✓ INSTALL-01/02: install.js Codex emit seam redirected; per-runtime effort materialization correct — v2.1.0-e
- ✓ TEST-01/02/03/04/05: 330-row golden snapshot, 14-case parser fixture, 365-test regression suite; npm test 8,243/8,255 — v2.1.0-e
- ✓ DOC-01: Stale "Phase 48 RED expectation" comment removed from `step-numbering-scan.test.cjs` — v2.1.0-f
- ✓ EWC-01..08: Effort-wiring regression tests for 8 Group B workflows added to `phase-56-effort-wiring.test.cjs` — v2.1.0-f
- ✓ WSC-01: Submodule-exclusion path asserted in `bug-3097-3099-executor-worktree-path-safety.test.cjs` — v2.1.0-f
- ✓ RIC-01: User-profiler Eta-inlined rubric reference asserted in `debug-session-management.test.cjs` — v2.1.0-f
- ✓ SFC-01: Reactivated `gsd-debugger.md` hardened-security test ("untrusted user input" / "evidence data only") — v2.1.0-f
- ✓ CITE-01: Exploration audit identified all citation formats (`#NNN`, `feat-NNNN`, parenthetical) in the 5 scoped dirs — v2.1.0-g
- ✓ CITE-02: Permanent guard test `tests/no-issue-citations.test.cjs` runs under `npm test` with two-tier allowlist — v2.1.0-g
- ✓ CITE-03: All `#NNN`-form citations removed from all 5 scoped dirs — v2.1.0-g
- ✓ CITE-04: All feat-form citations removed; word-form "issue NNNN" not present in corpus — v2.1.0-g
- ✓ CITE-05: Cleaned sentences read naturally; no orphaned punctuation, double spaces, or dangling connectors — v2.1.0-g
- ✓ CITE-06: `npm test` 9808 total / 9799 pass / 0 fail; guard GREEN 327/327; all content tests unaffected — v2.1.0-g

## Historical Key Decisions

> These decisions are archived because they were specific to completed implementation work. They no longer actively constrain future upstream merge cycles.

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use `spawnSync` (not `execSync`) for on-demand hooks build | `stdio: pipe` suppresses build stdout while capturing stderr for error reporting; clean exit-code check via `result.status` without try/catch | ✓ Good — v1.36.0.b Phase 04 |
| `require('child_process')` scoped inside `ensureHooksDist` function body | Avoids conflict with the existing `execSync` try-block at module scope (line 61); module cache makes this cost-free | ✓ Good — v1.36.0.b Phase 04 |
| Helper call site placed before the `if (!isCodex && ...)` block | Both Claude and Codex copy paths benefit from guaranteed hooks/dist/ without duplicating the build trigger | ✓ Good — v1.36.0.b Phase 04 |
| Serial test isolation via `SERIAL_FILES` in run-tests.cjs | Tests that rename/restore `hooks/dist/` (shared mutable state) must not run concurrently with other files that spawn installer subprocesses | ✓ Good — v1.36.0.b Phase 05 |
| Outer `describe({ concurrency: false })` wrapper in test file | Node test runner with `--test-concurrency=4` runs top-level describe blocks concurrently within a file; wrapper serializes FIX-01 and FIX-02 blocks | ✓ Good — v1.36.0.b Phase 05 |
| Retain `isNewer` function name with SHA equality body in worker | Minimal diff; avoids renaming callers | ✓ Good — v1.36.0.a |
| Replace GitHub API curl in install.js with `git rev-parse --short=7 HEAD` | Eliminates network dependency at install time; simpler and more reliable | ✓ Good — v1.36.0.a |
| Offline fallback writes `no-network` sentinel (not semver) | Ensures downstream version checks always detect an invalid state rather than silently treating semver as a valid SHA | ✓ Good — v1.36.0.a |
| Clear `~/.cache/gsd/gsd-update-check.json` in update.md after successful update | Fixes stale statusline indicator; shared OS cache path confirmed as single location | ✓ Good — v1.36.0.a |
| UPD-01 accepted as partial at milestone close | Live E2E run requires interactive install; static analysis confirms code path is correct; deferred to future validation | Deferred — v1.36.0.a |
| FORK-CORRUPTION classification (vs UPSTREAM-INTRODUCED) at merge triage | Pre-merge fork files had passing content; upstream merge replaced them with versions lacking fork instructions — fix immediately, not in Phase 9 | ✓ Good — v1.37.1 Phase 7 |
| `<role>` → `<persona>` rename for 24 agents | Upstream reverted the fork's structural change; Phase 10 re-applied it to restore agent-frontmatter.test.cjs passing state | ✓ Good — v1.37.1 Phase 10 |
| Dynamic `FILE_WRITING_AGENTS` list replacing hardcoded fork URL (WR-04) | Hardcoded `thamwangjun/get-shit-done` in worker broke update-check for any fork fork; dynamic template is future-proof | ✓ Good — v1.37.1 Phase 12 |
| MERGE-02 verification command accepted as stale at close | grep thamwangjun returns 0 post-WR-04; intent (SHA equality) remains satisfied by isNewer() + semver-compare tests | Accepted — v1.37.1 close |
| FRAMING-11 and FRAMING-12 deleted rather than rewritten | `**Stop here.**` gate in transition.md already covered the intent; adding a redundant positive instruction would have been noise | ✓ Good — v1.37.1a Phase 14 |
| Scope corpus scan subtests by directory across two phases | Phase 13 adds agent subtest, Phase 14 adds workflow/reference/command subtests — incremental gating matches incremental work | ✓ Good — v1.37.1a |
| `isConditionalOrFactual` improved with broader verb set and relative clause detection | Phase 17 WR-01: scanner was misclassifying conditional `do not` patterns with factual verbs; broader list + relative clause heuristic reduces false negatives without breaking corpus tests | ✓ Good — v1.37.1a Phase 17 |
| `<objective>` → `<intent>` conversion for 33 command files | All command files now use the fork's `<intent>` tag standard; closes loop on INTENT-01 from Phase 18; mechanical find-and-replace only (no content changes) | ✓ Good — Phase 19 |
| v1.37.1c milestone abandoned after Phase 20 (Baseline Audit only) | Hierarchy completion goal remains valid; baseline audit artifact (270-file inventory) committed and preserved; work deferred to next milestone rather than forced through | Deferred — v1.37.1c close |
| Global boilerplate replacement done in one sweep across all 13 affected agents | Single consistent replacement ensures uniformity; file-by-file approach would risk inconsistent phrasing | ✓ Good |
| Modify tests when they conflict with fork standards, not revert fork changes | Tests should validate fork behavior; reverting Phase 2 changes to fix tests would undo the milestone goal | ✓ Good |
| AUDIT-03 examined-and-found-none — no upstream test skips required | After Phase 30 fixes, 6-pattern grep across `tests/` showed all matches are test infrastructure only (assertion messages, scanner code), not upstream tests asserting for removed negative framing strings in prompt content. TEST-01 required zero `.skip` modifications. | ✓ Good — v1.38.6 |
| Manual read audit before scanner expansion | Phase 28 read all 217 files line-by-line before the scanner was expanded. This found 8 new violation patterns (prohibited ×7, forbidden ×1) that the existing scanner missed, giving Phase 29 a complete target list. Scanner-first would have missed these. | ✓ Good — v1.38.6 |
| Scanner-first confirmed again (v1.41.2): only 12 violations across 5 files from ~193 upstream-modified files | Running scanner before editing avoids unnecessary edits; consistent with v1.37.1 Phase 9 precedent. debug.md was pre-clean (FRAME-01 pre-satisfied) | ✓ Good — v1.41.3 |
| Bug cmdStateJson heuristic: `existingFm.progress.total_phases > built.progress.total_phases` detects curated cross-milestone progress | Discriminating heuristic avoids trampling curated STATE.md aggregates while preserving disk-freshness behavior. `Number()` coercion required because extractFrontmatter returns all YAML values as strings | ✓ Good — v1.41.3 |
| Test updates for fork framing: tests asserting upstream negative-framing strings updated to verify fork affirmative forms | Consistent with v1.36.0/v1.38.6 precedent — "tests should verify fork behavior, not upstream behavior." Applied in Phase 33 to bug-3320 and edit-phase tests | ✓ Good — v1.41.3 |
| Self-verifying batch staging scripts (`scripts/stage-batch-N.cjs`): each script validates staged file list against expected set before committing | Avoids staging accidents when manually curating 700+ changed files across 5 logical batches — validation at script-level catches set mismatches before commit | ✓ Good — v1.41.5 |
| D-03 allowlist accepted for parity diff: 10 files legitimately differ from original tree (staging scripts created during refactor, Nyquist tests added retroactively, ignore-file tweaks) | Zero-diff parity gate must account for files created during the refactor process itself; allowlist documents the exception clearly | ✓ Good — v1.41.5 |
| SHA equality comparison (`isNewer`: `latest.slice(0,7) !== installed`) — no semver ordering required | SHAs have no inherent ordering; equality check is the right semantic for "am I current?" | ✓ Good — v2.1.0-a |
| GitHub Commits API (`api.github.com/repos/thamwangjun/get-shit-done/commits/main`) instead of npmjs.com | Update check tied to fork repo SHA, not npm package version — decoupled from publishing cadence | ✓ Good — v2.1.0-a |
| Changelog extraction removed from update.md; GitHub commits link substituted | Changeset CLI `extract` requires semver ranges; SHA ranges not supported — GitHub link is simpler and always accurate | ✓ Good — v2.1.0-a |
| `check-latest-version.cjs` injectable request seam (`opts.request`) | Enables deterministic unit tests without network; avoids subprocess spawning in tests | ✓ Good — v2.1.0-a |
| `{{GSD_REPO}}`/`{{GSD_BRANCH}}` placeholders in worker source, hardcoded in check-latest-version.cjs | Worker is a hook file processed by installer's template engine; cjs module is not — asymmetry is intentional and documented | ✓ Good — v2.1.0-a |
| Pivot from custom `resolveIncludes()` (Phase 44) to Eta v4 (Phase 45) as install-time template engine | Eta v4 is a production-grade zero-config engine with proper include resolution; custom resolver had growing edge-case complexity | ✓ Good — v2.1.0-c |
| Use Eta default `<%`/`%>` delimiters (not custom `{%~`/`~%}`) | Custom delimiters caused double-processing artifacts when files passed through both installer and Eta; defaults with `autoEscape: false` resolved all issues | ✓ Good — v2.1.0-c Phase 46 |
| Insert Phase 47.1 after audit found skills-path gap | Integration audit (post-Phase 47) found `wrappedConverter` in `runtime-artifact-layout.cjs` did not call `renderEtaContent`; inserted phase rather than treating as tech debt | ✓ Good — v2.1.0-c |
| Drop TEST-06 (installed agent size budgets) and descope TEST-03 (Copilot tool-name transformation) | Size varies by platform/profile (no testing value); tool-name transformation is orthogonal to Eta include resolution | ✓ Good — v2.1.0-c |
| Step-numbering scanner with TDD red gate (write test first, confirm RED against unmodified corpus) | Consistent with v1.38.6/v1.41.3 scanner-first precedent — avoid unnecessary edits by enumerating violations before fixing | ✓ Good — v2.1.0-d |
| Letter-suffix steps (Step 7a, Step 2a) are violations — treated as Pattern A/B decimal equivalents | Letter suffixes are functionally decimal sub-steps; the scanner's STEP_DECIMAL_RE requires `(?:\.\d\|[a-z])` alternation | ✓ Good — v2.1.0-d |
| Pattern C files (`plan-phase.md`, `new-milestone.md`, `new-project.md`) explicitly excluded — `## N.N.` headings without "Step" keyword | Different semantic pattern (section numbering vs step labeling); separate scope decision for future milestone | ✓ Good — v2.1.0-d |
| `normalize-step-numbers.cjs` uses dynamic corpus grep (discoverCrossFileRefs) rather than consuming static MAP-01 index at runtime | Dynamic discovery is strictly more capable — handles any corpus state including future upstream merges; static index was Phase 49 scaffolding | ✓ Good — v2.1.0-d |
| `scanForOutOfOrder` strip-then-match anchor: strip list markers/blockquotes before matching `Step N` pattern | List-marker and blockquote prefixed step labels exist in the corpus; G-01 limitation test flipped from asserting failure to asserting detection | ✓ Good — v2.1.0-d |
| Cross-file ref scanner only validates whole-integer refs (`(\d+)`), not decimal | Decimal cross-file refs are the normalize script's domain; this scanner locks in the invariant for whole-integer integrity after normalization | ✓ Good — v2.1.0-d |
| Semicolon delimiter for `model;effort` (not colon) | Provider IDs legitimately contain colons (e.g., `openrouter:anthropic/claude-opus`); `;` is unambiguous as effort delimiter | ✓ Good — v2.1.0-e |
| Static `{claude, codex}` allowlist replaces data-derived RUNTIMES_WITH_REASONING_EFFORT | Data-derived form auto-admits future runtimes gaining `reasoning_effort`; static allowlist is explicit and auditable | ✓ Good — v2.1.0-e |
| D-08: bare `{claude, codex}` slots floor to `medium` (not omit) | Omission was effectively "leave thinking to default" which is non-deterministic; medium is a principled safe floor for both claude and codex | ✓ Good — v2.1.0-e Phase 56 |
| `effort=` argument on `Agent()` calls as carrier convention (not frontmatter) | `Agent()` argument is forward-compatible with per-invocation effort support when Claude Code confirms it; frontmatter `effort:` would contradict D-01 and cannot vary per-spawn-site | ✓ Good — v2.1.0-e Phase 56 D-01 |
| CATALOG-02 user-handover boundary: Claude widens schema, user assigns effort values | Higher effort is not monotonically better; documented overthinking regressions; user knows their agent workload profiles better | ✓ Good — v2.1.0-e Phase 55 |
| Phases 55.1 + 55.2 inserted as urgent triage (not planned) | 201 root + 17 SDK test failures from catalog changes blocked forward progress; insertion is the GSD pattern for urgent blockers | ✓ Good — v2.1.0-e |
| rawSlotForRuntime (pre-strip slot) in codex SDK path (EXPOSE-03 fix) | Stripping the tier alias before parseModelEffort returned null effort, allowing Codex per-tier built-in to override catalog intent; pre-strip read preserves catalog effort through the strip step | ✓ Good — v2.1.0-e |

---
*Archived from PROJECT.md — updated 2026-06-10 (shipped milestones v2.1.0-c through v2.1.0-g, 106 validated requirements v1.37.2–v2.1.0-g, and 29 implementation-specific Key Decision rows added)*
