---
phase: 59
slug: comment-cleanup
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-07
---

# Phase 59 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Reconstructed from artifacts (State B) — phase already executed and verified.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner (no external framework) |
| **Config file** | none — `package.json` `test` script delegates to `scripts/run-tests.cjs` |
| **Quick run command** | `node --test tests/step-numbering-scan.test.cjs` |
| **Full suite command** | `npm test 2>&1 | tee /tmp/gsd-test-output.txt` |
| **Estimated runtime** | ~0.3s (scanner test) / full suite minutes |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/step-numbering-scan.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~1 second (scanner test)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 59-01-01 | 01 | 1 | DOC-01 | — | N/A | scan | `node --test tests/step-numbering-scan.test.cjs` | ✅ | ✅ green (632/632) |
| 59-01-02 | 01 | 1 | DOC-01 | — | N/A | full-suite | `npm test` | ✅ | ✅ green (0 new failures) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase is a single
mechanical comment deletion — `tests/step-numbering-scan.test.cjs` already runs
632 subtests covering scanner behavior, and that suite is the automated
verification that scanner behavior is unchanged. No new test files needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stale "Phase 48 RED expectation" JSDoc paragraph is absent | DOC-01 | One-time deletion state, not a recurring behavioral invariant. A dedicated regression test asserting a specific deleted comment never returns would be over-engineering for a comment cleanup. | `command grep -c 'Phase 48 RED expectation' tests/step-numbering-scan.test.cjs` returns `0`; `command grep -c 'SCAN_DIRS' tests/step-numbering-scan.test.cjs` returns `≥1` (surrounding docs intact). |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none — existing suite covers behavior)
- [x] No watch-mode flags
- [x] Feedback latency < 1s (scanner test)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-07
