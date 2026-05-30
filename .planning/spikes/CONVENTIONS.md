# Spike Conventions

Patterns and stack choices established across spike sessions.

## Stack

- **Language**: Node.js CommonJS — all spikes are research/measurement, no UI needed
- **Test subject**: `scripts/run-tests.cjs` + 586 `.test.cjs` files in `tests/`
- **Timing**: Use `time <command>` for wall-clock measurement; note user time separately

## Structure

- Spikes are pure research and measurement — no UI builds needed for this problem domain
- All timing runs against `--suite unit` (largest suite) for comparable baselines

## Patterns

- **Timing methodology**: Run twice if results seem anomalous; use wall clock (real), not user time
- **Concurrency testing**: `TEST_CONCURRENCY=N node scripts/run-tests.cjs` (env var, not CLI flag)
- **Vitest**: Already installed for `sdk/` layer only; root tests use `node --test` — keep them separate

## Tools & Libraries

- `node --test` with `--test-concurrency` — the native runner for all 586 `.cjs` test files
- `c8` — coverage, wraps `node scripts/run-tests.cjs`
- vitest — SDK layer only (`sdk/src/**/*.test.ts`); NOT for root `.test.cjs` files
