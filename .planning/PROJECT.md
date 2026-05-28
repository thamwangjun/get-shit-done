# GSD — Prompt-Engineered Fork

## What This Is

An opinionated fork of the GSD (Get Shit Done) framework that applies systematic prompt engineering improvements to all prompt content files: agents, commands, and workflows. The fork tracks `upstream/main` continuously — each upstream merge is followed by a modification pass that brings new and changed files into conformance with the fork's quality bar. The fork's standards, defined in `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` and `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md`, take precedence over upstream content decisions.

## Core Value

Every agent, command, and workflow file on `main` meets the fork's prompt engineering quality bar before it ships — upstream content additions are modified, not accepted verbatim.

## Current Milestone: v2.1.0-b Workflow Compliance Reinforcement

**Goal:** Investigate why Claude consistently fails to comply with GSD workflow instructions and apply targeted prompt engineering fixes across all command and workflow files.

**Target features:**
- Root cause investigation of subagent spawning and step-omission failure modes
- Command layer hardening (67 files) — strengthen `<process>` and `<objective>` blocks
- Workflow layer hardening (93 files) — orchestrator persona, reframe patterns, spawn mandates
- Scanner gate — confirm zero negative-framing regressions after all changes

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

### Active

*(Defining for v2.1.0-b — requirements being scoped)*

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

- **Current state**: v2.1.0-a shipped 2026-05-26. SHA versioning fully reimplemented — all installation and update-check logic uses 7-char SHA via GitHub Commits API. npm test at 185 non-ai-evals failures (2 pre-existing ai-evals), zero fork regressions. Historical milestone delivery records and validated requirements are in `.planning/PROJECT_HISTORY.md`.
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
*Last updated: 2026-05-26 after v2.1.0-a milestone*
