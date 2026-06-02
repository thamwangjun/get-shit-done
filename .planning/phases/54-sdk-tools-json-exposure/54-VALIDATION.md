---
phase: 54
slug: sdk-tools-json-exposure
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-02
audited: 2026-06-02
---

# Phase 54 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner (CLI, `tests/*.test.cjs`); vitest (SDK, `sdk/src/**/*.test.ts`) |
| **Config file** | none for CLI; `sdk/vitest.config.ts` for SDK |
| **Quick run command** | `node --test tests/<file>.test.cjs` (single CLI file) / `npm --prefix sdk test -- <file>` (single SDK file) |
| **Full suite command** | `npm test` (CLI) + `npm --prefix sdk test` (SDK incl. golden parity) |
| **Estimated runtime** | ~30–90 seconds |

---

## Sampling Rate

- **After every task commit:** Run the affected unit test file (`node --test tests/<file>.test.cjs` or SDK equivalent)
- **After every plan wave:** Run `npm test` plus the SDK golden parity suite
- **Before `/gsd-verify-work`:** Full CLI + SDK suites must be green, including the golden read-only parity integration test
- **Max feedback latency:** ~90 seconds

---

## Per-Task Verification Map

> Planner fills one row per task. Every EXPOSE requirement maps to at least one automated assertion below.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 54-01-01 | 01 | 1 | EXPOSE-01 | — / — | N/A | unit | `node --test tests/init.test.cjs` | ✅ | ✅ green |
| 54-01-02 | 01 | 1 | EXPOSE-02 | — / — | N/A | unit | `node --test tests/commands.test.cjs` | ✅ | ✅ green |
| 54-02-01 | 02 | 2 | EXPOSE-03 | — / — | N/A | integration | `npm --prefix sdk test -- read-only-parity` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/init.test.cjs` — assertions that every `*_model` field in init builders has a sibling `*_effort` key, value `null` on bare catalog (EXPOSE-01 / SC#1, SC#4)
- [x] `tests/commands.test.cjs` — assertion that `cmdResolveModel` always emits canonical `effort` field (value `null` when unresolved), and that `reasoning_effort` is no longer emitted (EXPOSE-02 / SC#2)
- [x] SDK golden parity coverage of effort fields reuses existing `sdk/src/golden/read-only-parity.integration.test.ts` (EXPOSE-03 / SC#3) — extend golden rows, no new framework

*Existing infrastructure (Node `--test` + vitest golden harness) covers all phase requirements; only new assertions/fixtures are added.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| — | — | — | — |

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-06-02

---

## Validation Audit 2026-06-02

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All 3 requirements (EXPOSE-01, EXPOSE-02, EXPOSE-03) had test files written during TDD execution. CLI suite: 8594 pass / 0 fail. SDK golden parity confirmed green per plan 54-02 SUMMARY. No gaps required remediation.
