# GSD Fork — Project History

> This file is the historical archive extracted from `.planning/PROJECT.md`.
> It contains shipped milestones, the abandoned milestone, all validated requirements,
> and Key Decisions that have been fully settled and no longer guide future work.
> For active project state, see `.planning/PROJECT.md`.

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

---
*Archived from PROJECT.md — 2026-04-30*
