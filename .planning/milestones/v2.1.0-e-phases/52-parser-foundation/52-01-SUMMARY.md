---
phase: 52-parser-foundation
plan: 01
subsystem: model-resolution
tags: [parser, model-effort, core-cjs, tdd]
requires: []
provides:
  - parseModelEffort
  - _resetEffortWarningCacheForTests
affects:
  - get-shit-done/bin/lib/core.cjs
tech-stack:
  added: []
  patterns:
    - "warn-once Set cache keyed by full label (mirrors _warnedConfigKeys)"
    - "lastIndexOf(';') split — never greedy split(';')"
key-files:
  created: []
  modified:
    - get-shit-done/bin/lib/core.cjs
decisions:
  - "D1: split on lastIndexOf(';'); suffix stripped only when an exact EFFORT_TOKENS member"
  - "D2: one-time stderr warn lives inside parseModelEffort, Set-tracked, with dedicated reset helper"
  - "Chose a dedicated _resetEffortWarningCacheForTests rather than extending _resetRuntimeWarningCacheForTests (RESEARCH A3 discretion)"
metrics:
  duration: continuation (~15m executor wall)
  completed: 2026-05-31
requirements: [PARSE-01, PARSE-02]
---

# Phase 52 Plan 01: Parser Foundation Summary

Pure `parseModelEffort(label)` parser added to `core.cjs` — splits `model;effort`
slot strings on `lastIndexOf(';')`, validates the suffix against an allowlist
({low,medium,high,xhigh,max}), degrades typos to `effort:null` with a one-time
per-label stderr warning, and never treats colons (provider IDs) as delimiters.

## What Was Built

- `EFFORT_TOKENS = new Set(['low','medium','high','xhigh','max'])` module-level allowlist.
- `_warnedEffortLabels = new Set()` one-time warn cache keyed by the full original label.
- `parseModelEffort(label)`:
  - non-string input → `{model: label, effort: null}` (no throw)
  - no `;` → `{model: label, effort: null}` (no warn)
  - `;`-suffix in allowlist → `{model: base, effort: suffix}`
  - `;`-suffix not in allowlist → `{model: base, effort: null}` + one `gsd: warning —` stderr line per distinct label
- `_resetEffortWarningCacheForTests()` clears `_warnedEffortLabels`.
- Both `parseModelEffort` and `_resetEffortWarningCacheForTests` added to `module.exports`.

## TDD Gate Compliance

- RED: `a7987d4e test(52-01): add failing tests for parseModelEffort parser`
- GREEN: `2a42d27b feat(52-01): implement parseModelEffort model;effort parser`
- REFACTOR: none needed (implementation was minimal and clean).

## Verification

- Inline `node -e` assertions (all four canonical cases + five effort tokens + exported reset helper) exit 0 / print OK.
- `command grep -n "function parseModelEffort"` → exactly one match (line 1239).
- `npm test`: 5016 tests, 5013 pass, 0 fail, 3 skipped (pre-existing, unrelated), including `parse-model-effort.test.cjs`.

## Deviations from Plan

None — plan executed exactly as written. Implementation matched the D1/D2 algorithm
and the warn-once analog from the existing `_warnedConfigKeys` pattern.

## Self-Check: PASSED

- FOUND: get-shit-done/bin/lib/core.cjs (parseModelEffort at line 1239)
- FOUND commit: a7987d4e (RED)
- FOUND commit: 2a42d27b (GREEN)
