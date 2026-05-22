---
phase: 32
slug: quick-test-fixes
status: compliant
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-19
audited: 2026-05-19
---

# Phase 32 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node --test`) |
| **Config file** | none |
| **Quick run command** | `node --test tests/managed-hooks.test.cjs` |
| **Full suite command** | `node scripts/run-tests.cjs` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/managed-hooks.test.cjs`
- **After every plan wave:** Run `node scripts/run-tests.cjs`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 32-01-01 | 01 | 1 | HOOKS-01 | T-32-01 | MANAGED_HOOKS array correctly tracks all shipped hook files | unit | `node --test tests/managed-hooks.test.cjs` | ✅ | ✅ green |
| 32-01-02 | 01 | 1 | TEST-02 | T-32-02 | Windows npm spawn platform gate tests skipped (not failing) | skip | `node --test tests/gsd-check-update-worker-platform-gate.test.cjs` | ✅ | ✅ green |
| 32-01-03 | 01 | 1 | PATH-01 | — | extract-learnings.md path test passes with hyphen filename | unit | `node --test tests/phase-30-affirmative-replacements.test.cjs` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. All three requirements have pre-existing test files that directly target the changed behavior — no new test stubs were needed.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Gap Analysis (Retroactive Audit — 2026-05-19)

All requirements classified **COVERED** at audit time:

| Requirement | Test File | Live Result | Coverage |
|-------------|-----------|-------------|----------|
| HOOKS-01 | `tests/managed-hooks.test.cjs` | 3 pass, 0 fail | COVERED |
| TEST-02 | `tests/gsd-check-update-worker-platform-gate.test.cjs` | 0 tests, 1 suite skipped, 0 fail | COVERED |
| PATH-01 | `tests/phase-30-affirmative-replacements.test.cjs` | 9 pass, 0 fail | COVERED |

No gaps found — auditor spawn skipped per workflow (no gaps → skip to Step 6, compliant).

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-19

---

## Validation Audit 2026-05-19

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

Live re-verification confirms all three requirements COVERED and green:
- HOOKS-01: 3 pass, 0 fail (`managed-hooks.test.cjs`)
- TEST-02: suite skipped, 0 fail (`gsd-check-update-worker-platform-gate.test.cjs`)
- PATH-01: 9 pass, 0 fail (`phase-30-affirmative-replacements.test.cjs`)
