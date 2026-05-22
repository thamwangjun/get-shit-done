---
phase: 13
slug: agent-fixes
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-22
approved: 2026-04-23
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — direct node --test invocation |
| **Quick run command** | `node --test tests/agent-frontmatter.test.cjs` |
| **Full suite command** | `npm test -- --test-name-pattern="agent-frontmatter"` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/agent-frontmatter.test.cjs`
- **After every plan wave:** Run `node --test tests/negative-framing-scan.test.cjs && node --test tests/agent-frontmatter.test.cjs`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | FRAMING-01 | — | N/A | corpus scan | `node --test tests/negative-framing-scan.test.cjs` | ✅ | ✅ green |
| 13-01-02 | 01 | 1 | FRAMING-05 | — | N/A | corpus scan | `node --test tests/negative-framing-scan.test.cjs` | ✅ | ✅ green |
| 13-01-03 | 01 | 1 | FRAMING-06 | — | N/A | corpus scan | `node --test tests/negative-framing-scan.test.cjs` | ✅ | ✅ green |
| 13-02-01 | 02 | 1 | FRAMING-02 | — | N/A | corpus scan | `node --test tests/negative-framing-scan.test.cjs` | ✅ | ✅ green |
| 13-02-02 | 02 | 1 | FRAMING-03 | — | N/A | corpus scan | `node --test tests/negative-framing-scan.test.cjs` | ✅ | ✅ green |
| 13-02-03 | 02 | 1 | FRAMING-04 | — | N/A | corpus scan | `node --test tests/negative-framing-scan.test.cjs` | ✅ | ✅ green |
| 13-03-01 | 03 | 2 | (gate) | — | N/A | corpus scan | `node --test tests/negative-framing-scan.test.cjs` | ✅ | ✅ green |
| 13-03-02 | 03 | 2 | (gate) | — | N/A | structural | `node --test tests/agent-frontmatter.test.cjs` | ✅ | ✅ green |

*Status: ✅ green · ❌ red · ⚠️ flaky*

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
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-23
