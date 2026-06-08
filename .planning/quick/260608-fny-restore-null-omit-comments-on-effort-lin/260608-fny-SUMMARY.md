---
phase: 260608-fny
plan: 01
subsystem: workflows
tags: [execute-phase, effort, null-omit, fidelity]
requires: []
provides: ["Two corrected standalone effort= lines with canonical null-omit comments"]
affects: [get-shit-done/workflows/execute-phase.md]
tech-stack:
  added: []
  patterns: ["canonical null-omit comment phrasing: # omit this line when <var> == null"]
key-files:
  created: []
  modified: [get-shit-done/workflows/execute-phase.md]
decisions: []
metrics:
  duration: ~3m
  completed: 2026-06-08
---

# Quick 260608-fny: Restore null-omit comments on effort= lines Summary

Restored the canonical `# omit this line when <var> == null` comments on the two standalone `effort={*_effort_arg}` lines inside Agent() invocations in `execute-phase.md`, matching the phrasing enforced by `tests/null-omit-comment-scan.test.cjs`.

## What Changed

- **Line 357** (executor Agent): comment corrected from `# omit when null` to `# omit this line when executor_model_effort_arg == null`.
- **Line 889** (verifier Agent): missing comment added → `# omit this line when verifier_model_effort_arg == null`.

The bash `*_effort_arg` builder lines (~79-80) were left untouched as required.

## Verification

`node --test tests/null-omit-comment-scan.test.cjs` → 1 test, pass 0 fail (zero violations).

## Deviations from Plan

None — plan executed exactly as written.

Note: at agent start the worktree base was at `c38bfb5b` (dev tip) rather than the intended base `870cd977`; corrected via the prescribed `git reset --hard` in the worktree branch check before any edits.

## Self-Check: PASSED

- FOUND: get-shit-done/workflows/execute-phase.md (modified, committed 0e3bbb2f)
- FOUND commit 0e3bbb2f: fix(quick-260608-fny): restore null-omit comments on effort= lines
