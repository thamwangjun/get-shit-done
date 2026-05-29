---
gsd_state_version: 1.0
milestone: v2.1.0-c
milestone_name: Install-Time Content Materialization
status: complete
last_updated: "2026-05-29T11:30:00.000Z"
last_activity: 2026-05-29
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 11
  completed_plans: 11
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-29 after v2.1.0-c milestone)

**Core value:** Every agent, command, and workflow file on `main` meets the fork's prompt engineering quality bar before it ships
**Current focus:** Planning next milestone

## Current Position

Milestone v2.1.0-c complete — SHIPPED 2026-05-29
All 5 phases, 11 plans complete.
Status: Milestone archived — ready for next milestone planning
Last activity: 2026-05-29 - Completed quick task 260529-inw: Compare test suite of current branch vs upstream v1.01.0

## Performance Metrics

**Velocity:**

- Total plans completed: 65 (v1.37.1 Phases 7–12, v1.37.1a Phases 13–17, v1.37.1b Phases 18–19)
- Average duration: — (metrics not retroactively enabled for completed phases)

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

- [Phase 31]: All prompt content files pass expanded scanner at 0 violations, 0 warnings (v1.38.6 baseline)
- [260513-kzj]: Upstream v1.41.2 merged into thamw-v1.41.2; 9 conflicts resolved; 11 test failures identified
- [260525-msv]: Upstream new-upstream/release/1.1.0 merged; upstream migrated to semver (1.1.0); fork reverted semver migration in worker keeping inline SHA isNewer() — full SHA reimplementation deferred to v2.1.0-a

### Prompt Content File State

All prompt content files (agents, commands, workflows) pass the expanded negative framing scanner at 0 violations, 0 warnings as of v1.38.6 (2026-05-03). Scanner at 99/99 subtests passing.

### Pending Todos

None.

### Blockers/Concerns

Phase 42 resolved: `semver-compare.test.cjs` (17/17) and `version-detection.test.cjs` (4/4) now pass.

Resolved: `tests/bug-2992-check-latest-version.test.cjs` rewritten for SHA-based assertions (Phase 43-01). All 9 tests pass. No open blockers.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260521-xpy | Merge v1.41.4 into thamw-main and resolve regression test failures (reverted compression) | 2026-05-21 | b33942e | [260521-xpy-merge-v1-41-4-into-thamw-main](./quick/260521-xpy-merge-v1-41-4-into-thamw-main/) |
| 260521-ccf | Compress Common Failures section of gsd-planner.md keeping Prompt Engineering Guide in mind | 2026-05-21 | 175ae66c | [260521-ccf-compress-planner-common-failures](./quick/260521-ccf-compress-planner-common-failures/) |
| 260521-mw4 | git pull from origin. let me know of conflicts, for me to decide how to resolve them. | 2026-05-21 | cd19c6be | [260521-mw4-git-pull-from-origin-let-me-know-of-conf](./quick/260521-mw4-git-pull-from-origin-let-me-know-of-conf/) |
| 260522-loh | Create phase 35 artifacts retroactively | 2026-05-22 | 32be3ec2 | [260522-loh-create-phase-35-artifacts-retroactively](./quick/260522-loh-create-phase-35-artifacts-retroactively/) |
| 260525-cjp | Fix SyntaxError from duplicate computeProgressPercent declaration in state.cjs | 2026-05-25 | 996ec0dc | [260525-cjp-fix-state-duplicate-declaration](./quick/260525-cjp-fix-state-duplicate-declaration/) |
| 260525-msv | Merge upstream/main into thamw-main — revert semver migration, keep SHA versioning (inline isNewer) | 2026-05-25 | e773e485 | [260525-msv-merge-upstream-main-revert-semver-migration](./quick/260525-msv-merge-upstream-main-revert-semver-migration/) |
| 260525-o1n | Convert @ file-reference notation in commands/gsd/ to shell-cat form (117 occurrences, 54 files) | 2026-05-25 | 4ba5dde1 | [260525-o1n-convert-commands-at-notation](./quick/260525-o1n-convert-commands-at-notation/) |
| 260525-i50 | Update branch name thamw-main → main; remove CLAUDE.md from .gitignore | 2026-05-25 | b960ed06 | [260525-i50-update-branch-name-thamw-main-to-main](./quick/260525-i50-update-branch-name-thamw-main-to-main/) |
| 260525-igz | Update CLAUDE.md architecture counts to reflect current project state (67 cmds, 90 workflows, 33 agents, 79 lib modules) | 2026-05-25 | e55d6831 | [260525-update-claude-md](./quick/260525-update-claude-md/) |
| 260526-enb | Fix 8 v2.1.0-a tech debt items — stale update.md metadata and tracking inconsistencies | 2026-05-26 | a62f5357 | [20260526-v2-1-0-a-tech-debt-cleanup](./quick/20260526-v2-1-0-a-tech-debt-cleanup/) |
| 260527-g3f | Fix installer banner to display 7-char SHA via gsdVersion instead of semver pkg.version | 2026-05-27 | 44ad13c1 | [260527-g3f-fix-install-banner-sha-instead-of-semver](./quick/260527-g3f-fix-install-banner-sha-instead-of-semver/) |
| 260529-c7a | Address v2.1.0-c milestone audit tech debt | 2026-05-29 | 541b79f2 | [260529-c7a-address-v2-1-0-c-milestone-audit-tech-de](./quick/260529-c7a-address-v2-1-0-c-milestone-audit-tech-de/) |
| 260529-dxz | Address phase 45 and phase 46 tech debts. | 2026-05-29 | 1e54d94e | [260529-dxz-address-phase-45-and-phase-46-tech-debts](./quick/260529-dxz-address-phase-45-and-phase-46-tech-debts/) |
| 260529-f6o | Compare npm test failures vs upstream/v1.01.0 — fix eta template regex, skip stale tests, regenerate inventory | 2026-05-29 | 57f6579d | [260529-f6o-compare-npm-test-failures-between-curren](./quick/260529-f6o-compare-npm-test-failures-between-curren/) |
| 260529-g0y | Compare npm test failures: dev HEAD vs upstream v1.01.0 (investigation only) | 2026-05-29 | — | [260529-g0y-compare-npm-test-failures-current-head-v](./quick/260529-g0y-compare-npm-test-failures-current-head-v/) |
| 260529-gn2 | Fix 25 npm test failures: RC1 remove semver extract, RC2 update VERSION assertions, RC3 skip fork-diverged tests | 2026-05-29 | a81c4a8a | [260529-gn2-fix-25-npm-test-failures-rc1-remove-semv](./quick/260529-gn2-fix-25-npm-test-failures-rc1-remove-semv/) |
| 260529-inw | Compare test suite of current branch vs upstream v1.01.0 (13c64e02) — full file structure and test case diff | 2026-05-29 | — | [260529-inw-compare-test-suite-of-current-branch-vs-](./quick/260529-inw-compare-test-suite-of-current-branch-vs-/) |

## Session Continuity

Last session: 2026-05-29T11:15:00.000Z
Stopped at: Completed quick task 260529-dxz — address phase 45 and phase 46 tech debts
Resume file: None
