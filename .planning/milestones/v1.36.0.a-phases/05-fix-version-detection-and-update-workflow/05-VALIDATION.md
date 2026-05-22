---
phase: 5
slug: fix-version-detection-and-update-workflow
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-17
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner (no external framework) |
| **Config file** | none — built-in runner requires no config |
| **Quick run command** | `node --test tests/version-detection.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/version-detection.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | INST-01 | — | VERSION file contains 7-char hex SHA, not semver | unit | `node --test tests/version-detection.test.cjs` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 1 | INST-02 | — | Fallback sentinel `no-network` written when git unavailable | unit | `node --test tests/version-detection.test.cjs` | ❌ W0 | ⬜ pending |
| 5-02-01 | 02 | 2 | UPD-01 | — | update.md SHA comparison runs in single bash context | static | `grep -n 'INSTALLED_VERSION\|REMOTE_SHA' get-shit-done/workflows/update.md` | ✅ | ⬜ pending |
| 5-02-02 | 02 | 2 | UPD-02 | — | Cache file cleared after successful update | static | `grep -n 'gsd-update-check.json' get-shit-done/workflows/update.md` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/version-detection.test.cjs` — stubs for INST-01 and INST-02 (new file, created in Wave 1)

*Note: The test file is created as part of Wave 1 execution (not a separate Wave 0 step), since the tests and source fix are tightly coupled in the same plan.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `npm install` from GitHub tarball writes correct SHA to VERSION | INST-01 | Requires live GitHub API and network access | Run `npm install github:get-shit-done/get-shit-done`; verify `cat ~/.claude/get-shit-done/bin/VERSION` matches `git ls-remote https://github.com/get-shit-done/get-shit-done HEAD \| cut -c1-7` |
| `/gsd-update` prints "already on latest" when SHA matches | UPD-01 | Requires actual installed state matching remote HEAD | Install from latest commit; run `/gsd-update`; confirm "already on latest" message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
