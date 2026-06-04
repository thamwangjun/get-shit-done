---
phase: 56
slug: spawn-template-wiring
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-04
---

# Phase 56 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner (CommonJS) |
| **Config file** | none — runner is built into Node ≥22 |
| **Quick run command** | `node --test tests/phase-56-effort-wiring.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~35 ms (guard test) / full suite ~minutes |

---

## Sampling Rate

- **After every task commit:** Run the affected test file
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** < 56 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 56-01 | 01 | 1 | D-08 medium floor in `resolveReasoningEffortInternal` | T-56-01 | enum-constrained effort token | unit | `node --test tests/core.test.cjs` | ✅ | ✅ green |
| 56-01 | 01 | 1 | `resolve-model-effort` CLI query (cmdResolveModelEffort + dispatch) | T-56-01 | N/A | unit | `node --test tests/commands.test.cjs` | ✅ | ✅ green |
| 56-02 | 02 | 1 | Group A (8 init-fed workflows) carry effort token adjacent to `model=` | T-56-A1 | N/A | structural | `node --test tests/phase-56-effort-wiring.test.cjs` | ✅ | ✅ green |
| 56-03 | 03 | 1 | Group B (10 standalone-resolve sites) carry `resolve-model-effort gsd-<agent>` capture line | T-56-B1 | N/A | structural | `node --test tests/phase-56-effort-wiring.test.cjs` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure (Node built-in `--test` runner) covers all phase requirements. The Group A/B markdown wiring guard was added retroactively as `tests/phase-56-effort-wiring.test.cjs` (18 assertions).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `effort=` Agent() argument is honored by the runtime at spawn time | D-02 | Per-invocation effort is not yet confirmed in Claude Code's documented model-resolution chain (D-02 residual risk). Wiring is forward-compatible; structural presence is guarded, runtime activation is not. | Observe agent spawn behavior once Claude Code documents per-invocation effort support. |

*Structural presence of the wiring is automated; runtime honoring of the forward-compatible `effort=` carrier remains environment-dependent.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 56s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-04

---

## Validation Audit 2026-06-04

| Metric | Count |
|--------|-------|
| Gaps found | 2 (56-02 Group A, 56-03 Group B — no regression guard) |
| Resolved | 2 (structural guard `tests/phase-56-effort-wiring.test.cjs`, 18 assertions) |
| Escalated | 0 |

**Note:** The auditor found that `plan-phase.md` uses `_model_effort_arg` throughout (10×), not the `_effort_param` suffix described in 56-02-SUMMARY.md / 56-VERIFICATION.md. The deviation was corrected before final commit; documentation is stale, implementation is correct. The guard test asserts against ground truth.
