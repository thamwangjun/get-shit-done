---
spike: 002
name: vitest-migration-feasibility
type: standard
validates: "Given 586 .cjs test files using node:test API, when migrating to vitest, then will test run times improve?"
verdict: INVALIDATED
related: ["001-node-test-concurrency"]
tags: [testing, vitest, node-test, performance, timing, migration]
---

# Spike 002: Vitest Migration Feasibility

## What This Validates

Given 586 `.test.cjs` files using `node:test` API (`require('node:test')`), when considering a vitest migration, then: (a) is migration compatible without rewriting tests, and (b) would it actually improve run times?

## Research

| Approach | Tool | Pros | Cons |
|----------|------|------|------|
| Vitest migration | vitest | Thread/fork pool, caching, sharding | Requires rewriting 586 .cjs files; node:test API incompatible |
| node --test + higher concurrency | Built-in | Zero migration, works today | Conservative default (4) is already fixed in spike 001 |
| Change default concurrency to `os.availableParallelism()` | run-tests.cjs edit | 1-line change, auto-scales | None |

**Vitest compatibility research** (from Vitest GitHub Discussion #6482, maintainer statement):
- Vitest explicitly does NOT support running `node:test` format tests
- Vitest maintainers: *"This is not something we are looking to implement"*
- `node:test` and vitest APIs differ architecturally — aliasing `node:test` → `vitest` is unreliable
- Vitest CJS detection: `.test.cjs` files ARE detected by naming convention, but tests must use vitest's own API (`import { describe, test } from 'vitest'`), not `require('node:test')`

## How to Run

```bash
# Baseline (default concurrency=4)
time node scripts/run-tests.cjs --suite unit

# Optimized (concurrency=32, all CPUs)
time TEST_CONCURRENCY=32 node scripts/run-tests.cjs --suite unit
```

## What to Expect

- Baseline: ~2m52s wall clock (concurrency=4, unit suite only)
- Optimized: ~1m39s wall clock (concurrency=32, unit suite only)

## Investigation Trail

**Step 1: Understand test format**

All 586 test files are CommonJS (`.test.cjs`) using `require('node:test')`:

```js
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
```

This is not vitest's format. Vitest expects `import { describe, test } from 'vitest'` (ESM).

**Step 2: Check vitest's current presence**

Vitest is already a devDependency — but only for the `sdk/` layer:
- `vitest.config.ts` at root covers `sdk/src/**/*.test.ts` only
- Root `devDependencies` has only `c8: ^11.0.0` — no vitest
- The 586 node:test files are explicitly excluded from the existing vitest config

**Step 3: Research vitest/node:test compatibility**

Web search + GitHub research surfaced the blocker: vitest maintainers have explicitly declined to support node:test format tests. The `pool: 'forks'` mode (vitest's child_process mode) does NOT enable running node:test format files — it only improves stability for native C++ modules.

**Migration cost estimate:**
- 586 `.test.cjs` files
- Each uses `require('node:test')` and `require('node:assert/strict')`
- Migration = rewrite all 586 to use vitest API + convert to ESM or configure vitest for CJS
- Estimated: multi-day effort with high risk of subtle behavioral differences
- Not justified given timing data below

**Step 4: Measure actual timing**

Measured the unit suite (the largest suite, ~586 files) under both configurations:

| Configuration | Wall clock | User time | Speedup |
|---------------|-----------|-----------|---------|
| `node --test` concurrency=4 (default) | **2m52.7s** | 10m20s | 1× (baseline) |
| `TEST_CONCURRENCY=32 npm test` | **1m39.7s** | 14m2s | **1.74× faster** |
| SDK build (pretest overhead) | 5.8s | — | — |

The user time being higher at concurrency=32 is expected — more parallelism = more total CPU work done simultaneously, so wall clock drops even as aggregate CPU seconds increases.

**Step 5: Identify the real fix**

`scripts/run-tests.cjs` hardcodes `defaultConcurrency = 4` on Linux/macOS. This machine has 32 CPUs (`nproc = 32`). Changing the default to `os.availableParallelism()` (1 line) would give the TEST_CONCURRENCY=32 speedup automatically, permanently, for all developers on multi-core machines.

## Results

**Verdict: INVALIDATED**

Vitest migration is not feasible for this project without a complete test rewrite. The actual speedup question is answered differently:

- **The real opportunity**: Changing `defaultConcurrency` from hardcoded `4` to `os.availableParallelism()` in `scripts/run-tests.cjs` (1-line change) gives a **42% wall-clock speedup** (2m52s → 1m39s) with zero test rewrites.
- **Vitest migration**: Would require rewriting all 586 `.cjs` tests from `node:test` API to vitest API. Estimated multi-day effort. Not justified — the concurrency default change achieves the same outcome at zero cost.
- **Note**: The higher default (4) may have been intentional to avoid CI exhaustion. Spike 001 found this machine has 32 CPUs, making 32 a safe local override. CI could keep a lower ceiling.
