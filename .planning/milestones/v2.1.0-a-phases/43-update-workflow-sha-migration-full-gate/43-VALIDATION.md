---
phase: "43"
slug: update-workflow-sha-migration-full-gate
status: complete
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-26
---

# Phase 43 — Validation Strategy

> Per-phase validation contract for the SHA migration + full gate phase.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner |
| **Config file** | none (zero-config, invoked directly) |
| **Quick run command** | `node --test tests/bug-2992-check-latest-version.test.cjs tests/update-sha-migration.test.cjs tests/statusline-sha.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~3 seconds (quick), ~60 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/bug-2992-check-latest-version.test.cjs tests/update-sha-migration.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green (excluding 2 pre-existing ai-evals.test.cjs failures)
- **Max feedback latency:** ~3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 43-01-01 | 01 | 1 | UPD-01 | T-43-02 | 15-second timeout on GitHub API request; injectable seam prevents hardcoded network calls in tests | unit | `node --test tests/bug-2992-check-latest-version.test.cjs` | ✅ | ✅ green |
| 43-01-02 | 01 | 1 | TEST-03 | — | N/A | unit | `node --test tests/bug-2992-check-latest-version.test.cjs` | ✅ | ✅ green |
| 43-01-03 | 01 | 1 | UPD-02 (D-04,D-05) | — | No curl/wget in update workflow; GitHub link only | static content | `node --test tests/changeset-cli.test.cjs` (F1 test) | ✅ | ✅ green |
| 43-01-03b | 01 | 1 | UPD-02 (D-07–D-11) | — | Binary SHA equality; no dev-install branch; no no-network conditional | static content | `node --test tests/update-sha-migration.test.cjs` | ✅ | ✅ green |
| 43-01-04 | 01 | 1 | GATE-01 | — | 0 regressions beyond 2 pre-existing ai-evals.test.cjs failures | integration | `npm test` | ✅ | ✅ green |
| STAT-01 | — | — | UPD-01 (statusline) | — | parseV() semver block removed from gsd-statusline.js | static content | `node --test tests/statusline-sha.test.cjs` | ✅ | ✅ green |
| STAT-02 | — | — | UPD-01 (statusline) | — | stale-hooks block simplified; no isDevInstall IIFE | static content | `node --test tests/statusline-sha.test.cjs` | ✅ | ✅ green |

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
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-26

---

## Validation Audit 2026-05-26

| Metric | Count |
|--------|-------|
| Gaps found | 5 |
| Resolved | 5 |
| Escalated | 0 |

### Gap Resolution

All 5 gaps were content assertions on `get-shit-done/workflows/update.md` (D-07 through D-11). Resolved by creating `tests/update-sha-migration.test.cjs` (15 tests, 15 pass). Additionally committed untracked `tests/statusline-sha.test.cjs` (4 tests, 4 pass).

Commit: `52023f97` — `test(phase-43): add Nyquist validation tests for SHA migration`
