---
phase: 55
slug: catalog-schema-user-handover
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-02
---

# Phase 55 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner |
| **Config file** | none |
| **Quick run command** | `node --test tests/feat-53-unified-effort-resolver.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/feat-53-unified-effort-resolver.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 55-01-01 | 01 | 1 | CATALOG-01, CATALOG-03 | — | N/A (type-only change) | compile + unit | `cd sdk && npx tsc --noEmit && echo TSC_OK` | ✅ | ⬜ pending |
| 55-01-02 | 01 | 1 | CATALOG-01 | — | N/A (resolver strips suffix, no user input) | unit | `node --test tests/feat-53-unified-effort-resolver.test.cjs && node get-shit-done/bin/gsd-tools.cjs query resolve-model gsd-planner` | ✅ | ⬜ pending |
| 55-02-01 | 02 | 2 | CATALOG-01 | — | N/A (read-only check script) | script | `node .planning/phases/55-catalog-schema-user-handover/check-completeness.js; test $? -eq 1 && echo EXPECTED_FAIL_ON_BARE_CATALOG` | ✅ | ⬜ pending |
| 55-03-01 | 03 | 3 | CATALOG-02 | — | N/A (doc generation) | file-check | `test -f .planning/phases/55-catalog-schema-user-handover/HANDOVER.md && command grep -o 'gsd-[a-z-]*' .planning/phases/55-catalog-schema-user-handover/HANDOVER.md \| sort -u \| wc -l` | ✅ | ⬜ pending |
| 55-03-02 | 03 | 3 | CATALOG-02 | — | N/A (blocking checkpoint) | human | human-verify checkpoint | ✅ | ⬜ pending |
| 55-03-03 | 03 | 3 | CATALOG-02 | — | N/A (read-only completeness check) | script + unit | `node .planning/phases/55-catalog-schema-user-handover/check-completeness.js && node get-shit-done/bin/gsd-tools.cjs query resolve-model gsd-planner` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed — Phase 53 resolver test suite (`tests/feat-53-unified-effort-resolver.test.cjs`) covers the back-compat invariant and resolver behavior.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| User assigns model;effort values to all 33 agents | CATALOG-02 | USER-HANDOVER boundary — Claude cannot pre-fill effort values | Follow HANDOVER.md guidance; edit sdk/shared/model-catalog.json directly; run check-completeness.js to verify |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are human-verify checkpoints
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none — existing infra sufficient)
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-02
