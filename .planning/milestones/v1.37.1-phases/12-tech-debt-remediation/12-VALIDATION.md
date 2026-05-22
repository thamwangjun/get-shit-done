---
phase: 12
slug: tech-debt-remediation
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-21
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (Node.js CJS) |
| **Config file** | `package.json` (`jest` key) |
| **Quick run command** | `npm test -- --testPathPattern="agent-frontmatter|negative-framing"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (full suite: ~60 seconds) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="agent-frontmatter|negative-framing"`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green (currently 4142/4142)
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | IN-01 | — | N/A | integration | `npm test -- --testPathPattern="agent-frontmatter"` | ✅ | ✅ green |
| 12-01-02 | 01 | 1 | WR-03 | — | N/A | integration | `npm test -- --testPathPattern="agent-frontmatter"` | ✅ | ✅ green |
| 12-02-01 | 02 | 2 | D-02 | — | N/A | unit | `npm test -- --testPathPattern="negative-framing\|agent-frontmatter"` | ✅ | ✅ green |
| 12-02-02 | 02 | 2 | D-01 | — | N/A | integration | `npm test -- --testPathPattern="negative-framing\|agent-frontmatter"` | ✅ | ✅ green |
| 12-03-01 | 03 | 3 | D-01 | — | N/A | integration | `npm test -- --testPathPattern="negative-framing\|agent-frontmatter"` | ✅ | ✅ green |
| 12-03-02 | 03 | 3 | WR-01 | — | N/A | unit | `npm test` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files or framework installation needed.

- `tests/agent-frontmatter.test.cjs` — 135 tests (validates agent file structure; WR-01 guard removal tested here)
- `tests/negative-framing-scan.test.cjs` — 34 tests (validates positive framing; sweep changes tested here)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Prose `<required_reading>` replaced with `@file` reference | WR-03 | Content transformation validated by reading file, not test suite | `head -15 agents/gsd-intel-updater.md` — verify lines 9-13 contain `@~/.claude/get-shit-done/references/mandatory-initial-read.md` |
| All positive-reframe replacements state correct action (not merely delete prohibition) | D-02 | Semantic correctness of wording requires human review | Read each modified hunk; verify replacement sentence starts with actionable verb (Use, Treat, Stage, etc.) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** complete — 4142/4142 passing (2026-04-21)
