---
phase: 04
slug: fix-hooks-installation
status: complete
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-17
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | none |
| **Quick run command** | `node --test tests/install-hooks-copy.test.cjs tests/bug-1834-sh-hooks-installed.test.cjs tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` |
| **Full suite command** | `node --test tests/install-hooks-copy.test.cjs tests/bug-1834-sh-hooks-installed.test.cjs tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command above
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | FIX-01 | T-04-01 | `buildScript` path constructed from trusted `src` root, no user-controlled input | integration | `node --test tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` | ✅ | ✅ green |
| 04-01-02 | 01 | 1 | FIX-02 | — | N/A | integration | `node --test tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs` | ✅ | ✅ green |
| 04-01-03 | 01 | 1 | FIX-01 (bundled path unchanged) | — | N/A | integration | `node --test tests/install-hooks-copy.test.cjs` | ✅ | ✅ green |
| 04-01-04 | 01 | 1 | FIX-01 (.sh hook copy) | — | N/A | integration | `node --test tests/bug-1834-sh-hooks-installed.test.cjs` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-17

---

## Validation Audit 2026-04-17
| Metric    | Count |
|-----------|-------|
| Gaps found  | 2 |
| Resolved    | 2 |
| Escalated   | 0 |
