---
phase: 10-test-suite-green
plan: "01"
subsystem: test-suite
tags: [test-suite, agents, hooks, v09-compliance, persona-rename]
dependency_graph:
  requires: []
  provides: [green-test-gate, v09-persona-tags, managed-hooks-registry]
  affects: [agents/gsd-*.md, hooks/gsd-check-update-worker.js, tests/secure-phase.test.cjs]
tech_stack:
  added: []
  patterns: [sed-batch-rename, node-test-runner, managed-hooks-registry]
key_files:
  created: []
  modified:
    - hooks/gsd-check-update-worker.js
    - agents/gsd-advisor-researcher.md
    - agents/gsd-ai-researcher.md
    - agents/gsd-assumptions-analyzer.md
    - agents/gsd-codebase-mapper.md
    - agents/gsd-code-fixer.md
    - agents/gsd-code-reviewer.md
    - agents/gsd-debugger.md
    - agents/gsd-debug-session-manager.md
    - agents/gsd-doc-verifier.md
    - agents/gsd-doc-writer.md
    - agents/gsd-domain-researcher.md
    - agents/gsd-eval-auditor.md
    - agents/gsd-eval-planner.md
    - agents/gsd-executor.md
    - agents/gsd-framework-selector.md
    - agents/gsd-intel-updater.md
    - agents/gsd-pattern-mapper.md
    - agents/gsd-phase-researcher.md
    - agents/gsd-plan-checker.md
    - agents/gsd-planner.md
    - agents/gsd-research-synthesizer.md
    - agents/gsd-security-auditor.md
    - agents/gsd-ui-checker.md
    - agents/gsd-verifier.md
    - tests/secure-phase.test.cjs
decisions:
  - "Update secure-phase.test.cjs to assert <persona> not <role>: tests must reflect fork behavior (V09 standard), not upstream tags — established precedent from v1.36.0 Phase 3"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-19"
  tasks_completed: 3
  files_modified: 26
---

# Phase 10 Plan 01: Test Suite Green Summary

## Objective

Drive the test suite from 4110/4112 to 4112/4112 by fixing two regressions introduced by the v1.37.1 merge: a missing MANAGED_HOOKS entry and a `<role>` tag rename across 24 agents by upstream commit c5e77c8.

## What Was Built

### Task 1 — Add gsd-read-injection-scanner.js to MANAGED_HOOKS (commit: 11974fc)

Inserted `'gsd-read-injection-scanner.js'` into the MANAGED_HOOKS array in `hooks/gsd-check-update-worker.js`, alphabetically between `gsd-read-guard.js` and `gsd-session-state.sh`. The corresponding file exists in `hooks/`. Result: `tests/managed-hooks.test.cjs` passes 3/3 (was failing 1/3).

### Task 2 — Rename `<role>` to `<persona>` in 24 fork agents (commit: ce167a4)

Applied a `sed -i` batch rename across all 24 agents that still used the upstream `<role>`/`</role>` tags. The rename is anchored to full-line matches (`^<role>$`) preventing any frontmatter or inline content disturbance. After the rename: 31 agents use `<persona>` (24 renamed + 7 already correct), 0 agents retain `<role>`. All targeted tests pass: `tests/verification-overrides.test.cjs` (27/27), `tests/agent-size-budget.test.cjs` (34/34), `tests/agent-frontmatter.test.cjs` (135/135).

### Task 3 — Full test suite gate confirmation (commit: f6a3514)

Ran all 5 fork-specific test files individually — all pass. Discovered one additional test regression: `tests/secure-phase.test.cjs` line 66 asserting `<role>` in `gsd-security-auditor.md`. Updated the test to assert `<persona>` per fork V09 standards (established precedent: tests asserting upstream-style tags are updated to fork behavior). Final result: `npm test` exits 0 with 4112/4112 tests passing.

## Fork-Specific Test Results (individually confirmed)

| Test File | Result |
|-----------|--------|
| tests/negative-framing-scan.test.cjs | 34/34 pass |
| tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs | 8/8 pass |
| tests/ios-scaffold-safety.test.cjs | 6/6 pass |
| tests/execute-phase-wave.test.cjs | 15/15 pass |
| tests/agent-frontmatter.test.cjs | 135/135 pass |

## Final Test Count

`npm test` exits 0 with **4112/4112** tests passing (0 failed). Target met: >= 3941 baseline (research-verified target: 4112/4112).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated secure-phase.test.cjs to assert `<persona>` not `<role>`**
- **Found during:** Task 3 (full suite run)
- **Issue:** `tests/secure-phase.test.cjs` line 66 asserted `content.includes('<role>')` in `gsd-security-auditor.md`. After the Task 2 rename, this test failed because the agent now correctly uses `<persona>`.
- **Fix:** Updated test assertion from `<role>`/`</role>` to `<persona>`/`</persona>` and renamed the test case to `has <persona> section`.
- **Precedent:** PROJECT.md documents this pattern: "Tests may be modified when they conflict with fork standards." Established in v1.36.0 Phase 3.
- **Files modified:** tests/secure-phase.test.cjs
- **Commit:** f6a3514

## Known Stubs

None.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- hooks/gsd-check-update-worker.js: modified — FOUND
- agents/gsd-verifier.md: modified — FOUND (contains `</persona>`)
- agents/gsd-planner.md: modified — FOUND (contains `</persona>`)
- tests/secure-phase.test.cjs: modified — FOUND
- Commit 11974fc (Task 1): FOUND
- Commit ce167a4 (Task 2): FOUND
- Commit f6a3514 (Task 3): FOUND
- npm test: 4112/4112, exit 0 — VERIFIED
