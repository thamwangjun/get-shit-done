---
phase: 50
slug: maintenance-script-and-cross-ref-scanner
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-30
audited: 2026-05-31
---

# Phase 50 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner |
| **Config file** | none — zero-dependency project |
| **Quick run command** | `node --test tests/step-numbering-scan.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/step-numbering-scan.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 50-01-01 | 01 | 1 | NORM-02 | — | N/A | unit | `node --test tests/step-numbering-scan.test.cjs` | ✅ | ✅ green |
| 50-02-01 | 02 | 2 | NORM-02 | — | N/A | unit | `node scripts/normalize-step-numbers.cjs --dry-run` | ✅ | ✅ green |
| 50-02-02 | 02 | 2 | NORM-02 | — | N/A | unit | `node scripts/normalize-step-numbers.cjs --dry-run` | ✅ | ✅ green |
| 50-03-01 | 03 | 3 | XREF-01 | — | N/A | unit | `node --test tests/cross-file-step-refs.test.cjs` | ✅ | ✅ green |
| 50-03-02 | 03 | 3 | XREF-01 | — | N/A | unit | `node --test tests/cross-file-step-refs.test.cjs` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test stubs needed before execution — tests are the deliverables.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| normalize script renumbers synthetic dirty corpus correctly | NORM-02 | Integration test with real file mutation; automated in Plan 2 tasks via tmp file fixture | Run `node scripts/normalize-step-numbers.cjs` on a test file with decimal steps introduced; confirm rename output matches expected sequence |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-05-31

---

## Validation Audit 2026-05-31
| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All tasks COVERED. Verification commands confirmed green:
- `tests/step-numbering-scan.test.cjs`: 632/632 pass
- `tests/cross-file-step-refs.test.cjs`: 219/219 pass
- `scripts/normalize-step-numbers.cjs --dry-run`: exits 0, "No changes needed."
