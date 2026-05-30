---
phase: 50
slug: maintenance-script-and-cross-ref-scanner
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-30
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
| 50-01-01 | 01 | 1 | NORM-02 | — | N/A | unit | `node --test tests/step-numbering-scan.test.cjs` | ✅ | ⬜ pending |
| 50-02-01 | 02 | 2 | NORM-02 | — | N/A | unit | `node scripts/normalize-step-numbers.cjs --dry-run` | ❌ W2 | ⬜ pending |
| 50-02-02 | 02 | 2 | NORM-02 | — | N/A | unit | `node scripts/normalize-step-numbers.cjs --dry-run` | ❌ W2 | ⬜ pending |
| 50-03-01 | 03 | 3 | XREF-01 | — | N/A | unit | `node --test tests/cross-file-step-refs.test.cjs` | ❌ W3 | ⬜ pending |
| 50-03-02 | 03 | 3 | XREF-01 | — | N/A | unit | `node --test tests/cross-file-step-refs.test.cjs` | ❌ W3 | ⬜ pending |

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
