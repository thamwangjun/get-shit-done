---
quick_id: 260525-cjp
slug: fix-state-duplicate-declaration
description: Fix SyntaxError from duplicate computeProgressPercent declaration in state.cjs
date: "2026-05-25"
status: complete
---

# Fix: Duplicate computeProgressPercent Declaration in state.cjs

## Task

`state.cjs` declares `computeProgressPercent` as a local function (line 40) while also importing the identical function from `state-document.cjs` (line 13). This causes a `SyntaxError: Identifier 'computeProgressPercent' has already been declared` at module load time, preventing `state.cjs` from loading and cascading ~1,769 test failures.

## Root Cause

The local function was added after `state-document.cjs` was extracted as a separate module — the import was added but the local copy was not removed.

## Fix

Remove the local `computeProgressPercent` function declaration (lines 26–50 in the original). The imported version from `state-document.cjs` (via `state-document.generated.cjs`) is identical in logic.

## File Changed

- `get-shit-done/bin/lib/state.cjs` — delete local function body (26 lines removed)
