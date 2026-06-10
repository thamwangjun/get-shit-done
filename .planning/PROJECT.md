# GSD — Prompt-Engineered Fork

## What This Is

An opinionated fork of the GSD (Get Shit Done) framework that applies systematic prompt engineering improvements to all prompt content files: agents, commands, and workflows. The fork tracks `upstream/main` continuously — each upstream merge is followed by a modification pass that brings new and changed files into conformance with the fork's quality bar. The fork's standards, defined in `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` and `.planning/references/PROMPT_ENGINEERING_GUIDE_V09.md`, take precedence over upstream content decisions.

## Core Value

Every agent, command, and workflow file on `main` meets the fork's prompt engineering quality bar before it ships — upstream content additions are modified, not accepted verbatim.

## Shipped Versions

- v2.1.0-g (2026-06-10) — Citation Cleanup: all issue/PR citations removed; `no-issue-citations.test.cjs` guard added (327/327)
- v2.1.0-f (2026-06-08) — Testing Coverage Gaps: additive test coverage across 5 phases/plans; 9115 pass / 0 fail
- v2.1.0-e (2026-06-06) — Per-Agent Thinking Effort: `model;effort` labels, unified resolver, 31 agents hand-assigned, 365-test suite
- v2.1.0-d (2026-05-31) — Whole-Integer Step Numbering: scanner, normalizer, cross-file-ref detector; 11,728 pass
- v2.1.0-c (2026-05-29) — Install-Time Content Materialization: Eta v4 wired, 82 source files converted, zero unresolved refs

Full milestone summaries are archived in `.planning/PROJECT_HISTORY.md` (Shipped Milestone section).

## Current Milestone: Planning Next

**Next:** Run `/gsd-new-milestone` to start next milestone cycle (questioning → research → requirements → roadmap).

## Requirements

### Validated

106 validated requirements spanning v1.37.2 → v2.1.0-g, covering scanner expansion (SCAN-01–12), negative-framing fixes (FIX-01–08), git-ops and hook wiring (HOOKS-01, GITOPS-01–02, STAGE-01–05), SHA/version detection (HOOK-01–05, INST-01–04, STAT-01–02, UPD-01–02), Eta install-time materialization (INTG-01–06), step-numbering enforcement (SCAN-01–02, MAP-01, NORM-01–02, XREF-01), per-agent effort wiring (PARSE-01–04, RESOLVE-01–06, CONFIG-01–04, CATALOG-01–03, EXPOSE-01–03, SPAWN-01–03, INSTALL-01–02, TEST-01–05), testing coverage (DOC-01, EWC-01–08, WSC-01, RIC-01, SFC-01), and citation cleanup (CITE-01–06).

Full per-requirement validation records are archived in `.planning/PROJECT_HISTORY.md` (Validated Requirements section).

### Active

(None — ready for next milestone)

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
*Last updated: 2026-06-10 after v2.1.0-g milestone complete*
