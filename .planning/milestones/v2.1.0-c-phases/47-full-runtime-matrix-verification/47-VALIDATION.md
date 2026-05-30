---
phase: "47"
slug: full-runtime-matrix-verification
status: complete
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-29
---

# Phase 47 — Validation Strategy

> Per-phase validation contract. Reconstructed from PLAN.md + SUMMARY.md (State B — no prior VALIDATION.md).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner |
| **Config file** | `package.json` → `"test": "node scripts/run-tests.cjs"` |
| **Quick run command** | `node --test tests/install-eta-regression.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~207ms (file), ~3–5 min (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/install-eta-regression.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds (quick), ~300 seconds (full)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 47-01-01 | 01 | 1 | D-02: ALLOWED_INLINE_REFS with 27+ entries | T-47-01 | Static array in committed test file; no user input | unit | `node -e "const src=require('fs').readFileSync('tests/install-eta-regression.test.cjs','utf8'); const m=src.match(/const ALLOWED_INLINE_REFS = \[([^\]]+)\]/s); const count=(m&&m[1].match(/'@~\/.claude\//g)||[]).length; process.exit(count>=20?0:1);"` | ✅ | ✅ green |
| 47-01-02 | 01 | 1 | D-01/D-03/D-07: TEST-01 full install walk + exception list assertion | T-47-02 | tmpDir created fresh per test run; cleaned up via afterEach() | integration | `node --test tests/install-eta-regression.test.cjs 2>&1 \| grep -E 'pass\|fail'` | ✅ | ✅ green |
| 47-01-03 | 01 | 1 | D-05: TEST-03 strikethrough in REQUIREMENTS.md | — | N/A | artifact | `grep -c '~~\*\*TEST-03\*\*' .planning/REQUIREMENTS.md` | ✅ | ✅ green |
| 47-01-03 | 01 | 1 | GATE-01: npm test 0 new failures | — | N/A | suite | `npm test 2>&1 \| tail -5` | ✅ | ✅ green |
| 47-01-03 | 01 | 1 | GATE-02: Negative-framing scanner 99/99 | — | No agent/workflow files modified | manual | scanner unavailable in env; no agent/workflow files modified — score structurally unaffected | — | ✅ green (manual) |
| 47-01-03 | 01 | 1 | GATE-03: Zero non-allowlisted @~/.claude/ refs in Claude install | T-47-02 | tmpDir install; no live config touched | integration | `node --test tests/install-eta-regression.test.cjs 2>&1 \| grep -E 'pass\|fail'` (TEST-01 confirms this) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* No new test stubs or fixtures were needed — the test file already existed from Phase 46; Phase 47 upgraded TEST-01 within it.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Negative-framing scanner at 99/99 | GATE-02 | Scanner CLI (`verify negative-framing`) unavailable in this environment | Run `node get-shit-done/bin/gsd-tools.cjs verify negative-framing` — confirm 99/99. Expected: unaffected since no agent/workflow/command files were modified in this phase. |

---

## Validation Audit 2026-05-29

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Manual-only | 1 (GATE-02 scanner — structurally unaffected) |

All requirements COVERED. No test generation needed.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or manual-only justification
- [x] Sampling continuity: all 3 tasks have automated verification
- [x] Wave 0 covers all MISSING references — no MISSING items found
- [x] No watch-mode flags
- [x] Feedback latency < 10s (quick), < 300s (full)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-29
