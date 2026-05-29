---
plan: 45-05
phase: "45"
status: complete
completed: 2026-05-29
commit: 238222c1
self_check: PASSED
---

# Plan 45-05 Summary: Dual-Accept Test Assertions for Eta Include Tags

## What Was Built

Updated 5 test assertions across 2 test files to accept both legacy @-notation and Eta include tag form, closing the gap where Phase 45-02 converted command files to Eta tags without updating tests.

## Changes Made

**tests/import-command.test.cjs** — 1 assertion updated:
- `references the import workflow`: replaced `content.includes('@~/.claude/get-shit-done/workflows/import.md')` with dual-accept pattern (`hasLegacyRef || hasEtaRef`)

**tests/ingest-docs.test.cjs** — 4 assertions updated:
- `references the ingest-docs workflow`: dual-accept for ingest-docs workflow ref
- `references the doc-conflict-engine`: dual-accept for doc-conflict-engine ref
- `references gate-prompts`: dual-accept for gate-prompts ref
- `import command loads doc-conflict-engine reference`: dual-accept for import command's conflict-engine ref

## Pattern Applied

Followed the established dual-accept pattern from `tests/few-shot-calibration.test.cjs` (Phase 45-04):
```js
const hasLegacyRef = content.includes('@~/.claude/get-shit-done/...');
const hasEtaRef = /\{%~\s*include\(['"]get-shit-done\/...['"]\)\s*%\}/.test(content);
assert.ok(hasLegacyRef || hasEtaRef, '...');
```

## Verification

- `node --test tests/import-command.test.cjs` — 13/13 pass
- `node --test tests/ingest-docs.test.cjs` — 40/40 pass
- `npm test` — exits 0 (windows-test-parity-guard 1 failure is pre-existing, confirmed by stash test)

## Key Files

- `tests/import-command.test.cjs`
- `tests/ingest-docs.test.cjs`

## Self-Check: PASSED
