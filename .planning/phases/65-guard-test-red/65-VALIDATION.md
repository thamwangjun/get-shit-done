---
phase: 65
slug: guard-test-red
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-09
---

# Phase 65 — Validation Strategy

> Per-phase validation contract for the guard-test-red phase.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` runner |
| **Config file** | `scripts/run-tests.cjs` (custom runner, no external framework) |
| **Quick run command** | `node --test tests/no-issue-citations.test.cjs` |
| **Full suite command** | `npm test 2>&1 \| tee /tmp/gsd-test-output.txt` |
| **Estimated runtime** | ~3 seconds (guard test alone), ~60 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/no-issue-citations.test.cjs`
- **After every plan wave:** Run `npm test 2>&1 | tee /tmp/gsd-test-output.txt`
- **Before `/gsd-verify-work`:** Full suite must be green (except intentional RED corpus failures)
- **Max feedback latency:** ~3 seconds (quick run)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 65-01-01 | 01 | 1 | CITE-03 | T-65-03 | SCAN_DIRS bounded to 5 known dirs; ENOENT tolerated | corpus | `node --test tests/no-issue-citations.test.cjs` | ✅ | ✅ green |
| 65-01-01 | 01 | 1 | CITE-04 | T-65-01 | Hex lookbehind prevents false positives on color tails | corpus (RED) | `node --test tests/no-issue-citations.test.cjs` | ✅ | ✅ green (unit), ❌ red (corpus — intentional) |
| 65-01-01 | 01 | 1 | CITE-05 | T-65-01 | Hex exemption, placeholder exemption, heading exemption, frontmatter exclusion | unit | `node --test tests/no-issue-citations.test.cjs` | ✅ | ✅ green |
| 65-02-01 | 02 | 2 | CITE-03 | T-65-04 | Deletions staged atomically via git rm | filesystem | `[ ! -e scripts/scan-citations.cjs ] && [ ! -e tests/citation-scan.test.cjs ]` | N/A | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Note: corpus describe block in no-issue-citations.test.cjs is intentionally RED until Phase 66 citation cleanup.*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. The plan creates the test file as its primary deliverable (TDD RED pattern) — no stubs needed.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: each task has immediate automated check
- [x] Wave 0: no stubs needed — test file is the deliverable
- [x] No watch-mode flags
- [x] Feedback latency < 5s (quick run: ~3s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-09

---

## Validation Audit 2026-06-09

| Metric | Count |
|--------|-------|
| Requirements audited | 3 (CITE-03, CITE-04, CITE-05) |
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Coverage status | COVERED (all requirements have automated verification) |

### Verification Evidence

- **CITE-03**: `tests/no-issue-citations.test.cjs` exists; `npm test` picks it up automatically (326 tests enumerated including guard test subtests).
- **CITE-04**: 98 violations enumerated across ~45 files (within expected [90, 100] range per 64-FINDINGS); canonical hits confirmed: `planner-graphify-auto-update.md:62 feat-3347 (feat-form)` and `discuss-phase/modes/chain.md:57 #686 (inline)`.
- **CITE-05**: All 9 unit tests pass — hex lookbehind (`#e8c170`, `#22c55e`, `#A78BFA` produce zero hits), PLACEHOLDER_DIGITS exemption (`#1`, `#2`, `#45`, `#123`), heading markers, frontmatter exclusion, code-fence exclusion, thematic-break handling.
- **D-01 independence**: `tests/no-issue-citations.test.cjs` contains no `require()` of deleted `scripts/scan-citations.cjs`; guard runs correctly post-deletion with same violation count.
- **D-02/D-03**: `scripts/scan-citations.cjs` and `tests/citation-scan.test.cjs` deleted and committed (`8bdcd81a`).
