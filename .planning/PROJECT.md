# GSD — Prompt-Engineered Fork

## What This Is

An opinionated fork of the GSD (Get Shit Done) framework that applies systematic prompt engineering improvements to all prompt content files: agents, commands, and workflows. The fork tracks `upstream/main` continuously — each upstream merge is followed by a modification pass that brings new and changed files into conformance with the fork's quality bar. The fork's standards, defined in `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` and `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md`, take precedence over upstream content decisions.

## Core Value

Every agent, command, and workflow file on `main` meets the fork's prompt engineering quality bar before it ships — upstream content additions are modified, not accepted verbatim.

## Shipped: v2.1.0-e Per-Agent Thinking Effort (2026-06-06)

Unified, Claude-first thinking-effort dimension encoded as `model;effort` labels (semicolon delimiter). 28 plans across 9 phases (plus 2 inserted triage phases). Core deliverables: `parseModelEffort` parser, unified `{claude, codex}` resolver with D-08 medium floor, 20 `*_effort` init siblings, catalog schema widened + 31 agents hand-assigned, spawn templates wired across all Group A/B workflows, install.js Codex emit boundary, 330-row golden snapshot + 365-test regression suite. npm test 8,243/8,255 pass. Full details: `.planning/milestones/v2.1.0-e-ROADMAP.md`.

## Shipped: v2.1.0-d Whole-Integer Step Numbering (2026-05-31)

Every step label across all prompt content files is a whole integer. Three new enforcement layers: `tests/step-numbering-scan.test.cjs` (decimal + letter-suffix + out-of-order detection, 632/632), `scripts/normalize-step-numbers.cjs` (cross-file-aware idempotent CLI with `--dry-run`), and `tests/cross-file-step-refs.test.cjs` (stale cross-file ref detector, 219/219). Quality gate: `npm test` 11,728 pass / 3 fail, negative-framing 99/99.

## Shipped: v2.1.0-c Install-Time Content Materialization (2026-05-29)

Every file installed by `bin/install.js` is now fully self-contained. Eta v4 is wired as the install-time template engine in both copy loops; all 82 source files converted from bare-line `@~/` static refs to `<%~ include() %>` tags. Zero unresolved references in any installed runtime — verified by `tests/install-eta-regression.test.cjs` (6/6) and full Claude install walk (TEST-01 with 27-entry `ALLOWED_INLINE_REFS`).

## Current Milestone: v2.1.0-f Testing Coverage Gaps

**Goal:** Close all behavioral and documentation testing gaps identified in the v2.1.0-e gap report before they accumulate into undetected regressions.

**Target features:**
- GAP-E: Effort wiring regression tests for 8 Group B workflows (audit-fix, diagnose-issues, code-review, code-review-fix, explore, import, ingest-docs, discuss-phase-assumptions)
- GAP-H: Submodule exclusion test asserting executor worktree guard does NOT fire for `.git/modules/...` paths
- GAP-K: Assertion that `gsd-debugger.md` contains hardened security paragraph ("untrusted user input")
- GAP-L: Assertion that `gsd-user-profiler.md` load_rubric step references the Eta-inlined rubric
- GAP-M1: Remove stale "Phase 48 RED expectation" comment from `step-numbering-scan.test.cjs`
- GAP-M2: Wire up skipped `debug-session-management.test.cjs` test to assert fork security language

## Requirements

### Validated

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

### Active

- [ ] GAP-E: Effort wiring tests for 8 Group B workflows added to `phase-56-effort-wiring.test.cjs`
- [ ] GAP-H: Submodule exclusion path asserted in `bug-3097-3099-executor-worktree-path-safety.test.cjs`
- [ ] GAP-K: Hardened debugger security paragraph asserted in `debug-session-management.test.cjs`
- [x] GAP-L: User-profiler Eta-inlined rubric reference asserted — Validated in Phase 62: rubric-inlining-coverage
- [ ] GAP-M1: Stale Phase 48 RED expectation comment removed from `step-numbering-scan.test.cjs`
- [ ] GAP-M2: Skipped debugger security test updated to assert fork language

### Out of Scope

