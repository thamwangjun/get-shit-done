---
phase: 09
slug: fork-standards-pass
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-18
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | `package.json` scripts section (runs `run-tests.cjs`) |
| **Quick run command** | `node --test tests/negative-framing-scan.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (scanner: ~5s; full suite: ~30s) |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/negative-framing-scan.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green (≥ 4110/4112)
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-T0 | 01 | 1 | NEW-05, NEW-11, NEW-16, NEW-19 | T-09-01-03 | Analog files read-only — no edits unless genuine gap found | scan | `node --test tests/negative-framing-scan.test.cjs` | ✅ | ⬜ pending |
| 09-01-T1 | 01 | 1 | NEW-01, NEW-02, NEW-03, NEW-04, NEW-06 | T-09-01-01, T-09-01-02 | Frontmatter untouched; scanner-exempt constraint pairs not double-fixed | scan | `node --test tests/negative-framing-scan.test.cjs` | ✅ | ⬜ pending |
| 09-01-T2 | 01 | 1 | NEW-07 through NEW-14, NEW-17, NEW-18, NEW-20 | T-09-01-03, T-09-01-04 | Data reference files not XML-wrapped; scope inflation avoided | scan + full suite | `node --test tests/negative-framing-scan.test.cjs && npm test` | ✅ | ⬜ pending |
| 09-02-T1 | 02 | 1 | MOD-01, MOD-04 | T-09-02-01, T-09-02-02, T-09-02-03 | Agent frontmatter untouched; role blocks at line 14; violations confirmed present before editing | scan | `node --test tests/negative-framing-scan.test.cjs` | ✅ | ⬜ pending |
| 09-02-T2 | 02 | 1 | MOD-01, MOD-02, MOD-03, MOD-04 | T-09-02-04, T-09-02-06 | VIOLATIONS.md Category B not edited; gsd-code-fixer.md untouched | full suite | `npm test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No Wave 0 setup needed.

- `tests/negative-framing-scan.test.cjs` — scanner for all 34 in-scope prompt files (exists, 34/34 passing)
- `npm test` — full suite via `run-tests.cjs`, covering agent-frontmatter, agent-size-budget, and all other fork tests (4112 tests, 4110 passing)

No new test files required. The V09 structural audit is a manual read-against-checklist process; no automated test exists for XML tag presence or context placement quality (this is intentional — the PROMPT_IMPROVEMENT_GUIDE_V01.md Final Checklist is the gate).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| V09 structural conformance (XML block presence, context placement, priority ordering, persona, CoT gating, constraint pairing) | NEW-01 through NEW-20 | No automated test exists for XML tag presence or block ordering quality | Read each file against all 8 dimensions in PROMPT_IMPROVEMENT_GUIDE_V01.md Final Checklist; compare to spike.md (command analog) and sketch.md (workflow analog) |
| 5 refactored agents have `<role>` block at line 14 | MOD-01 | Line-number preservation is not covered by npm test | `grep -n "<role>" agents/gsd-debugger.md agents/gsd-executor.md agents/gsd-planner.md agents/gsd-verifier.md agents/gsd-phase-researcher.md` — all must show line 14 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (scanner or full suite)
- [x] Sampling continuity: every task commit runs scanner; every wave runs full suite — no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none — existing infrastructure complete)
- [x] No watch-mode flags
- [x] Feedback latency < 30s (scanner: ~5s; full suite: ~30s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-18
