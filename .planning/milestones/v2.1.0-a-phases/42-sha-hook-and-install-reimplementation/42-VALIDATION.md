---
phase: "42"
slug: sha-hook-and-install-reimplementation
status: complete
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-26
---

# Phase 42 — Validation Strategy

> Per-phase validation contract for SHA hook and install reimplementation.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner |
| **Config file** | none |
| **Quick run command** | `node --test tests/semver-compare.test.cjs tests/version-detection.test.cjs tests/statusline-sha.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~1 second (quick), ~60 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run quick command above
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 42-01-T1 | 01 | 1 | HOOK-01 | T-42-01 | isNewer uses SHA equality, not semver | static | `node --test tests/semver-compare.test.cjs` | ✅ | ✅ green |
| 42-01-T1 | 01 | 1 | HOOK-02 | T-42-02 | Worker fetches GitHub Commits API; 10s timeout calls writeResult(null) | static | `node --test tests/semver-compare.test.cjs` | ✅ | ✅ green |
| 42-01-T1 | 01 | 1 | HOOK-03 | — | isNewer defined before writeResult; writeResult calls isNewer | static | `node --test tests/semver-compare.test.cjs` | ✅ | ✅ green |
| 42-01-T1 | 01 | 1 | HOOK-04 | — | {{GSD_REPO}}/{{GSD_BRANCH}} placeholders present; https.get used | static | `node --test tests/semver-compare.test.cjs` | ✅ | ✅ green |
| 42-01-T1 | 01 | 1 | HOOK-05 | T-42-01 | No npmjs.com or get-shit-done-cc references in worker | static | `node --test tests/semver-compare.test.cjs` | ✅ | ✅ green |
| 42-01-T2 | 01 | 1 | STAT-01 | — | parseV() semver block removed from statusline | static | `node --test tests/statusline-sha.test.cjs` | ✅ | ✅ green |
| 42-01-T2 | 01 | 1 | STAT-02 | — | Stale-hooks is simple if guard, no IIFE or isDevInstall | static | `node --test tests/statusline-sha.test.cjs` | ✅ | ✅ green |
| 42-01-T3 | 01 | 1 | INST-01 | T-42-04 | install.js uses git rev-parse --short=7 HEAD for version | static | `node --test tests/version-detection.test.cjs` | ✅ | ✅ green |
| 42-01-T3 | 01 | 1 | INST-02 | T-42-03 | install.js falls back to 'no-network' sentinel, not pkg.version | static | `node --test tests/version-detection.test.cjs` | ✅ | ✅ green |
| 42-01-T3 | 01 | 1 | INST-03 | — | install.js replaces {{GSD_REPO}} and {{GSD_BRANCH}} in hook content | static | `node --test tests/version-detection.test.cjs` | ✅ | ✅ green |
| 42-01-T3 | 01 | 1 | INST-04 | — | All {{GSD_VERSION}} replacements use gsdVersion, not pkg.version | static | `node --test tests/version-detection.test.cjs` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. All test files pre-existed or were created prior to this validation audit.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Installed hook files contain resolved SHA, repo, and branch values | INST-01, INST-03, INST-04 | Live install writes to real `$HOME` runtime dirs; cannot be safely redirected to a temp dir in CI | Run `npx get-shit-done-cc --claude`, check `~/.claude/hooks/gsd-check-update-worker.js` for `gsd-hook-version: <7-char SHA>`, GitHub repo URL `thamwangjun/get-shit-done`, and no `{{` template placeholders remaining |
| Update check displays correct stale-hooks warning at runtime | STAT-02 | Requires live hook execution with a stale cache entry | Manually set `stale_hooks` in the GSD cache file and verify statusline shows `⚠ stale hooks — run /gsd:update` without semver-based "dev install" divergence |

---

## Validation Audit 2026-05-26

| Metric | Count |
|--------|-------|
| Gaps found | 4 (INST-03, INST-04, STAT-01, STAT-02) |
| Resolved | 4 |
| Escalated to manual | 0 |

**Note:** Audit found that INST-03, STAT-01, STAT-02 tests already existed in `tests/version-detection.test.cjs` and `tests/statusline-sha.test.cjs`. INST-04 revealed a real implementation bug — 5 of 6 `{{GSD_VERSION}}` replacement sites in `bin/install.js` still used `pkg.version`. All 5 sites were fixed to use `gsdVersion` with companion `{{GSD_REPO}}`/`{{GSD_BRANCH}}` replacements.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 1s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-26
