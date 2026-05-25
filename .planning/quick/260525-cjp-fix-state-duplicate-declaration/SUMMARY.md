---
quick_id: 260525-cjp
slug: fix-state-duplicate-declaration
status: complete
date: "2026-05-25"
commit: 996ec0dc
---

# Summary: Fix Duplicate computeProgressPercent Declaration

## What Was Done

Removed the local `computeProgressPercent` function from `get-shit-done/bin/lib/state.cjs`. The function was both declared locally and imported from `state-document.cjs`, causing a `SyntaxError` at module load time.

## Result

- All tests pass (exit 0) after the fix
- ~1,769 cascading test failures resolved by the single 26-line deletion
- Committed: `996ec0dc` — fix(state): remove duplicate computeProgressPercent declaration