- Changing GSD's core functionality or runtime behavior — fork is prompt content only
- Maintaining a separate changelog for every upstream-modified file — git history is the record
- Applying fork standards to `get-shit-done/templates/` — user-facing boilerplate, not AI prompts; both style standards and tag hierarchy are out of scope
- Applying fork standards to `get-shit-done/references/` — reference documents, not AI prompts; both style standards and tag hierarchy are out of scope
- Em-dash complement pattern (`do not X — use Y`) — replacement rule requires full positive rewrite; negative phrase must not remain; candidates deferred to future upstream merge pass
- Fixing DO NOT violations in `sdk/` or `tests/` — out of scan scope per `SCAN_DIRS` in the test file
- **XML tag hierarchy conversion** — requiring new/modified upstream files to use `<persona>` (agents), `<intent>` (commands), or `<objective>` (workflows) as primary directives is dropped from fork scope (2026-04-30). Existing converted files are preserved as-is; no further conversion work planned. See Key Decisions.

## Context

- **Branch**: `main` (fork branch); merges from `upstream/main` via `git merge upstream/main`
- **Fork standards references** (`.planning/references/`):
  - `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md` — comprehensive prompt engineering principles that define the fork's quality bar across structure, context, XML, CoT, and constraint patterns
  - `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` — condensed improvement checklist used during review and modification passes on upstream files
  - `.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md` — authoritative record of every category of change between `main` and upstream, with an upstream merge checklist and fork-owned files list
- **Plans playbook** (`plans/`): canonical plan for each recurring work type:
  - `.planning/fork_plans/A0-MERGE_UPSTREAM_CONFLICTS_V01.md` — full upstream merge lifecycle template
  - `.planning/fork_plans/B0-SYNC_CATALOGUE_V01.md` — CATALOGUE.json sync process
  - `.planning/fork_plans/C0-POSITIVE_FRAMING_PASS_V01.md` — positive framing pass across all prompt content files

- **Current state**: v2.1.0-e shipped 2026-06-06. Per-agent thinking effort fully wired: `parseModelEffort` parser, `resolveReasoningEffortInternal` unified `{claude, codex}` resolver (D-08 medium floor for bare slots), 20 `*_effort` init siblings, 31 capable agents with hand-assigned catalog effort, all spawn templates wired (Group A + B + 8 post-audit), install.js Codex translate boundary, 330-row golden snapshot + 365-test regression suite. `npm test` 8,243/8,255 pass. Negative-framing scanner 99/99. Step-numbering 632/632. Cross-file-step-refs 219/219. Historical milestone delivery records in `.planning/MILESTONES.md`.
- **Test suite**: `npm test` runs Node.js built-in test runner. `agent-frontmatter.test.cjs` is the critical gate — all agent YAML frontmatter is validated there. Fork-side tests: negative-framing-scan (99/99), ios-scaffold-safety (6/6), bug-1924-ensure-hooks-dist-on-demand (8/8), agent-frontmatter (155/155), execute-phase-wave (15/15), semver-compare (12/17 — 5 failing: HOOK-03 writeResult, HOOK-04 GitHub API), version-detection (2/4 — 2 failing: INST-01 git rev-parse, INST-02 no-network sentinel), debug-session-management (HDOC subtest intentionally skipped), qwen-install (16/16), read-injection-scanner (19/19).
- **File-writing agents** (those with `Write` in their tools list) must retain the string `Only use the Write tool` in their prompt body. Dynamic `FILE_WRITING_AGENTS` list used (WR-04: no longer hardcoded).
- **Scanner precedence**: When tests conflict with fork standards (e.g., test asserts for upstream negative-framing strings), modify the test to reflect fork behavior — established precedent in v1.36.0 Phase 3.
- **Tech debt note**: MERGE-02 verification command (`grep thamwangjun`) is now stale — Phase 12 WR-04 replaced the hardcoded fork URL with `{{GSD_REPO}}/{{GSD_BRANCH}}` templates. Functional intent (SHA equality check) remains satisfied. Verification should use `grep -i isNewer hooks/gsd-check-update-worker.js` going forward.

