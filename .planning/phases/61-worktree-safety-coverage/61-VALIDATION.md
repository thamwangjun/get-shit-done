---
phase: 61
slug: worktree-safety-coverage
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-08
---

# Phase 61 — Validation Strategy

> Per-phase validation contract for the submodule exclusion guard regression test.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner (v24+) |
| **Config file** | none — uses `node --test` directly; full suite via `node scripts/run-tests.cjs` |
| **Quick run command** | `node --test tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` |
| **Full suite command** | `npm test 2>&1 | tee /tmp/gsd-test-output.txt` |
| **Estimated runtime** | ~35ms (file) / ~2 min (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/bug-3097-3099-executor-worktree-path-safety.test.cjs`
- **After every plan wave:** Run `npm test 2>&1 | tee /tmp/gsd-test-output.txt`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 35ms (file-level) / 120s (full suite)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 61-01-01 | 01 | 1 | WSC-01 (SC-1: worktree-positive `.git/worktrees/`) | — | `gsd-executor.md` `<task_commit_protocol>` block contains standalone `.git/worktrees/` token; upstream merge cannot silently drop it | unit | `node --test tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` | ✅ | ✅ green |
| 61-01-01 | 01 | 1 | WSC-01 (SC-2: submodule skip `GIT_CONTENT=`) | — | Protocol block contains `GIT_CONTENT=` empty-string reset — proves submodule paths exit the worktree guard branch | unit | `node --test tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` | ✅ | ✅ green |
| 61-01-01 | 01 | 1 | WSC-01 (SC-2: intent comment `skip worktree guards`) | — | Protocol block contains `skip worktree guards` comment text — documentation-as-contract for prompt-deployed agent | unit | `node --test tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` | ✅ | ✅ green |
| 61-01-01 | 01 | 1 | WSC-01 (SC-3: block-scoped assertions) | — | All three assertions reference sliced `protocol` variable (`executorSrc.slice(protocolIdx, protocolEnd)`), not `executorSrc` directly — prevents vacuous passes from documentation text elsewhere in `gsd-executor.md` | unit | `grep -c "protocol\.includes(" tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` | ✅ | ✅ green |
| 61-01-01 | 01 | 1 | WSC-01 (SC-4: full suite green) | — | `npm test` exits 0 with 0 new failures vs baseline (8268 total, 8256 pass, 0 fail, 12 skipped) | integration | `npm test 2>&1 \| tee /tmp/gsd-test-output.txt` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

No Wave 0 setup was needed: Node.js built-in `--test` runner was already in use; `tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` already existed (from Phase 60 / bugs #3097/#3099); `executorSrc` module-scope constant was already available for reuse.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

The sole WSC-01 requirement — that the `<task_commit_protocol>` block in `gsd-executor.md` structurally distinguishes worktree from submodule `.git` paths — is fully asserted by three standalone `assert.ok` calls in the `phase-61: submodule exclusion guard` describe block.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify — Task 61-01-01 verified via `node --test` and `npm test`
- [x] Sampling continuity: only 1 task in phase; no gap possible
- [x] Wave 0: no setup required — existing infrastructure covers all requirements
- [x] No watch-mode flags — `node --test` exits after each run; no `--watch`
- [x] Feedback latency: 35ms (file-level quick run, well under any threshold)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-08

---

## Validation Audit 2026-06-08

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All WSC-01 success criteria (SC-1 through SC-4) were COVERED at audit time. No auditor agent needed.
Test run at audit: `node --test tests/bug-3097-3099-executor-worktree-path-safety.test.cjs` → 8 tests, 8 pass, 0 fail, 0 skipped.
