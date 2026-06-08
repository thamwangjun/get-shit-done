---
phase: 62
slug: rubric-inlining-coverage
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-08
---

# Phase 62 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `--test` runner (CommonJS) |
| **Config file** | none — `package.json` `test` script drives the runner |
| **Quick run command** | `node --test tests/debug-session-management.test.cjs` |
| **Full suite command** | `npm test 2>&1 \| tee /tmp/gsd-test-output.txt` |
| **Estimated runtime** | ~1 second (quick) / full suite per CI |

---

## Sampling Rate

- **After every task commit:** Run `node --test tests/debug-session-management.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~2 seconds (quick run)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 62-01-01 | 01 | 1 | RIC-01 | T-62-01 / accept | N/A (test-only; reads static agent source from disk) | unit | `node --test tests/debug-session-management.test.cjs` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

RIC-01 is covered by the `describe('phase-62: rubric inlining coverage', ...)` block in `tests/debug-session-management.test.cjs`. One test, three independent `assert.ok()` calls against `agents/gsd-user-profiler.md`:
- **D-02** — `<step name="load_rubric">` (load_rubric step exists)
- **D-03** — `user-profiling.md` (rubric filename referenced)
- **D-04** — `included above in the \`<reference>\` block` (Eta-inlining phrase; the regression guard distinguishing this from a bare file-read)

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new framework or fixtures needed — `fs`/`path`/`describe`/`test`/`assert` already imported, and the agent source is loaded at module scope via `const userProfiler = fs.readFileSync(path.join(ROOT, 'agents', 'gsd-user-profiler.md'), 'utf8');`.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 2s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-08

---

## Validation Audit 2026-06-08

| Metric | Count |
|--------|-------|
| Gaps found | 1 |
| Resolved | 1 |
| Escalated | 0 |

**Note:** RIC-01 coverage had regressed. The original phase-62 guard block (commit `ec069ef4`) was deleted by an unrelated refactor (commit `7d64d747`, a `fix(62)` WR/IN rewrite of the shared `tests/debug-session-management.test.cjs`). This audit re-added the guard adapted to the file's current module-scope file-load structure (`userProfiler` constant). Agent source `agents/gsd-user-profiler.md` retained all three tokens throughout — only the test guard was lost. Full suite: 0 failures.
