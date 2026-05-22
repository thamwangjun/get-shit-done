# Phase 39: Stage and Commit Tests & SDK Validation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 39-stage-and-commit-tests-sdk-validation
**Areas discussed:** Script automation approach, SDK file boundary, Test runner vs maintenance scripts boundary

---

## Script Automation Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, mirror batches 1-3 | Node script with execFileSync, branch guard, unstage-first, duplicate detection, subset verification, missing-file abort | ✓ |
| Inline git commands instead | Skip dedicated script, execute git add/commit directly in plan | |
| You decide | Claude picks the recommended approach | |

**User's choice:** Yes, mirror batches 1-3 — create `scripts/stage-batch-4.cjs` following the established pattern.

---

## SDK File Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Strict: sdk/src/cli.ts only | Hardcode to the one file listed in ROADMAP.md STAGE-04 | ✓ |
| Dynamic: scan sdk/ for modified | Scan sdk/ directory for any files with changes since v1.41.2 | |
| You decide | Claude picks | |

**User's choice:** Strict — hardcode `sdk/src/cli.ts` only. Only this one file is modified, and the roadmap scope is explicit.

---

## Test Runner vs Maintenance Scripts Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm roadmap boundary | run-tests.cjs in Batch 4, gen-inventory-manifest.cjs in Batch 5 | ✓ |
| Bundle both in Batch 4 | Stage both remaining scripts now | |
| You decide | Claude picks | |

**User's choice:** Confirm roadmap boundary — `scripts/run-tests.cjs` in Batch 4 (test infrastructure), `scripts/gen-inventory-manifest.cjs` deferred to Batch 5 (maintenance).

---

## Claude's Discretion

None — all key decisions were explicitly selected by the user.

## Deferred Ideas

- `scripts/gen-inventory-manifest.cjs` — deferred to Batch 5 (maintenance/utility scripts)
