---
phase: 52-parser-foundation
plan: 02
subsystem: model-resolution
tags: [refactor, model-effort, core-cjs, golden-snapshot, shell-safety]
requires:
  - 52-01
provides:
  - _resolveAgentSlot
  - resolveModelInternal (refactored, parseModelEffort-wired, shell-safe override path)
affects:
  - get-shit-done/bin/lib/core.cjs
  - tests/parse-model-effort.test.cjs
tech-stack:
  added: []
  patterns:
    - "extracted helper: _resolveAgentSlot(cwd, agentType) — single tier-resolution path"
    - "D3: override path returns parseModelEffort(override).model — strips ';' at the resolver"
    - "golden-snapshot test: frozen inline expected values cover all agents × 4 profiles + 3 representative configs"
key-files:
  created: []
  modified:
    - get-shit-done/bin/lib/core.cjs
    - tests/parse-model-effort.test.cjs
decisions:
  - "D3: resolveModelInternal override path uses parseModelEffort(override).model — a bare full ID returns verbatim, a 'model;effort' ID has the suffix stripped before returning (structural shell-safety fix T-52-SC)"
  - "_resolveAgentSlot returns the raw tier BEFORE alias-map expansion, so a ';effort' suffix in a slot survives for the Phase 53 effort resolver to consume"
  - "VALID_TIERS in _resolveAgentSlot includes 'inherit' (the model-resolver's set); the effort resolver will layer its own 'inherit' opt-out on top in Phase 53"
  - "Golden snapshot frozen inline (not computed on-the-fly) so any behavior drift in core.cjs triggers an immediate assertion failure"
metrics:
  duration: ~20m
  completed: 2026-05-31
requirements: [PARSE-03]
---

# Phase 52 Plan 02: _resolveAgentSlot Extraction Summary

Extracted the duplicated phase-type-tier lookup out of `resolveModelInternal` into a shared
`_resolveAgentSlot(cwd, agentType)` helper, and refactored the override path to call
`parseModelEffort(override).model` — eliminating the #3023 model/effort divergence site and
structurally preventing `;` from leaking into resolved model strings (T-52-SC shell-safety).

## What Was Built

**Task 1 — Pre-change golden snapshot:**
- Added `describe`, `fs`, `path`, `os` imports to `tests/parse-model-effort.test.cjs` plus shared `writeConfig`/`makeTmpWithConfig` helpers
- `resolveModelInternal golden snapshot` describe block: iterates all 33 `MODEL_PROFILES` agents × `quality/balanced/budget/inherit` profiles
- Three representative configs: `resolve_model_ids:'omit'` (returns `""`), `runtime:'codex'` (returns Codex model ID), `{model_profile:'inherit', models:{execution:'opus'}}` (#3030 case returns `'opus'`)
- All expected values frozen inline before any edits to `core.cjs`
- 14 tests pass GREEN against unmodified core.cjs

**Task 2 — _resolveAgentSlot + resolveModelInternal refactor:**
- `_resolveAgentSlot(cwd, agentType)` added before `resolveModelInternal`: extracts the exact lines 1285–1307 logic (profile, agentModels, phaseType, phaseTypeTier, VALID_TIERS, tier ternary) into a named helper
- Returns raw slot string before alias-map expansion (preserves `';effort'` suffix for Phase 53)
- `resolveModelInternal` step 1 override path: `return parseModelEffort(override).model` (D3)
- `resolveModelInternal` step 2 tier: `const tier = _resolveAgentSlot(cwd, agentType)` replaces the inline block
- Steps 3 (`_resolveRuntimeTier`), 4 (`resolve_model_ids:'omit'`), 5 (profile lookup + `MODEL_ALIAS_MAP`) left byte-for-byte unchanged
- `_resolveAgentSlot` exported in `module.exports`
- Test additions: 4 `_resolveAgentSlot` unit tests + 2 shell-safety regression tests (override `.model` strips `;`)

## Verification

- `command grep -n "function _resolveAgentSlot" get-shit-done/bin/lib/core.cjs` → exactly one match (line 1333)
- `require('./get-shit-done/bin/lib/core.cjs')._resolveAgentSlot` → function
- Golden snapshot passes byte-identical after refactor (all 20 tests green)
- Override shell-safety assertion passes: `model_overrides:{'gsd-executor':'opus;high'}` resolves to `'opus'` (no `;`)
- `node --test tests/feat-3023-model-phase-types.test.cjs` → 27 pass, 0 fail
- `npm test` pre-existing failures (ai-evals W016, context-enrichment, install-eta-regression) are unrelated to this plan; no new failures introduced

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: get-shit-done/bin/lib/core.cjs (_resolveAgentSlot at line 1333)
- FOUND: tests/parse-model-effort.test.cjs (golden snapshot + slot + shell-safety test blocks)
- FOUND commit: 0dafc55f (Task 1 — golden snapshot)
- FOUND commit: 83924dbf (Task 2 — extraction + refactor)
