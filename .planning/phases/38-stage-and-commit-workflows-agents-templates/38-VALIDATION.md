---
phase: 38
slug: stage-and-commit-workflows-agents-templates
status: passed
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-22
---

# Phase 38 — Stage and Commit Workflows, Agents, & Templates

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Git CLI / Node.js script verification |
| **Config file** | none |
| **Quick run command** | `git diff --cached --name-only` |
| **Full suite command** | `git diff --cached --name-only` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `git diff --cached --name-only`
- **After every plan wave:** Run `git diff --cached --name-only`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 38-01-01 | 01 | 1 | STAGE-03 | T-38-01 | Validate staging targets (exact subset) | unit | `git diff --cached --name-only` | ✅ Wave 0 | ✅ green |
| 38-01-02 | 01 | 1 | STAGE-03 | — | Validate commit message and history | unit | `git log -n 1 --pretty=format:%s` | ✅ Wave 0 | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/stage-batch-3.cjs` — Staging automation script

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending 2026-05-22
