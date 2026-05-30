---
phase: 49
slug: survey-and-normalization
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-30
audited: 2026-05-30
---

# Phase 49 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner |
| **Config file** | none (zero-dependency) |
| **Quick run command** | `node --test tests/step-numbering-scan.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/step-numbering-scan.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 49-01-01 | 01 | 1 | MAP-01 | — | N/A | integration | `node --test tests/step-numbering-scan.test.cjs` | ✅ | ✅ green |
| 49-02-01 | 02 | 2 | NORM-01 | — | N/A | integration | `npm test` | ✅ | ✅ green |
| 49-03-01 | 03 | 2 | NORM-01 | — | N/A | integration | `npm test` | ✅ | ✅ green |
| 49-04-01 | 04 | 2 | NORM-01 | — | N/A | integration | `npm test` | ✅ | ✅ green |
| 49-05-01 | 05 | 3 | NORM-01 | — | N/A | integration | `npm test` | ✅ | ✅ green |
| 49-06-01 | 06 | 3 | NORM-01 | — | N/A | integration | `npm test` | ✅ | ✅ green |
| 49-07-01 | 07 | 3 | NORM-01 | — | N/A | integration | `npm test` | ✅ | ✅ green |
| 49-08-01 | 08 | 3 | NORM-01 | — | N/A | integration | `npm test` | ✅ | ✅ green |
| 49-09-01 | 09 | 3 | NORM-01 | — | N/A | integration | `npm test` | ✅ | ✅ green |
| 49-10-01 | 10 | 3 | NORM-01 | — | N/A | integration | `npm test` | ✅ | ✅ green |
| 49-11-01 | 11 | 3 | NORM-01 | — | N/A | integration | `npm test` | ✅ | ✅ green |
| 49-12-01 | 12 | 4 | NORM-01 | — | N/A | integration | `npm test` | ✅ | ✅ green |
| 49-13-01 | 13 | 4 | NORM-01 | — | N/A | integration | `npm test` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — `tests/step-numbering-scan.test.cjs` and `npm test` are already in place.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MAP-01 cross-file index completeness | MAP-01 | Index is a reference artifact; completeness checked by human review | Verify every prose "step N.N" ref in execute-plan.md, autonomous.md, profile-user.md, post-merge-gate.md appears in the index |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-05-30

---

## Validation Audit 2026-05-30

| Metric | Count |
|--------|-------|
| Gaps found | 7 |
| Resolved | 7 |
| Escalated | 0 |

**Notes:** All 7 gaps were PARTIAL (stale test assertions). Phase 49 plan 03 renumbered `gsd-phase-researcher.md` ARM step from `## Step 1.5:` → `## Step 3:`, and plan 12 renumbered `quick.md` research step from `Step 4.75` → `Step 7`. Tests in `quick-research.test.cjs` and `gsd-researcher-app-aware.test.cjs` were updated to match. Full suite: 8057 tests, 0 failures.
