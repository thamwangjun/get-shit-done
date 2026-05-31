---
phase: 52-parser-foundation
plan: 03
subsystem: model-resolution
tags: [parser, model-effort, sdk-ts, parity, tdd]
requires: [52-01]
provides:
  - parseModelEffort (TS mirror in sdk/src/model-catalog.ts)
  - tests/fixtures/parse-model-effort.json (shared D4 parity fixture)
  - sdk/src/parse-model-effort.test.ts (vitest parity suite)
  - tests/parse-model-effort-parity.test.cjs (node --test CJS parity suite)
affects:
  - sdk/src/model-catalog.ts
tech-stack:
  added: []
  patterns:
    - "single shared JSON fixture drives both CJS and TS parity suites (D4 anti-drift)"
    - "lastIndexOf(';') split — never greedy split(';')"
    - "warn-once Set cache keyed by full label (module-level _warnedEffortLabels)"
key-files:
  created:
    - tests/fixtures/parse-model-effort.json
    - sdk/src/parse-model-effort.test.ts
    - tests/parse-model-effort-parity.test.cjs
  modified:
    - sdk/src/model-catalog.ts
decisions:
  - "D4: one shared JSON fixture drives both node --test CJS and vitest TS suites so case-lists cannot drift"
  - "TS mirror reimplements CJS algorithm verbatim using lastIndexOf, not split"
  - "fixture located at tests/fixtures/ — readable from sdk/src/ via ../../tests/fixtures and from tests/ via path.join(__dirname, 'fixtures')"
metrics:
  duration: ~20m
  completed: 2026-05-31
requirements: [PARSE-04]
---

# Phase 52 Plan 03: TS parseModelEffort Mirror + Shared Parity Fixture Summary

TS `parseModelEffort` mirror exported from `sdk/src/model-catalog.ts` using identical semantics to the CJS implementation. One shared JSON fixture (`tests/fixtures/parse-model-effort.json`) drives both a vitest suite and a node --test CJS suite, proving CJS/TS parser parity across all D4 cases — PARSE-04.

## What Was Built

**Task 1: Shared fixture + TS mirror**
- `tests/fixtures/parse-model-effort.json`: 8 D4 cases — bare model `opus`, all 5 valid effort tokens (`low`/`medium`/`high`/`xhigh`/`max`), provider-colon ID `openrouter:anthropic/claude-opus` (effort null), typo `opus;hihg` (base + null).
- `sdk/src/model-catalog.ts`: Added `export function parseModelEffort(label: string): { model: string; effort: string | null }` alongside existing helpers. Module-level `EFFORT_TOKENS` Set and `_warnedEffortLabels` Set. Uses `lastIndexOf(';')` — never greedy `split(';')`. Warn-once via `process.stderr.write` with `gsd: warning —` prefix.

**Task 2: Parity test suites**
- `sdk/src/parse-model-effort.test.ts`: vitest suite loading the shared fixture via `path.resolve(__filename, '../../../tests/fixtures/parse-model-effort.json')`. Uses `it.each` over all cases with `expect(parseModelEffort(c.input)).toEqual(...)`.
- `tests/parse-model-effort-parity.test.cjs`: node --test CJS suite loading the same fixture via `path.join(__dirname, 'fixtures', 'parse-model-effort.json')`. Uses `assert.deepStrictEqual` for all 8 cases.

## Verification

- `node --test tests/parse-model-effort-parity.test.cjs`: 8 pass, 0 fail.
- `cd sdk && npx vitest run src/parse-model-effort.test.ts`: 8 pass, 0 fail.
- `command grep -n "export function parseModelEffort" sdk/src/model-catalog.ts`: exactly one match (line 82).
- `command grep -n "split(';')" sdk/src/model-catalog.ts`: no match.
- `npm test`: 8 pre-existing failures (W016, Codex, Gemini install — unrelated); no new failures.

## Deviations from Plan

None — plan executed exactly as written. The `../../tests/fixtures` relative path from `sdk/src/` resolved correctly on first attempt; no fallback to `sdk/shared/` was needed.

## Self-Check: PASSED

- FOUND: tests/fixtures/parse-model-effort.json
- FOUND: sdk/src/model-catalog.ts (parseModelEffort at line 82)
- FOUND: sdk/src/parse-model-effort.test.ts
- FOUND: tests/parse-model-effort-parity.test.cjs
- FOUND commit: f4e80f08 (Task 1 — fixture + TS mirror)
- FOUND commit: 510c701d (Task 2 — parity test suites)
