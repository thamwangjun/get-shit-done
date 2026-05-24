---
phase: "40"
slug: stage-and-commit-maintenance-logs-state
status: partial
nyquist_compliant: false
wave_0_complete: true
created: 2026-05-23
---

# Phase 40 — Validation Strategy

> Per-phase validation contract for the Batch 5 commit history refactor.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner |
| **Config file** | none (test files in `tests/*.test.cjs`) |
| **Quick run command** | `node --test tests/stage-batch-5.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/stage-batch-5.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 40-01-T1a | 01 | 1 | STAGE-05 | T-40-01 | stage-batch-5.cjs structural validation (self-ref, full log, no lib files, logs/ handling, commit msg) | structural | `node --test tests/stage-batch-5.test.cjs` | ✅ | ✅ green |
| 40-01-T1b | 01 | 1 | STAGE-05 | — | .gitignore excludes .antigravity/, .antigravitycli/, .claudeignore under # Antigravity CLI comment | structural | `node --test tests/stage-batch-5.test.cjs` | ✅ | ✅ green |
| 40-01-T2a | 01 | 1 | STAGE-05 | T-40-02 | fix(lib) commit contains only security.cjs and state.cjs | structural | manual — see manual-only section | — | ⬜ pending |
| 40-01-T2b | 01 | 1 | STAGE-05 | — | state.cjs cross-milestone progress preservation (#3242 Bug A) | unit | `node --test tests/state.test.cjs` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers most phase requirements. Missing tests are captured in Manual-Only per user decision.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `tests/stage-batch-5.test.cjs` — structural validation of stage-batch-5.cjs (syntax, file set, commit message, logs/ readdirSync, self-referential entry, duplicate detection, branch guard, subset verification) | STAGE-05 | User chose skip — mark manual-only | Run `node --check scripts/stage-batch-5.cjs` (syntax); grep stage-batch-5.cjs for `'chore(maintenance): refactor quick tasks, logs, and state files (Batch 5)'` (commit message x2); grep for `stage-batch-5.cjs` in expectedFiles (self-referential D-04); grep for `--pretty=format:%s` without `-n 1` (full log D-03); grep for `readdirSync` and `logs/` (D-03 logs handling) |
| `.gitignore` Antigravity block: `.antigravity/`, `.antigravitycli/`, `.claudeignore` under `# Antigravity CLI` comment | STAGE-05 | User chose skip — mark manual-only | `grep -n 'Antigravity' .gitignore` — must show comment block; `grep -n '.antigravity' .gitignore` — must show all three entries; verify `.claudeignore` has no trailing slash |
| `state.cjs` cross-milestone progress tracking fix | STAGE-05 | User chose skip — mark manual-only (state.test.cjs lacks cross-milestone coverage) | Review `get-shit-done/bin/lib/state.cjs` for cross-milestone progress accumulation logic; run `node --test tests/state.test.cjs` to confirm existing tests green |
| `fix(lib)` commit stages only `security.cjs` and `state.cjs` (T-40-02 boundary) | STAGE-05 | Git history verification — not automatable via unit test | `git show --name-only $(git log --oneline --pretty=format:%H | xargs -I{} git log --format="%H %s" -n1 {} | grep 'fix(lib): regex boundary' | awk '{print $1}')` — must show exactly two files |

---

## Validation Audit 2026-05-23

| Metric | Count |
|--------|-------|
| Gaps found | 4 |
| Resolved (automated) | 0 |
| Escalated to manual-only | 4 |

## Validation Audit 2026-05-24

| Metric | Count |
|--------|-------|
| Gaps found | 3 automatable (T1a, T1b, T2b) + 1 manual-only (T2a) |
| Resolved (automated) | 3 |
| Escalated to manual-only | 0 |
| New test files | `tests/stage-batch-5.test.cjs` (16 tests, T1a + T1b) |
| Extended test files | `tests/state.test.cjs` (+1 test, T2b cross-milestone #3242) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** partial — 3/4 gaps automated (T1a, T1b, T2b green); T2a remains manual-only (git history boundary, not unit-testable)
