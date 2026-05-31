---
phase: 52
slug: parser-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-31
---

# Phase 52 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner (core.cjs) + vitest (sdk) |
| **Config file** | none (node --test); `sdk/vitest.config.ts` (sdk) |
| **Quick run command** | `node --test tests/core.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/core.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 52-01-01 | 01 | 1 | PARSE-01 | — | N/A | unit | `node --test tests/core.test.cjs` | ❌ W0 | ⬜ pending |
| 52-01-02 | 01 | 1 | PARSE-02 | — | N/A | unit | `node --test tests/core.test.cjs` | ❌ W0 | ⬜ pending |
| 52-02-01 | 02 | 2 | PARSE-03 | — | N/A | unit | `node --test tests/core.test.cjs` | ❌ W0 | ⬜ pending |
| 52-03-01 | 03 | 2 | PARSE-04 | — | N/A | unit/parity | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/core.test.cjs` — parser test cases for `parseModelEffort` (PARSE-01, PARSE-02) loading the shared JSON fixture
- [ ] `sdk/src/model-catalog.test.ts` (or existing sdk test) — vitest parity cases loading the same fixture (PARSE-04)
- [ ] Shared JSON fixture file of `{input, expectedModel, expectedEffort}` cases readable by both runners

*Existing infrastructure (node --test + vitest) covers the run harness; only the fixture + new test cases are added.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| One-time typo warning surfaced to stderr | PARSE-01 | Side-channel stderr output; asserted via cache-reset helper rather than stdout capture | Covered by automated test using `_resetRuntimeWarningCacheForTests`; no manual step required |

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
