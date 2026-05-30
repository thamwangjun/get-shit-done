# Spike Manifest

## Idea

Can we speed up `npm test` — via higher concurrency or a test runner migration (vitest)?

## Requirements

- Use `TEST_CONCURRENCY=32 npm test` (env var), not a CLI flag — the `--` passthrough is rejected
- Vitest migration is NOT feasible without rewriting all 586 .cjs test files (node:test API incompatible with vitest)
- Real fix: change `defaultConcurrency` in `scripts/run-tests.cjs` from hardcoded `4` to `os.availableParallelism()` for a 42% wall-clock speedup with zero test rewrites

## Spikes

| # | Name | Type | Validates | Verdict | Tags |
|---|------|------|-----------|---------|------|
| 001 | node-test-concurrency | standard | Given npm test, when --test-concurrency 32 is desired, then what's the correct invocation? | VALIDATED | testing, node, concurrency |
| 002 | vitest-migration-feasibility | standard | Given 586 .cjs node:test files, when migrating to vitest, then will test run times improve? | INVALIDATED | testing, vitest, performance, timing, migration |
