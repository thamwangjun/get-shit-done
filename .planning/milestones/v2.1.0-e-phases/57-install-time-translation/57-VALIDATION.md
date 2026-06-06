---
phase: 57
slug: install-time-translation
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-05
audited: 2026-06-06
---

# Phase 57 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner + `c8` coverage |
| **Config file** | none (package.json `test` script: `node --test tests/`) |
| **Quick run command** | `node --test tests/feat-57-install-translation.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds (quick) / ~60 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/feat-57-install-translation.test.cjs`
- **After every plan wave:** Run `node --test tests/feat-53-unified-effort-resolver.test.cjs tests/codex-config.test.cjs tests/feat-57-install-translation.test.cjs`
- **Before `/gsd-verify-work`:** `npm run test:coverage` green (≥70% on `bin/lib/*.cjs`)
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 57-W0 | Wave 0 | 0 | INSTALL-01/02 | — | N/A | test-stubs | `node --test tests/feat-57-install-translation.test.cjs` | ✅ | ✅ green |
| translateEffortForCodex unit | core | 1 | INSTALL-01 | — | N/A | unit | `node --test tests/feat-57-install-translation.test.cjs` | ✅ | ✅ green |
| resolver Claude-form-neutral (`max` verbatim, never `xhigh`) | core | 1 | INSTALL-01 | — | N/A | unit | same | ✅ | ✅ green |
| haiku-tier → `null` on claude AND codex (no medium floor) | core | 1 | INSTALL-02 | — | haiku exclusion wins over explicit `;effort` override (D-03, A1 resolved: haiku always omits) | unit | same | ✅ | ✅ green |
| Codex install emits `xhigh` for opus slot assigned `max` | install | 2 | INSTALL-02 | — | N/A | integration | same | ✅ | ✅ green |
| Codex install emits `medium` for bare opus/sonnet slot (floor) | install | 2 | INSTALL-02 | — | N/A | integration | same | ✅ | ✅ green |
| Codex install emits NO `model_reasoning_effort` for haiku-tier agent | install | 2 | INSTALL-02 | — | N/A | integration | same | ✅ | ✅ green |
| Non-`{claude,codex}` install emits no effort; Claude TOML unchanged (D-04) | install | 2 | INSTALL-02 | — | N/A | integration | same | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/feat-57-install-translation.test.cjs` — stubs for INSTALL-01, INSTALL-02 (new file) — 16 tests, all green
- [x] No new fixtures needed — `createTempDir` + `writeConfig` helpers in `tests/helpers.cjs` suffice
- [x] Framework install: none — built-in runner already used

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-06-06

---

## Validation Audit 2026-06-06

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All 8 task rows mapped to `tests/feat-57-install-translation.test.cjs` (16 tests, 16/16 green). No MISSING or PARTIAL gaps — VALIDATION.md was drafted pre-execution; this audit reconciles it with the implemented + verified state (cross-checked against 57-VERIFICATION.md, score 9/9).