## Constraints

- **Frontmatter**: Agent YAML frontmatter (`name`, `description`, `tools`, `color`, `hooks`) must be preserved exactly — `agent-frontmatter.test.cjs` validates all agents on every `npm test` run
- **Test precedence**: Fork reference files take precedence; tests that assert for upstream-style negative framing are modified, not reverted
- **No `skills:` in agent frontmatter** — breaks Gemini CLI runtime; upstream sometimes adds this
- **Positive framing replacement rule**: Negative directives (`do not X`, `never X`, `avoid X`) are replaced with affirmative instructions that state what to do instead — the replacement must specify the correct behavior, not merely delete the prohibition

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fork reference files override upstream content decisions | Fork exists specifically to apply a different prompt quality bar | ✓ Good |
| Tests may be modified when they conflict with fork standards | Tests should verify fork behavior, not upstream behavior | ✓ Good |
| `plans/` is the canonical playbook for all recurring work types | Repeatable process across many upstream merges | ✓ Good |
| `<intent>` tag in command layer (not `<task>`) | Commands and workflows both land in the same context window; disambiguation prevents model confusion about which `<task>` is authoritative | ✓ Good — v1.37.1b: all 79 commands use `<intent>`, fork-intent-tag.test.cjs 79/79 pass |
| Scanner-first approach: run negative-framing scanner before any edit | Run negative-framing scanner before any edit; avoids unnecessary edits — only 8 violations found across 5 files from 193 upstream-modified files | ✓ Good — v1.37.1 Phase 9 |
| Preserve D-07 SECURITY `Never X — always Y` patterns verbatim | Paired negative + positive is a valid reframe pattern; converting it would degrade the instruction | ✓ Good |
| XML tag hierarchy conversion removed from fork scope | The four-level tag hierarchy (`<persona>`, `<intent>`, `<objective>`, `<task>`) is no longer a fork requirement for new or modified upstream files. Existing converted files are preserved. HIER-L1–L3 and TEST-L1–TEST-GATE requirements dropped. Motivation: overhead of enforcing tag standards on every upstream merge outweighs the benefit; positive framing and quality-bar improvements remain the fork's core value | ✓ Decided — 2026-04-30 |
| AUDIT-03 examined-and-found-none — no upstream test skips required | After Phase 30 fixes, 6-pattern grep across `tests/` showed all matches are test infrastructure only (assertion messages, scanner code), not upstream tests asserting for removed negative framing strings in prompt content. TEST-01 required zero `.skip` modifications. | ✓ Good — v1.38.6 |
| Manual read audit before scanner expansion | Phase 28 read all 217 files line-by-line before the scanner was expanded. This found 8 new violation patterns (prohibited ×7, forbidden ×1) that the existing scanner missed, giving Phase 29 a complete target list. Scanner-first would have missed these. | ✓ Good — v1.38.6 |
| Scanner-first confirmed again (v1.41.2): only 12 violations across 5 files from ~193 upstream-modified files | Running scanner before editing avoids unnecessary edits; consistent with v1.37.1 Phase 9 precedent. debug.md was pre-clean (FRAME-01 pre-satisfied) | ✓ Good — v1.41.3 |
| Bug #3242 cmdStateJson heuristic: `existingFm.progress.total_phases > built.progress.total_phases` detects curated cross-milestone progress | Discriminating heuristic avoids trampling curated STATE.md aggregates while preserving v1589 disk-freshness behavior. `Number()` coercion required because extractFrontmatter returns all YAML values as strings | ✓ Good — v1.41.3 |
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
| rawSlotForRuntime (pre-strip slot) in codex SDK path (EXPOSE-03 fix) | Stripping the tier alias before parseModelEffort returned null effort, allowing Codex per-tier built-in to override catalog intent; pre-strip read preserves catalog effort through the strip step | ✓ Good — v2.1.0-e b4bc8cc0 |

> Historical Key Decisions (implementation-specific, settled) are archived in .planning/PROJECT_HISTORY.md.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
---
---
*Last updated: 2026-06-08 after Phase 62 (rubric-inlining-coverage) complete*
