---
phase: 15
slug: test-suite-gate
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-23
approved: 2026-04-23
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — direct node --test invocation |
| **Quick run command** | `node --test tests/negative-framing-scan.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/negative-framing-scan.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | FRAMING-07–17 | — | N/A | content | `grep -c "Fixed:" .planning/REQUIREMENTS.md` | ✅ | ✅ green |
| 15-01-02 | 01 | 1 | TEST-05 | — | N/A | corpus scan | `node --test tests/negative-framing-scan.test.cjs` | ✅ | ✅ green |
| 15-01-03 | 01 | 1 | TEST-05 | — | N/A | unit | `npm test` | ✅ | ✅ green |

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-23
