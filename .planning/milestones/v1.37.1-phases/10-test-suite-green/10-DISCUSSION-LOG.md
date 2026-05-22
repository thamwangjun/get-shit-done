# Phase 10: Test Suite Green - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19
**Phase:** 10-test-suite-green
**Areas discussed:** Verification-overrides test fix, MANAGED_HOOKS gap, Fork-specific tests confirmation

---

## Verification-overrides test fix

| Option | Description | Selected |
|--------|-------------|----------|
| Update test: `</persona>` → `</role>` | Accept upstream's `<role>` pattern as fork standard; would need V09 guide updated | |
| Add `<persona>` back to gsd-verifier.md only | Narrow fix; leaves 23 other agents still using `<role>` | |
| Fix all agents: `<role>` → `<persona>` | Restores V09 standard across all 24 affected agents | ✓ |

**User's choice:** Fix all agents — `<role>` → `<persona>` rename across all 24 agents

**Notes:** User asked "Is persona or role used based on fork reference files?" — investigation confirmed V09 guide defines `<persona>` as canonical. The `<role>` pattern was introduced by upstream commit `c5e77c8`, not the fork. Test is correct per fork standards; agents need to be fixed. User chose full scope (all 24 agents) over narrow fix (gsd-verifier.md only).

---

## MANAGED_HOOKS gap

| Option | Description | Selected |
|--------|-------------|----------|
| Add `gsd-read-injection-scanner.js` to MANAGED_HOOKS | Fix the registry sync gap in gsd-check-update-worker.js | ✓ |

**User's choice:** Add to registry (no decision needed — clear fix)

**Notes:** `gsd-read-injection-scanner.js` is shipped in `hooks/` but missing from the `MANAGED_HOOKS` array. This is a legitimate sync gap introduced by upstream, not a test/fork conflict. Fix is in the code.

---

## Fork-specific tests confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| Run each of 5 fork-specific tests individually | Explicit per-file verification of TEST-04 requirement | ✓ |

**User's choice:** Confirm all 5 individually (no decision needed — execution detail)

**Notes:** TEST-04 requires 5 specific test files to be present AND passing. Aggregate count being 4112 doesn't prove each individual file is present — plan must verify each explicitly.

---

## Claude's Discretion

- Order of fixes (MANAGED_HOOKS vs `<role>` → `<persona>` pass)
- Whether to run `npm test` incrementally or once at the end
- Batch strategy for the 24-agent rename

## Deferred Ideas

- Full V09 structural audit across all 24 agents receiving the `<persona>` restore (deeper quality review beyond tag rename)
