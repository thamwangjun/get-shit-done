---
phase: 53
slug: unified-effort-resolver
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-02
---

# Phase 53 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Reconstructed retroactively from phase artifacts (State B) — 2026-06-02.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner (no external framework) |
| **Config file** | none — `package.json` `test` script + `c8` for coverage |
| **Quick run command** | `node --test tests/feat-53-unified-effort-resolver.test.cjs tests/feat-53-config-sites-and-golden.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~2 seconds (phase 53 suites); full suite longer |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/feat-53-*.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~2 seconds (phase suites)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 53-01-01 | 01 | 1 | RESOLVE-01 | — | Static `{claude, codex}` allowlist (no auto-admit of future runtimes) | unit | `node --test tests/feat-53-unified-effort-resolver.test.cjs` | ✅ | ✅ green |
| 53-01-02 | 01 | 1 | RESOLVE-02 | — | Precedence: override → slot → Codex per-tier → null | unit | `node --test tests/feat-53-unified-effort-resolver.test.cjs` | ✅ | ✅ green |
| 53-01-02 | 01 | 1 | RESOLVE-03 | — | Slot effort wins over Codex per-tier fallback | unit | `node --test tests/feat-53-unified-effort-resolver.test.cjs` | ✅ | ✅ green |
| 53-01-02 | 01 | 1 | RESOLVE-04 | T-53-03 | `max` returned verbatim; resolver never clamps max→xhigh | unit | `node --test tests/feat-53-unified-effort-resolver.test.cjs` | ✅ | ✅ green |
| 53-01-02 | 01 | 1 | RESOLVE-05 | T-53-02 | Non-{claude,codex} hard no-op even with override ;effort | unit | `node --test tests/feat-53-unified-effort-resolver.test.cjs` | ✅ | ✅ green |
| 53-01-02 | 01 | 1 | RESOLVE-06 | — | inherit profile / resolved inherit tier → null | unit | `node --test tests/feat-53-unified-effort-resolver.test.cjs` | ✅ | ✅ green |
| 53-01-02 | 01 | 1 | CONFIG-01 | — | `model_overrides.<agent>` ;effort emitted; bare omits | unit | `node --test tests/feat-53-unified-effort-resolver.test.cjs` | ✅ | ✅ green |
| 53-02-01 | 02 | 2 | CONFIG-02 | T-53-04 | `models.<phase-type>` accepts model;effort | unit | `node --test tests/feat-53-config-sites-and-golden.test.cjs` | ✅ | ✅ green |
| 53-02-01 | 02 | 2 | CONFIG-03 | T-53-04 | `model_profile_overrides.<runtime>` accepts model;effort | unit | `node --test tests/feat-53-config-sites-and-golden.test.cjs` | ✅ | ✅ green |
| 53-01-02 / 53-02-01 | 01,02 | 1,2 | CONFIG-04 | T-53-01, T-53-04 | Malformed token degrades to null + one-time warn via parseModelEffort | unit | `node --test tests/feat-53-*.test.cjs` | ✅ | ✅ green |
| 53-02-02 | 02 | 2 | D-08 (golden) | T-53-05 | Bare-config back-compat + same-slot model+effort across ~33 agents × 4 profiles | unit | `node --test tests/feat-53-config-sites-and-golden.test.cjs` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. The Node.js built-in `--test` runner and `tests/helpers.cjs` fixtures were already present; no framework install or stub scaffolding was needed.

---

## Manual-Only Verifications

All phase behaviors have automated verification. This is a pure config-resolution phase (`resolveReasoningEffortInternal`, `resolveTierEntry`, static allowlist) with no UI, network, or interactive surface — every requirement is exercised by `assert.strictEqual` unit tests.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none — existing infra)
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-02

---

## Validation Audit 2026-06-02

Reconstructed from phase artifacts (State B — no prior VALIDATION.md, SUMMARY files present).

| Metric | Count |
|--------|-------|
| Requirements | 10 (RESOLVE-01..06, CONFIG-01..04) + D-08 golden |
| COVERED | 11 |
| PARTIAL | 0 |
| MISSING | 0 |
| Gaps found | 0 |
| Resolved | 0 (none needed) |
| Escalated | 0 |

**Test evidence:** `node --test tests/feat-53-unified-effort-resolver.test.cjs tests/feat-53-config-sites-and-golden.test.cjs` → 289 pass, 0 fail. Every requirement ID is referenced in test descriptions and asserted via `assert.strictEqual`.
