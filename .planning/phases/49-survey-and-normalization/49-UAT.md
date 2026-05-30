---
status: complete
phase: 49-survey-and-normalization
source: 49-01-SUMMARY.md, 49-02-SUMMARY.md, 49-03-SUMMARY.md, 49-04-SUMMARY.md, 49-05-SUMMARY.md, 49-06-SUMMARY.md, 49-07-SUMMARY.md, 49-08-SUMMARY.md, 49-09-SUMMARY.md, 49-10-SUMMARY.md, 49-11-SUMMARY.md, 49-12-SUMMARY.md, 49-13-SUMMARY.md, 49-prewave3-fix-SUMMARY.md
started: 2026-05-30T00:00:00Z
updated: 2026-05-30T14:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Step-numbering scanner passes 629/0
expected: Run `node --test tests/step-numbering-scan.test.cjs` — output shows 629 pass, 0 fail. This is the single canonical gate for Phase 49's NORM-01 goal.
result: pass

### 2. Full test suite passes
expected: Run `npm test` — exits 0. Pre-existing failures (ai-evals, bug-3321-verifier-runs-probes, gsd-researcher-app-aware, quick-research) may remain but no NEW failures introduced by Phase 49 work.
result: pass

### 3. gsd-verifier.md has no letter-suffix steps
expected: Run `grep -c "Step [0-9]*[a-z]" agents/gsd-verifier.md` — output is 0. The file now uses sequential whole-integer steps 0-18.
result: pass

### 4. execute-phase.md uses whole-integer step numbers
expected: Run `grep -c "step 5\.5\|step 5\.8\|Step 7\.[0-9]" get-shit-done/workflows/execute-phase.md` — output is 0. Previously decimal steps 5.5, 5.6, 5.7, 5.8 and bold labels Step 7.0–7.3 are gone.
result: pass

### 5. quick.md has 15 sequential whole-integer steps
expected: Run `grep -c "Step 2\.5\|Step 4\.5\|Step 4\.75\|Step 5\.5\|Step 5\.6\|Step 6\.25\|Step 6\.5" get-shit-done/workflows/quick.md` — output is 0. The file now has Steps 1-15.
result: pass

### 6. Cross-file refs updated in execute-plan.md
expected: Run `grep -c "step 5\.5" get-shit-done/workflows/execute-plan.md` — output is 0. All three prior references to "execute-phase.md step 5.5" now read "execute-phase.md step 7".
result: pass

### 7. MAP-01 cross-file reference index exists
expected: Run `ls .planning/phases/49-survey-and-normalization/49-MAP-01.md` — file exists. Opening it shows a table with 4 data rows documenting execute-plan.md (×3) and post-merge-gate.md (×1) cross-file references.
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
