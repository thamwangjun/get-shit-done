---
phase: 39
slug: stage-and-commit-tests-sdk-validation
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-22
---

# Phase 39 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner |
| **Config file** | none — standard `node --test` |
| **Quick run command** | `node scripts/stage-batch-4.cjs` (dry-run via flag) |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test` (existing test suite)
- **After every plan wave:** Verify staged files are subset of expected list
- **Before `/gsd-verify-work`:** Confirm `git diff --cached --name-only` matches expected Batch 4 file list
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 39-01-01 | 01 | 1 | STAGE-04 | — | N/A (script only stages files) | integration | `node scripts/stage-batch-4.cjs && git diff --cached --name-only` | ✅ | ✅ green |
| 39-01-02 | 01 | 1 | STAGE-04 | — | Verifies git status clean, correct commit message, expected file scope, staging script untracked | smoke | `COMMIT_MSG=$(git log -n 1 --pretty=format:%s); if [[ "$COMMIT_MSG" != "test: refactor core tests and SDK validation (Batch 4)" ]]; then echo "FAIL: commit message"; exit 1; fi; STAGED=$(git diff --cached --name-only); if [[ -n "$STAGED" ]]; then echo "FAIL: staged files remain"; exit 1; fi; IN_COMMIT=$(git show --name-only --pretty=format: HEAD | grep -c "stage-batch-4"); if [[ "$IN_COMMIT" -ne 0 ]]; then echo "FAIL: stage-batch-4 in commit"; exit 1; fi; echo "OK"` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `scripts/stage-batch-4.cjs` — stubs for STAGE-04 batch staging
- [x] `tests/stage-batch-4.test.cjs` — tests for the staging script (if applicable)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Staged files are subset of expected Batch 4 list | STAGE-04 | Git index inspection | `git diff --cached --name-only` — confirm only tests/*.test.cjs, scripts/run-tests.cjs, sdk/src/cli.ts |
| Commit message matches convention | STAGE-04 | Commit inspection | `git log -1 --format=%s` — must be `test: refactor core tests and SDK validation (Batch 4)` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** complete
