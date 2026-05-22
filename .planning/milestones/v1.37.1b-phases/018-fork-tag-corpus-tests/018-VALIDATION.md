---
phase: 18
slug: fork-tag-corpus-tests
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-28
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` (v24.14.1) |
| **Config file** | None — `scripts/run-tests.cjs` auto-discovers `tests/*.test.cjs` |
| **Quick run command** | `node --test tests/fork-persona-tag.test.cjs tests/fork-intent-tag.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds (corpus scan only) |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/fork-persona-tag.test.cjs tests/fork-intent-tag.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must have no new failures vs pre-phase baseline
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | PERSONA-01 | — | N/A | unit/corpus | `node --test tests/fork-persona-tag.test.cjs` | ❌ W0 | ⬜ pending |
| 18-01-02 | 01 | 1 | INTENT-01 | — | N/A | unit/corpus | `node --test tests/fork-intent-tag.test.cjs` | ❌ W0 | ⬜ pending |
| 18-02-01 | 02 | 2 | TEST-GATE-01 | — | N/A | integration | `npm test` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/fork-persona-tag.test.cjs` — covers PERSONA-01 (created by Plan 018-01 Task 1)
- [ ] `tests/fork-intent-tag.test.cjs` — covers INTENT-01 (created by Plan 018-01 Task 2)

*No framework install needed — node:test is built-in. Wave 0 and Wave 1 are collapsed: each task creates its own test file and immediately verifies it. This is an accepted exception for test-creation phases where the test file is the deliverable itself.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Deliberate `<role>` injection causes persona test to fail | PERSONA-01 SC-4 | Requires temporary file edit + revert | Add `<role>` to one agent, run persona test, verify failure, revert |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
