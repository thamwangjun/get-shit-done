---
phase: 55-catalog-schema-user-handover
plan: "01"
subsystem: model-catalog
tags: [typescript, model-catalog, resolver, type-widening, effort]
dependency_graph:
  requires: []
  provides: [CATALOG-01, CATALOG-03]
  affects: [sdk/src/model-catalog.ts, sdk/shared/model-catalog.json, get-shit-done/bin/lib/core.cjs, sdk/src/query/config-query.ts]
tech_stack:
  added: []
  patterns: [parseModelEffort suffix-strip, interface widening, schema annotation]
key_files:
  modified:
    - sdk/src/model-catalog.ts
    - sdk/shared/model-catalog.json
    - get-shit-done/bin/lib/core.cjs
    - sdk/src/query/config-query.ts
decisions:
  - "Widen AgentCatalogEntry and ModelCatalog interfaces to string (not union) so user can hand-assign model;effort slot values in CATALOG-02"
  - "Add comment block documenting RESOLVE-02 precedence chain directly above AgentCatalogEntry for Phase 58 regression writers"
  - "Use parseModelEffort(tier).model in resolveModelInternal to mirror the analog in resolveReasoningEffortInternal — zero behavior change on bare catalog"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-02"
---

# Phase 55 Plan 01: Catalog Schema + Resolver Suffix-Strip Summary

Widened AgentCatalogEntry profile slots and ModelCatalog.adaptiveTierMap to accept `model;effort` strings, and fixed both model resolvers to strip the `;effort` suffix before alias lookup — zero behavior change on the current bare catalog.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Widen AgentCatalogEntry and ModelCatalog interfaces + annotate JSON | e4a841cd | sdk/src/model-catalog.ts, sdk/shared/model-catalog.json |
| 2 | Strip ;effort suffix in resolveModelInternal (core.cjs) and config-query.ts resolveModel | abfcbf2b | get-shit-done/bin/lib/core.cjs, sdk/src/query/config-query.ts |

## What Was Built

**Task 1 — Interface widening (CATALOG-01, CATALOG-03)**

- `AgentCatalogEntry.golden`, `.balanced`, `.budget` widened from `'opus' | 'sonnet' | 'haiku'` to `string` — enables user to hand-assign `"opus;high"` values in CATALOG-02
- `ModelCatalog.adaptiveTierMap` value type widened from the narrow union to `string`
- Added 8-line comment block directly above `AgentCatalogEntry` documenting: `model;effort` syntax, `;` delimiter rationale (avoids provider ID `:` collisions), `parseModelEffort` as the runtime validator, RESOLVE-02 precedence chain
- Added `_schema_note` to `sdk/shared/model-catalog.json` (first key, before `profiles`) warning that effort values must NOT be pre-filled (CATALOG-02 is user-owned)
- `resolveRuntimeTierDefault` signature stays narrow (`alias: 'opus' | 'sonnet' | 'haiku'`) — as required by the plan invariant

**Task 2 — Resolver suffix-strip fixes (Pitfall 1 closure)**

- `get-shit-done/bin/lib/core.cjs` line ~1474: replaced `const alias = tier;` with `const alias = parseModelEffort(tier).model;` — mirrors the analog already present in `resolveReasoningEffortInternal`
- `sdk/src/query/config-query.ts` line ~289: split one-liner into `rawAlias` + `parseModelEffort(rawAlias).model` strip — mirrors the override path at lines 256-257 in the same function
- Both fixes are no-ops on the bare catalog: `parseModelEffort('opus').model === 'opus'`

## Verification Results

- `cd sdk && npx tsc --noEmit` → 0 (TSC_OK)
- `node --test tests/feat-53-unified-effort-resolver.test.cjs` → 13/13 pass (back-compat invariant green)
- `node get-shit-done/bin/gsd-tools.cjs query resolve-model gsd-planner` → `{ "model": "opus", "profile": "balanced", "effort": null }` (no semicolon)
- Agent slot check: all 33 agent entries keep bare `"opus"`/`"sonnet"`/`"haiku"` values

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. This plan is purely type-level and resolver fixes. No data is stubbed; no agent slots were pre-filled with effort values (by design — CATALOG-02 is user-owned).

## Threat Flags

None. Changes are TypeScript type widening and two one-line resolver fixes. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries beyond what was planned.

## Self-Check: PASSED

- sdk/src/model-catalog.ts exists and contains `golden: string`, `balanced: string`, `budget: string`, `RESOLVE-02`, `alias: 'opus' | 'sonnet' | 'haiku'`
- sdk/shared/model-catalog.json contains `_schema_note`
- get-shit-done/bin/lib/core.cjs contains `parseModelEffort(tier).model`
- sdk/src/query/config-query.ts contains `rawAlias` and `parseModelEffort(rawAlias).model`
- Commits e4a841cd and abfcbf2b verified in git log
