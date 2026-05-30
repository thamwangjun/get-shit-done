---
phase: 48
slug: tdd-red-gate
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-30
audited: 2026-05-30
---

# Phase 48 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` runner (Node >=22) |
| **Config file** | none — runner is `scripts/run-tests.cjs` (globs `tests/*.test.cjs`) |
| **Quick run command** | `node --test tests/step-numbering-scan.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds (single-file quick run) |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/step-numbering-scan.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green (except deliberate RED subtests in `step-numbering-scan.test.cjs`)
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| 48-01-01 | 01 | 1 | SCAN-01, SCAN-02 | N/A | unit + corpus | `node --test tests/step-numbering-scan.test.cjs` | ✅ yes | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Note on RED state:** Phase 48 success is a deliberately RED corpus test. The 6 known violating files MUST fail in the decimal subtests — that is the goal. Verifier must distinguish "RED for documented reasons in the 6 files" from "RED for unrelated reasons in other files".

---

## Wave 0 Requirements

- [x] `tests/step-numbering-scan.test.cjs` — covers SCAN-01, SCAN-02. This file is the phase deliverable; the entire phase is its creation.
- No framework install needed (Node.js built-ins only).
- No shared fixture file needed (synthetic fixtures inlined as string constants).

---

## Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| SCAN-01 | Pattern A/B detection — `Step N.M` labels in agents/, workflows/, commands/gsd/ | unit + corpus | `node --test tests/step-numbering-scan.test.cjs` |
| SCAN-01 | Pattern D detection — `\d+\.\d+\.` ordered-list items | unit + corpus | `node --test tests/step-numbering-scan.test.cjs` |
| SCAN-01 | Code-fence skip — patterns inside ``` blocks ignored | unit (synthetic) | `node --test tests/step-numbering-scan.test.cjs` |
| SCAN-01 | Letter-suffix guard — `Step 7a` not flagged | unit (synthetic) | `node --test tests/step-numbering-scan.test.cjs` |
| SCAN-01 | Pattern C exclusion — `plan-phase.md`, `new-milestone.md`, `new-project.md` not scanned | unit + corpus | `node --test tests/step-numbering-scan.test.cjs` |
| SCAN-02 | Out-of-order detection — reversed sequence flagged | unit (synthetic) | `node --test tests/step-numbering-scan.test.cjs` |
| SCAN-02 | Out-of-order detection — gap flagged | unit (synthetic) | `node --test tests/step-numbering-scan.test.cjs` |
| SCAN-02 | Out-of-order detection — reset on `##` or `###` heading | unit (synthetic) | `node --test tests/step-numbering-scan.test.cjs` |
| SCAN-02 | Out-of-order detection — Step 0 valid starting label | unit (synthetic) | `node --test tests/step-numbering-scan.test.cjs` |
| G-01 | `scanForOutOfOrder` list-marker false negative documented (known limitation, Phase 50 fix) | unit (documenting, G-01) | `node --test tests/step-numbering-scan.test.cjs` |
| Acceptance criterion 4 | 6 known violating files fail RED for decimal subtests | corpus (RED expected) | `npm test -- tests/step-numbering-scan.test.cjs` |

---

## Manual-Only Verifications

*All phase behaviors have automated verification. G-01 is documented with a unit test asserting current behavior (list-marker steps are silently skipped). Fix deferred to Phase 50.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: 1 task in wave 1 with automated verify (single-task phase, no continuity constraint applies)
- [x] Wave 0 covers all MISSING references (`tests/step-numbering-scan.test.cjs` is created by the task itself)
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved — 2026-05-30

---

## Validation Audit 2026-05-30

| Metric | Count |
|--------|-------|
| Gaps found | 1 |
| Resolved (automated test added) | 1 |
| Escalated to manual-only | 0 |

**G-01 resolved:** Added unit test at `tests/step-numbering-scan.test.cjs:264–268` documenting that list-marker-prefixed steps (`- **Step N:**`) are not detected by the current regex. Test asserts current behavior (violations.length === 0) as a known limitation. Fix deferred to Phase 50.

**Final test counts (after Plan 02):** 629 tests — 619 pass, 10 fail expected (7 Pattern A/B + 1 Pattern D + 1 out-of-order, plus gsd-verifier.md added by Plan 02).

---

## Validation Audit 2026-05-30 (Nyquist audit pass)

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated to manual-only | 0 |
| New unexpected corpus violations detected | 5 |

**0 phase-48 gaps** — all requirements have automated verification. `nyquist_compliant: true` confirmed.

**5 new unexpected corpus violations** discovered by the Plan 02 regex expansion (`(?:\.\d|[a-z])`) that now catches lowercase letter-suffix step labels. These were not present at Plan 01 baseline and are not Phase 48 test gaps — they are new violations to fix in phase 49/50:

| File | Pattern | Violation |
|------|---------|-----------|
| `get-shit-done/workflows/autonomous.md` | A/B (letter-suffix) | `step 3a` (lowercase) |
| `get-shit-done/workflows/plan-review-convergence.md` | A/B (letter-suffix) | `step 5a` (lowercase) |
| `get-shit-done/workflows/profile-user.md` | A/B (letter-suffix) | `step 4a`, `step 4b` (lowercase) |
| `get-shit-done/workflows/reapply-patches.md` | A/B (letter-suffix) | `Step 5a`, `Step 5b` |
| `commands/gsd/graphify.md` | A/B (letter-suffix) | `Step 2a`, `Step 2b`, `Step 2c` |

**Current test counts:** 629 tests — 614 pass, 15 fail (10 expected + 5 new violations above). Fix tracked for phase 49.
