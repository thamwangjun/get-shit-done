---
phase: 45
slug: pipeline-integration
status: validated
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-28
---

# Phase 45 — Validation Strategy

> Per-phase validation contract for Phase 45: pipeline-integration (Eta v4 install-time template engine).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner |
| **Config file** | none — Node.js built-in, no config file |
| **Quick run command** | `node --test tests/bug-phase45-eta-wiring.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~1 second (quick), ~60 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/bug-phase45-eta-wiring.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 45-01-T1 | 01 | 1 | INTG-01 | — | N/A | integration | `node --test tests/bug-phase45-eta-wiring.test.cjs` | ✅ | ✅ green |
| 45-01-T2 | 01 | 1 | INTG-04 | — | N/A | integration | `node --test tests/install.test.cjs` | ✅ | ✅ green |
| 45-01-T3 | 01 | 1 | INTG-05 | — | N/A | integration | `node --test tests/install.test.cjs` | ✅ | ✅ green |
| 45-01-T4 | 01 | 1 | INTG-06 | — | N/A | integration | `node --test tests/bug-phase45-eta-wiring.test.cjs` | ✅ | ✅ green |
| 45-02-T1 | 02 | 2 | INTG-02 | — | N/A | integration | `node --test tests/bug-phase45-eta-wiring.test.cjs` | ✅ | ✅ green |
| 45-02-T2 | 02 | 2 | INTG-03 | — | N/A | integration | `node --test tests/bug-phase45-eta-wiring.test.cjs` | ✅ | ✅ green |
| 45-03-T1 | 03 | 3 | INTG-01–06 | — | N/A | docs | manual audit | ✅ | ✅ green |
| 45-04-T1 | 04 | 4 | INTG-01–06 | — | N/A | integration | `npm test` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — no Wave 0 setup needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Eta rendering of installed file content (runtime output) | INTG-04, INTG-05 | End-to-end render output requires a full install run with inspecting the output files at the target runtime path | Run `node bin/install.js --claude --local` and inspect `~/.claude/get-shit-done/workflows/execute-plan.md` to confirm `{%~ include() %}` tags were resolved by Eta during install |

---

## Validation Audit 2026-05-28

| Metric | Count |
|--------|-------|
| Gaps found | 4 |
| Resolved | 4 |
| Escalated | 0 |

**Reconstructed from artifacts (State B):** No prior VALIDATION.md existed; this file was created from PLAN and SUMMARY artifacts on 2026-05-28.

**Tests generated:**
- `tests/bug-phase45-eta-wiring.test.cjs` — 12 tests covering INTG-01, INTG-02, INTG-03, INTG-06 (all pass)

**Pre-existing coverage (no gaps):**
- INTG-04, INTG-05 — covered by `tests/install.test.cjs` (70 tests, all pass after Eta `resolvePath` fix in plan 45-04)
