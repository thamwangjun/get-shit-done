---
status: complete
phase: 48-tdd-red-gate
source: 48-01-SUMMARY.md, 48-02-SUMMARY.md
started: 2026-05-30T00:00:00Z
updated: 2026-05-30T00:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Test File Exists
expected: The file `tests/step-numbering-scan.test.cjs` exists and is ≥305 lines.
result: pass

### 2. RED Gate — Test Run Exits Non-Zero
expected: Running `node --test tests/step-numbering-scan.test.cjs` exits with a non-zero code. Output contains failure lines. This is expected — the RED gate confirms violations exist in the corpus.
result: pass

### 3. Unit Tests Pass GREEN
expected: The synthetic unit subtests inside `scanContent() — decimal detection` (7 tests) and `scanForOutOfOrder() — synthetic content` (7 tests) all PASS. They are GREEN even though corpus describe blocks fail.
result: pass

### 4. Pattern A/B Decimal Failures — Required Files Detected
expected: Test output shows FAIL for these files due to decimal step labels: `agents/gsd-intel-updater.md` (Step 6.5), `agents/gsd-phase-researcher.md` (Step 1.3, 1.5, 2.5, 2.6), `get-shit-done/workflows/progress.md` (Step 1.5, 1.6), `get-shit-done/workflows/quick.md` (Step 2.5, 4.5, etc.), `get-shit-done/workflows/execute-phase.md` (Step 7.0–7.3).
result: pass

### 5. Pattern A/B Letter-Suffix Failures — gsd-verifier.md Detected
expected: Test output shows FAIL for `agents/gsd-verifier.md` in the Pattern A/B corpus block, listing letter-suffix steps as violations (Step 2a, Step 2b, Step 2c, Step 3b, Step 4b, Step 7b, Step 7c, Step 9b). Letter-suffix steps are flagged as violations — not excluded.
result: pass

### 6. Pattern D Failures Detected
expected: Test output shows FAIL for `get-shit-done/workflows/execute-phase.md` in the Pattern D block due to decimal ordered-list items (`2.5.`, `5.5.`–`5.8.`).
result: pass

### 7. Out-of-Order Failure Detected
expected: Test output shows FAIL for `get-shit-done/workflows/discuss-phase-assumptions.md` — Step 1 follows Step 3 in a sub-section (real out-of-order violation, not false positive).
result: pass

### 8. No False Positives — Pattern C Files
expected: Test output shows NO failures for Pattern C exclude-list files: `plan-phase.md`, `new-milestone.md`, `new-project.md`. These use `## N.N.` heading syntax that is a different pattern, correctly excluded.
result: pass

### 9. Letter-Suffix Unit Test Asserts Violation
expected: The unit test named "flags letter-suffix step (Step 7a) as violation" inside `scanContent() — decimal detection` passes GREEN. The old "does not flag letter-suffix step" test name is gone.
result: pass

### 10. No Regressions in Pre-Existing Suite
expected: Running `npm test` completes with the same pre-existing failure baseline. Only `step-numbering-scan.test.cjs` introduces new failures.
result: pass
note: Pre-existing baseline is 2 W016 failures in ai-evals.test.cjs (confirmed pre-Phase-48). No dispatcher failures. All other failures are from step-numbering-scan.test.cjs corpus RED gate — expected.

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
