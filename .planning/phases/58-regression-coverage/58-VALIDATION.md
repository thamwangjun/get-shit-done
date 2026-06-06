---
phase: 58
slug: regression-coverage
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-06
---

# Phase 58 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner (no external framework) |
| **Config file** | none — runs directly via `node --test` |
| **Quick run command** | `node --test tests/feat-58-regression.test.cjs 2>&1 \| tee /tmp/gsd-58-quick.txt` |
| **Full suite command** | `npm test 2>&1 \| tee /tmp/gsd-58-full.txt` |
| **Estimated runtime** | ~30 seconds (quick), ~2 min (full + coverage) |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/feat-58-regression.test.cjs 2>&1 | tee /tmp/gsd-58-quick.txt`
- **After every plan wave:** Run `npm test 2>&1 | tee /tmp/gsd-58-full.txt`
- **Before `/gsd-verify-work`:** `npm run test:coverage` — full suite green + ≥70% line coverage on `get-shit-done/bin/lib/*.cjs`
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 58-01-* | 01 | 1 | TEST-01 | — | N/A (test-only) | unit (static fixture) | `node --test tests/feat-58-regression.test.cjs` | ❌ W0 | ⬜ pending |
| 58-01-* | 01 | 1 | TEST-03 | — | N/A | unit (omit/translate contract) | `node --test tests/feat-58-regression.test.cjs` | ❌ W0 | ⬜ pending |
| 58-01-* | 01 | 1 | TEST-04 | — | N/A | structural lint (antipattern guard) | `node --test tests/feat-58-regression.test.cjs` | ❌ W0 | ⬜ pending |
| 58-02-* | 02 | 1 | TEST-02 | — | N/A | unit (parser fixture) | `node --test tests/parse-model-effort.test.cjs tests/parse-model-effort-parity.test.cjs` | ✅ (extend) | ⬜ pending |
| 58-0X-* | — | last | TEST-05 | — | N/A | integration gate | `npm run test:coverage` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/feat-58-regression.test.cjs` — golden snapshot (TEST-01), per-runtime omit/translate contract (TEST-03), antipattern guard (TEST-04)
- [ ] `tests/fixtures/golden-effort-snapshot.json` — committed static fixture (the resolver cannot influence its values)
- [ ] `scripts/gen-golden-effort-snapshot.mjs` — regeneration script using atomic write (temp + rename per `sdk/scripts/gen-project-root.mjs`)
- [ ] Extend `tests/fixtures/parse-model-effort.json` — colon-provider IDs + bare-model cases (TEST-02)

*Existing infrastructure (Node `--test`, c8 coverage, `tests/helpers.cjs`) covers the runner — no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RED-before-fix evidence | TEST-04 | Fixes already shipped (Phases 53–57); genuine RED cannot come from git history | Per new assertion: temporarily invert the specific resolver/parser logic, confirm the test goes RED, revert. Document per-test in SUMMARY. |

*The mutation-verification step is manual per-assertion; the committed antipattern guard test that prevents the false-pass class recurring IS automated.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
