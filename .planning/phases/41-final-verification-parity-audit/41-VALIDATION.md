---
phase: 41
slug: final-verification-parity-audit
status: complete
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-24
---

# Phase 41 — Validation Strategy

> Per-phase validation contract for the final-verification-parity-audit phase.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner |
| **Config file** | `package.json` (scripts.test) |
| **Quick run command** | `node --test tests/phase-41-nyquist.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~2 seconds (quick), ~60 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/phase-41-nyquist.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~2 seconds (quick), ~60 seconds (full)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 41-01-01 | 01 | 1 | VALID-01 | T-41-01 | Parity diff output captured in 41-VERIFICATION.md with only allowlisted files | integration | `node --test tests/phase-41-nyquist.test.cjs` | ✅ | ✅ green |
| 41-01-02 | 01 | 1 | VALID-01 | T-41-01 | ROADMAP.md Phase 39 row shows Complete with date 2026-05-22 (D-07 inline fix) | integration | `node --test tests/phase-41-nyquist.test.cjs` | ✅ | ✅ green |
| 41-01-03 | 01 | 1 | VALID-01 | T-41-01 | 41-01-SUMMARY.md documents VALID-01, VALID-02, and D-07 decisions | integration | `node --test tests/phase-41-nyquist.test.cjs` | ✅ | ✅ green |
| 41-01-04 | 01 | 1 | VALID-01 | T-41-03 | Phase-41 commits exist in git history with correct conventional commit messages | integration | `node --test tests/phase-41-nyquist.test.cjs` | ✅ | ✅ green |
| 41-01-05 | 01 | 1 | VALID-02 | — | Negative-framing scanner 0 violations, 0 warnings | integration | `node --test tests/negative-framing-scan.test.cjs` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No Wave 0 setup needed — `tests/phase-41-nyquist.test.cjs` was created by gsd-nyquist-auditor as part of this retroactive audit.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Parity diff confirms zero unexpected divergence | VALID-01 | The `backup-thamw-main-before-squash` branch is a point-in-time artifact from the squash operation; the raw diff output was captured verbatim in 41-VERIFICATION.md at the time of execution | Inspect `41-VERIFICATION.md` Observable Truths table — confirm the diff row shows ✓ VERIFIED with "(empty — no diff in non-allowlisted files)" as evidence |
| npm test 8300+ pass, 0 failures in refactored files | VALID-02 | Test count is not a persistent assertion (it changes as tests are added); the 2 pre-existing failures in ai-evals.test.cjs are upstream-rooted and tracked separately | Run `npm test` and confirm pass count ≥ 8392, fail count 0 or only ai-evals.test.cjs pre-existing failures with zero diff from backup branch |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are documented above
- [x] Sampling continuity: all tasks covered by phase-41-nyquist.test.cjs or negative-framing-scan.test.cjs
- [x] Wave 0 covers all MISSING references (4 gaps resolved by gsd-nyquist-auditor)
- [x] No watch-mode flags
- [x] Feedback latency < 5s (quick run)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-24

---

## Validation Audit 2026-05-24

| Metric | Count |
|--------|-------|
| Gaps found | 4 |
| Resolved | 4 |
| Escalated | 0 |
| Manual-only | 2 |
