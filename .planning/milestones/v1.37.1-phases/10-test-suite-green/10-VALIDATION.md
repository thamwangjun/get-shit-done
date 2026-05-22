---
phase: 10
slug: test-suite-green
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-19
audited: 2026-04-19
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node --test`) |
| **Config file** | none — uses npm scripts in package.json |
| **Quick run command** | `node --test tests/managed-hooks.test.cjs && node --test tests/verification-overrides.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~60–90 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/managed-hooks.test.cjs && node --test tests/verification-overrides.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | TEST-02 | — | MANAGED_HOOKS array contains gsd-read-injection-scanner.js | integration | `node --test tests/managed-hooks.test.cjs` | ✅ | ✅ green |
| 10-01-02 | 01 | 1 | TEST-01 | — | All 24 agents have `<persona>` not `<role>` | integration | `node --test tests/verification-overrides.test.cjs` | ✅ | ✅ green |
| 10-01-03 | 01 | 2 | TEST-03 | — | agent-size-budget passes for all agents after rename | integration | `node --test tests/agent-size-budget.test.cjs` | ✅ | ✅ green |
| 10-01-04 | 01 | 2 | TEST-04 | — | All 5 fork-specific tests present and passing | integration | `node --test tests/negative-framing-scan.test.cjs && node --test tests/bug-1924-ensure-hooks-dist-on-demand.test.cjs && node --test tests/ios-scaffold-safety.test.cjs && node --test tests/execute-phase-wave.test.cjs && node --test tests/agent-frontmatter.test.cjs` | ✅ | ✅ green |
| 10-01-05 | 01 | 2 | TEST-01 | — | npm test exits 0 with ≥3941 tests | integration | `npm test` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files or framework installs needed.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-04-19

---

## Validation Audit 2026-04-19

| Metric      | Count |
|-------------|-------|
| Gaps found  | 0     |
| Resolved    | 0     |
| Escalated   | 0     |

All 5 requirements verified green by live test runs. No new tests were needed — existing test infrastructure fully covers all phase tasks.
