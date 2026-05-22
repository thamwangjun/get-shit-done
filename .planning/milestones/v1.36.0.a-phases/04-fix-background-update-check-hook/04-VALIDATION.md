---
phase: "04"
slug: fix-background-update-check-hook
status: complete
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-17
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` runner |
| **Config file** | none — uses `node --test` directly |
| **Quick run command** | `node --test tests/semver-compare.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/semver-compare.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | HOOK-01 | T-04-01 | No false positive when SHA matches (isNewer returns false) | unit | `node --test tests/semver-compare.test.cjs` | ✅ | ✅ green |
| 04-01-02 | 01 | 1 | HOOK-02 | — | Update notification when SHA differs (isNewer returns true) | unit | `node --test tests/semver-compare.test.cjs` | ✅ | ✅ green |
| 04-01-03 | 01 | 1 | HOOK-03 | — | Worker source: isNewer defined before writeResult uses it | static-analysis | `node --test tests/semver-compare.test.cjs` | ✅ | ✅ green |
| 04-01-04 | 01 | 1 | HOOK-04 | — | Worker fetches from fork's GitHub Commits API, not npm registry | static-analysis | `node --test tests/semver-compare.test.cjs` | ✅ | ✅ green |
| 04-01-05 | 01 | 1 | D-05 | — | parseV/isDevInstall removed; stale-hooks warning string present | static-analysis | `node --test tests/gsd-statusline.test.cjs` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Worker actually fetches from live GitHub API and caches result | HOOK-04 | Requires live network and real cache file write | Run `GSD_CACHE_FILE=/tmp/test-cache.json node hooks/gsd-check-update-worker.js`; wait ~10s; inspect `/tmp/test-cache.json` for `latest` SHA and `checked` timestamp |
| Statusline displays `⬆ /gsd-update` when update_available is true | HOOK-01/02 | Requires Claude Code session with real cache file | Write `{"update_available":true,"installed":"a1b2c3d","latest":"b2c3d4e"}` to `~/.cache/gsd/gsd-update-check.json`; observe statusline |

---

## Validation Sign-Off

- [x] All tasks have automated verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 not required — existing test files cover all requirements
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-17
