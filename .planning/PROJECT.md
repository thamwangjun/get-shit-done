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

## Current Milestone: v2.3.1-a Upstream v1.3.1 Merge & Rename Adoption

**Goal:** Land the upstream merge to tag `v1.3.1` (`open-gsd/gsd-core`), resolve every conflict preserving critical fork patches, and adopt the `get-shit-done/` → `gsd-core/` directory + npm package/bin rename.

**Target outcomes:**
- Upstream `v1.3.1` merged into the fork; all conflicts resolved with fork patches intact
- Directory rename `get-shit-done/` → `gsd-core/` and package/bin rename adopted across the fork
- Clean, committed merged tree at `v1.3.1`

**Out of scope (this milestone):** prompt-quality conformance pass (positive framing, no `skills:`, citation cleanup) on new/changed files is deferred; a green test suite is NOT a completion gate — failing tests are acceptable.

**Key context:** Massive divergence (~3,239 files, +145k/−290k; merge-base `fa4bba47`). Upstream repo identity changed from `thamwangjun/get-shit-done` (~v1.41.x) to `open-gsd/gsd-core` (`v1.x.x` semver). Fork playbooks (`.planning/fork_plans/`) and `UPSTREAM_TO_FORK_CHANGES_GUIDE.md` were deleted; merge guidance will be rebuilt via research. The prompt-engineering reference is now `PROMPT_ENGINEERING_GUIDE_V10.md` (this doc's Context still cites the removed V09).

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

> 29 implementation-specific decision rows (v1.38.6 through v2.1.0-e: AUDIT-03 examined-and-found-none, manual read audit, scanner-first v1.41.2 confirmation, Bug cmdStateJson heuristic, fork framing test updates, batch staging scripts, D-03 allowlist, SHA equality, GitHub Commits API, changelog extraction, injectable request seam, placeholder asymmetry, Eta v4 pivot, Eta default delimiters, Phase 47.1 insert, TEST-06 drop, step-numbering TDD gate, letter-suffix violations, Pattern C exclusion, dynamic corpus grep, scanForOutOfOrder anchor, whole-integer ref validation, semicolon delimiter, static allowlist, D-08 floor, effort= carrier, CATALOG-02 handover, triage phase insert, rawSlotForRuntime) are archived in `.planning/PROJECT_HISTORY.md` (Historical Key Decisions section).

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
*Last updated: 2026-06-10 — PROJECT.md condensed; historical detail (shipped milestones, validated requirements, settled Key Decisions) moved to PROJECT_HISTORY.md*
