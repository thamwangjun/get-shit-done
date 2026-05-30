---
spike: 001
name: node-test-concurrency
type: standard
validates: "Given npm test, when --test-concurrency 32 is desired, then what's the correct invocation?"
verdict: VALIDATED
related: []
tags: [testing, node, concurrency, performance]
---

# Spike 001: node-test-concurrency

## What This Validates

Given `npm test`, when we want to run with `--test-concurrency 32`, then what is the correct way to pass this — and does it already work?

## Research

| Approach | Tool | Pros | Cons |
|----------|------|------|------|
| `npm test -- --test-concurrency 32` | CLI arg passthrough | Intuitive | FAILS — `run-tests.cjs` rejects unknown args |
| `TEST_CONCURRENCY=32 npm test` | Env var | Already implemented | Less discoverable |
| Modify `run-tests.cjs` to accept the flag | Code change | Ergonomic | Requires code change |

**Chosen:** `TEST_CONCURRENCY=32 npm test` — already implemented, zero changes needed.

## How to Run

```bash
TEST_CONCURRENCY=32 npm test
```

## What to Expect

- All 586 test files run, split into 2 chunks (Windows compat chunking, not a concurrency limit)
- Up to 32 test file processes run in parallel
- The machine has 32 CPUs so this fully saturates available parallelism

## Investigation Trail

**Attempt 1:** `npm test -- --test-concurrency 32`
- Result: FAILS immediately — `run-tests.cjs` parses its own argv and rejects anything that isn't `--suite`
- Error: `run-tests: unknown argument: --test-concurrency`

**Attempt 2:** Read `scripts/run-tests.cjs` source
- Line 143-145: `TEST_CONCURRENCY` env var override is already implemented
- Default: 4 on Linux/macOS, 2 on Windows
- Maps directly to `--test-concurrency=${value}` passed to `node --test`

**Attempt 3:** `TEST_CONCURRENCY=32 npm test`
- Result: WORKS — test suite runs, chunk log shows 586 files in 2 chunks

**Node.js verification:** `node --help` confirms `--test-concurrency=...` is a real flag (not a third-party thing).

**CPU check:** Machine has 32 CPUs (`nproc` = 32), so `TEST_CONCURRENCY=32` fully saturates parallelism. This is also what `os.availableParallelism()` would return — meaning Node.js's own default would already be 32 if `run-tests.cjs` didn't hardcode 4.

## Results

**Verdict: VALIDATED**

- `npm test -- --test-concurrency 32` → rejected (run-tests.cjs only accepts `--suite`)
- `TEST_CONCURRENCY=32 npm test` → works today, no code changes needed
- The hardcoded default of 4 in `run-tests.cjs` is conservative for the 32-CPU machine
- Bumping `TEST_CONCURRENCY` to 32 (or removing the hardcode so Node uses `os.availableParallelism()`) would let the test suite use all available cores
