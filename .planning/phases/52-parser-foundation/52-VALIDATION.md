---
phase: 52
slug: parser-foundation
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-31
audited: 2026-06-02
---

# Phase 52 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner (core.cjs) + vitest (sdk) |
| **Config file** | none (node --test); `sdk/vitest.config.ts` (sdk) |
| **Quick run command** | `node --test tests/parse-model-effort.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/parse-model-effort.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 52-01-01 | 01 | 1 | PARSE-01 | — | N/A | unit | `node --test tests/parse-model-effort.test.cjs` | ✅ | ✅ green |
| 52-01-02 | 01 | 1 | PARSE-02 | — | N/A | unit | `node --test tests/parse-model-effort.test.cjs` | ✅ | ✅ green |
| 52-02-01 | 02 | 2 | PARSE-03 | — | N/A | unit | `node --test tests/parse-model-effort.test.cjs` | ✅ | ✅ green |
| 52-03-01 | 03 | 2 | PARSE-04 | — | N/A | unit/parity | `node --test tests/parse-model-effort-parity.test.cjs && cd sdk && npx vitest run src/parse-model-effort.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/parse-model-effort.test.cjs` — parser test cases for `parseModelEffort` (PARSE-01, PARSE-02), created by Plan 02
- [x] `sdk/src/parse-model-effort.test.ts` — vitest parity cases loading the shared fixture (PARSE-04), created by Plan 03
- [x] `tests/parse-model-effort-parity.test.cjs` — node --test parity cases loading the shared fixture (PARSE-04), created by Plan 03
- [x] `tests/fixtures/parse-model-effort.json` — shared `{input, expectedModel, expectedEffort}` fixture readable by both runners, created by Plan 03

*Existing infrastructure (node --test + vitest) covers the run harness; only the fixture + new test cases are added.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| One-time typo warning surfaced to stderr | PARSE-01 | Side-channel stderr output; asserted via cache-reset helper rather than stdout capture | Covered by automated test using `_resetRuntimeWarningCacheForTests`; no manual step required |

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-06-02 — all 4 tasks green (20/20 unit, 16/16 CJS parity, 16/16 TS parity)

---

## Validation Audit 2026-06-02

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 4 |
| Escalated | 0 |

All Wave 0 test files confirmed present and green. `nyquist_compliant` promoted to `true`.
