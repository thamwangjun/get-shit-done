---
phase: 46
slug: regression-test-suite
status: complete
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-29
---

# Phase 46 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner |
| **Config file** | none (zero-config) |
| **Quick run command** | `node --test tests/install-eta-regression.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds (quick), ~60 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/install-eta-regression.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 46-01-01 | 01 | 1 | INTG-01 | T-46-01 | Eta constructor uses default delimiters — no custom `tags` or `parse.raw` | integration | `node --test tests/bug-phase45-eta-wiring.test.cjs` | ✅ | ✅ green |
| 46-01-02 | 01 | 1 | INTG-01 | T-46-02 | All source `.md` files use `<%~ include(` — zero `{%~ include(` survivors | integration | `grep -r '{%~ include' commands/ agents/ get-shit-done/` | — | ✅ green |
| 46-01-03 | 01 | 1 | INTG-01 | T-46-02 | `npm test` passes after delimiter switch — zero new failures | regression | `npm test` | — | ✅ green |
| 46-02-01 | 02 | 2 | TEST-01 | — | Zero installed `.md` files contain bare-line `@~/.claude/` reference | integration | `node --test tests/install-eta-regression.test.cjs` | ✅ | ✅ green |
| 46-02-02 | 02 | 2 | TEST-02 | — | Installed `execute-phase.md` preserves `${CONTEXT_WINDOW < 200000 ? ...}` verbatim | integration | `node --test tests/install-eta-regression.test.cjs` | ✅ | ✅ green |
| 46-02-03 | 02 | 2 | TEST-03 | — | Installed `gsd-executor.md` contains "Mandatory Initial Read" (include inlining confirmed) | integration | `node --test tests/install-eta-regression.test.cjs` | ✅ | ✅ green |
| 46-02-04 | 02 | 2 | TEST-04 | T-46-04 | Circular include throws descriptive Error (not RangeError) with fixture path in message | unit | `node --test tests/install-eta-regression.test.cjs` | ✅ | ✅ green |
| 46-02-05 | 02 | 2 | TEST-05 | T-46-05 | Missing-file include throws `EtaFileResolutionError` propagated unchanged | unit | `node --test tests/install-eta-regression.test.cjs` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

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

**Approval:** approved 2026-05-29

---

## Validation Audit 2026-05-29

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All 6 requirements (INTG-01, TEST-01 through TEST-05) have full automated coverage. Both test files run green:
- `tests/bug-phase45-eta-wiring.test.cjs` — 12/12 pass
- `tests/install-eta-regression.test.cjs` — 5/5 pass

Phase 46 is Nyquist-compliant.
