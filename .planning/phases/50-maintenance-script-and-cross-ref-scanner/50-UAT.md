---
status: complete
phase: 50-maintenance-script-and-cross-ref-scanner
source: 50-01-SUMMARY.md, 50-02-SUMMARY.md, 50-03-SUMMARY.md
started: 2026-05-31T00:00:00Z
updated: 2026-05-31T00:01:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Full Test Suite Passes
expected: Run `npm test` from the repo root. All 5006+ tests pass with 0 failures and 0 regressions. The output ends with something like "# pass 5006" and "# fail 0".
result: pass

### 2. Normalize Script: Dry-Run on Clean Corpus
expected: Run `node scripts/normalize-step-numbers.cjs --dry-run` from the repo root. The script exits 0 and prints "No changes needed." — confirming the current corpus has no decimal/letter-suffix step violations.
result: pass

### 3. Normalize Script: Unknown Flag Rejection
expected: Run `node scripts/normalize-step-numbers.cjs --foo`. The script exits non-zero (error) and does NOT write any files. A message like "Unknown flag: --foo" or similar appears in stderr/stdout.
result: pass

### 4. Normalize Script: Synthetic Dirty-Corpus Fix
expected: |
  Inject a violation, run the script, confirm it fixes it, then revert.
  Step-by-step:
  1. Run `echo '### **Step 1.5:** Synthetic test' >> agents/gsd-intel-updater.md` to inject a decimal step label.
  2. Run `node scripts/normalize-step-numbers.cjs --dry-run`. It should report a violation (1 rename in gsd-intel-updater.md).
  3. Run `node scripts/normalize-step-numbers.cjs` (no --dry-run). The decimal step is renumbered.
  4. Run the dry-run again — it should print "No changes needed." confirming idempotency.
  5. Run `git checkout -- agents/gsd-intel-updater.md` to revert.
result: pass

### 5. Cross-File Ref Scanner: All Corpus Subtests Pass
expected: Run `node --test tests/cross-file-step-refs.test.cjs`. It runs 219 tests with 0 failures. The known cross-file refs (execute-plan.md referencing execute-phase.md step 7) resolve correctly as valid.
result: pass

### 6. Cross-File Ref Scanner: Stale Ref Detection (Red Test)
expected: The built-in RED test in `cross-file-step-refs.test.cjs` uses a temp directory fixture to simulate a stale reference and confirms the scanner catches it. This is visible in the test output — it should show as a passing test named something like "detects stale cross-file step ref".
result: pass

### 7. List-Marker Step Detection in Scanner
expected: Run `node --test tests/step-numbering-scan.test.cjs`. The 632 subtests all pass, including the 3 companion tests for numbered-list, blockquote, and asterisk-list prefixes. The formerly-limited G-01 test now passes as "detects out-of-order steps preceded by dash list markers".
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
