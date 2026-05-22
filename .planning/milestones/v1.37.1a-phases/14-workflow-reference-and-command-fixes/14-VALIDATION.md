---
phase: 14
slug: workflow-reference-and-command-fixes
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-22
approved: 2026-04-23
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest (Node.js) |
| **Config file** | package.json (jest config) |
| **Quick run command** | `npm test 2>&1 | grep -E "PASS|FAIL|Tests:"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test 2>&1 | grep -E "PASS|FAIL|Tests:"`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | FRAMING-07 | — | N/A | content | `grep -n "Preserve the existing phase order" get-shit-done/workflows/analyze-dependencies.md` | ✅ | ✅ green |
| 14-01-02 | 01 | 1 | FRAMING-08 | — | N/A | content | `grep -n "Stop here" get-shit-done/workflows/discuss-phase.md` | ✅ | ✅ green |
| 14-01-03 | 01 | 1 | FRAMING-09 | — | N/A | content | `grep -n "Scope auto-fixes" get-shit-done/workflows/execute-plan.md` | ✅ | ✅ green |
| 14-01-04 | 01 | 1 | FRAMING-10 | — | N/A | content | `grep -c "Do NOT:" get-shit-done/workflows/import.md` | ✅ | ✅ green |
| 14-01-05 | 01 | 1 | FRAMING-11 | — | N/A | content | `sed -n '565,572p' get-shit-done/workflows/transition.md` | ✅ | ✅ green |
| 14-01-06 | 01 | 1 | FRAMING-12 | — | N/A | content | `sed -n '565,572p' get-shit-done/workflows/transition.md` | ✅ | ✅ green |
| 14-01-07 | 01 | 1 | FRAMING-13 | — | N/A | content | `grep -n "Source inputs exclusively" get-shit-done/workflows/verify-phase.md` | ✅ | ✅ green |
| 14-01-08 | 01 | 1 | FRAMING-14 | — | N/A | content | `grep -n "Treat these as expected" get-shit-done/references/planner-source-audit.md` | ✅ | ✅ green |
| 14-02-01 | 02 | 1 | FRAMING-15 | — | N/A | content | `grep -n "Treat a flag as active only" commands/gsd/docs-update.md` | ✅ | ✅ green |
| 14-02-02 | 02 | 1 | FRAMING-16 | — | N/A | content | `grep -n "Treat a flag as active only" commands/gsd/execute-phase.md` | ✅ | ✅ green |
| 14-02-03 | 02 | 1 | FRAMING-16 | — | N/A | unit | `npm test 2>&1 | grep "execute-phase-active-flags"` | ✅ | ✅ green |
| 14-02-04 | 02 | 1 | FRAMING-17 | — | N/A | content | `grep -n "Proceed to Step 6 only after" commands/gsd/reapply-patches.md` | ✅ | ✅ green |
| 14-99-01 | all | final | all | — | N/A | unit | `npm test` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. The `tests/negative-framing-scan.test.cjs` suite already validates absence of bare "do not" directives. No new test scaffolding needed before execution begins.

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
