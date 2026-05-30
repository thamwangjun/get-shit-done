---
phase: "44"
slug: resolver-core
status: compliant
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-28
---

# Phase 44 — Validation Strategy

> Per-phase validation contract for `resolveIncludes()` — resolver-core.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner (no external framework) |
| **Config file** | `package.json` (`scripts.test`) |
| **Quick run command** | `node --test tests/resolve-includes.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~110ms (quick), ~30s (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/resolve-includes.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~110ms (quick run)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 44.1 | 1 | 1 | RESV-01 | — | `@~/.claude/` bare-line is inlined, not executed as shell | unit | `node --test tests/resolve-includes.test.cjs` | ✅ | ✅ green |
| 44.1 | 1 | 1 | RESV-02 | — | `` !`cat $HOME/.claude/...` `` bare-line is inlined verbatim, not shell-executed | unit | `node --test tests/resolve-includes.test.cjs` | ✅ | ✅ green |
| 44.1 | 1 | 1 | RESV-03 | — | `@~` inside `${...}` template passes through without filesystem access | unit | `node --test tests/resolve-includes.test.cjs` | ✅ | ✅ green |
| 44.1 | 1 | 1 | RESV-04 | — | Bare `@`-lines inside fenced blocks are emitted verbatim | unit | `node --test tests/resolve-includes.test.cjs` | ✅ | ✅ green |
| 44.1 | 1 | 1 | RESV-05 | — | Circular include chain throws with full path chain | unit | `node --test tests/resolve-includes.test.cjs` | ✅ | ✅ green |
| 44.1 | 1 | 1 | RESV-06 | — | Missing file error names both source and target | unit | `node --test tests/resolve-includes.test.cjs` | ✅ | ✅ green |
| 44.1 | 1 | 1 | RESV-07 | — | Include depth >= 3 throws descriptive error | unit | `node --test tests/resolve-includes.test.cjs` | ✅ | ✅ green |
| 44.2 | 1 | 1 | all above | — | Test file exists with 7 passing tests | unit | `node --test tests/resolve-includes.test.cjs` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Node.js `--test` runner is built-in; no installation needed.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have automated verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 not required — existing infrastructure covers all requirements
- [x] No watch-mode flags
- [x] Feedback latency < 200ms (quick run ~110ms)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-28

---

## Validation Audit 2026-05-28

| Metric | Count |
|--------|-------|
| Gaps found | 2 |
| Resolved | 2 |
| Escalated | 0 |

**Resolved gaps:**
- RESV-02 (`!`cat $HOME/.claude/...`` inlining) — test 6 added to `tests/resolve-includes.test.cjs`
- RESV-04 (fenced block skip) — test 7 added to `tests/resolve-includes.test.cjs`
