---
quick_id: 260530-7yv
status: complete
date: 2026-05-30
---

# Summary: implement the 1-line os.availableParallelism() fix in run-tests.cjs

## What Was Done

Added `const os = require('os');` import to `scripts/run-tests.cjs` and replaced the hardcoded `4` with `os.availableParallelism()` in the default concurrency calculation.

**Change:** `scripts/run-tests.cjs` line 142
- Before: `const defaultConcurrency = process.platform === 'win32' ? 2 : 4;`
- After: `const defaultConcurrency = process.platform === 'win32' ? 2 : os.availableParallelism();`

## Result

On the 32-CPU dev machine, `npm test` now defaults to 32 concurrent test processes instead of 4, giving a ~42% speedup (per spike-002 results). The `TEST_CONCURRENCY` env override still works for manual tuning. Windows path unchanged (hardcoded `2` preserved).
