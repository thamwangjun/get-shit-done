---
phase: quick-260608-m6w
plan: 01
subsystem: tests, agents
tags: [anti-heredoc, positive-framing, fork-decision, test-activation]
dependency_graph:
  requires: []
  provides: [active-hdoc-suite, fork-decision-documented]
  affects: [tests/agent-frontmatter.test.cjs, tests/debug-session-management.test.cjs, agents/gsd-*.md, .planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md]
tech_stack:
  added: []
  patterns: [positive-framing-replacement, single-owner-assertion]
key_files:
  created: []
  modified:
    - tests/agent-frontmatter.test.cjs
    - tests/debug-session-management.test.cjs
    - agents/gsd-debug-session-manager.md
    - agents/gsd-doc-writer.md
    - agents/gsd-executor.md
    - agents/gsd-phase-researcher.md
    - agents/gsd-research-synthesizer.md
    - .planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md
decisions:
  - "agent-frontmatter.test.cjs is the single owner of the anti-heredoc assertion for all file-writing agents; per-agent duplicates in other test files are removed not updated"
  - "Fork positive-framing rule rewrites 'Only use the Write tool' to 'Always use the Write tool' in both agent content and test assertions"
metrics:
  duration: ~10m
  completed: 2026-06-08
---

# Quick Task 260608-m6w: Fix Anti-Heredoc Test Phrasing and Record Fork Decision

**One-liner:** Activated HDOC test suite with /always use the write tool/i regex, updated 5 agents to fork phrasing, removed duplicate per-agent assertion, and documented the fork decision.

## What Was Done

### Task 1: Fix agent-frontmatter.test.cjs and debug-session-management.test.cjs

- Changed `describe.skip(` to `describe(` — HDOC suite is now active
- Changed regex from `/only use the write tool/i` to `/always use the write tool/i`
- Changed assertion message to reference "Always use the Write tool"
- Removed the 3-line duplicate test block from `debug-session-management.test.cjs`

### Task 2: Record fork decision in UPSTREAM_TO_FORK_CHANGES_GUIDE.md

Inserted "Anti-heredoc phrasing: 'Always use the Write tool'" subsection after the Scanner precedence rule paragraph (before Category 10 separator).

### Task 3: Run tests and verify

Full test suite: 8257 pass, 0 fail, 11 skipped. Exit code 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Five agents lacked "Always use the Write tool" phrasing**

- **Found during:** Task 3 (test run)
- **Issue:** Activating the HDOC suite revealed 5 file-writing agents (`gsd-debug-session-manager`, `gsd-doc-writer`, `gsd-executor`, `gsd-phase-researcher`, `gsd-research-synthesizer`) did not pass `/always use the write tool/i`. They had either upstream "Only use the Write tool" or a variant without the canonical phrase.
- **Fix:** Updated each agent's anti-heredoc instruction to use "Always use the Write tool" per the fork's positive-framing rule.
- **Files modified:** `agents/gsd-debug-session-manager.md`, `agents/gsd-doc-writer.md`, `agents/gsd-executor.md`, `agents/gsd-phase-researcher.md`, `agents/gsd-research-synthesizer.md`
- **Commit:** 5bba2081 (included in the single atomic commit)

## Commits

| Hash | Message |
|------|---------|
| 5bba2081 | test: fix anti-heredoc assertion phrasing (always vs only) and record fork decision |

## Self-Check: PASSED

- tests/agent-frontmatter.test.cjs: modified (describe.skip → describe, regex updated)
- tests/debug-session-management.test.cjs: duplicate test removed
- .planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md: fork decision section inserted
- 5 agent files updated with "Always use the Write tool" phrasing
- Commit 5bba2081 verified in git log
- npm test: 8257 pass, 0 fail
