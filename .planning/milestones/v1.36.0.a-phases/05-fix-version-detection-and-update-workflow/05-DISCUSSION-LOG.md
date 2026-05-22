# Phase 5: Fix Version Detection and Update Workflow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 05-fix-version-detection-and-update-workflow
**Areas discussed:** INST-02 Offline fallback value, INT-01 Cache clear path, INST-01/UPD-02 Scope clarification

---

## INST-02: Offline fallback value

| Option | Description | Selected |
|--------|-------------|----------|
| `'no-network'` | 9 chars, not hex, clearly descriptive. Fails ^[0-9a-f]{7} check. | |
| `'OFFLINE'` | 7 chars uppercase, clearly not a SHA. | |
| Empty string / omit VERSION | Don't write VERSION when offline. | |

**User's choice:** Freeform clarification — local installs only for now (npm out of scope). This reframes INST-02: since this fork is local-install only, git rev-parse is available as a primary source.

**Notes:** User noted that local and npm installs are distinct; this fork only supports local installs for now. Possible future support for npm installs was recorded as a deferred idea. Decision: replace the GitHub API approach entirely with `git rev-parse --short HEAD`.

---

## INST-02 follow-up: git rev-parse vs. GitHub API

| Option | Description | Selected |
|--------|-------------|----------|
| `git rev-parse` first, GitHub API optional | Primary: git. Eliminates offline problem. | ✓ |
| Keep GitHub API as primary, add sentinel | Smaller change, but doesn't fix the root cause. | |

**User's choice:** git rev-parse first, GitHub API optional
**Notes:** For local installs, git is always available. No need for the GitHub API.

---

## INST-02 follow-up: Remove GitHub API call?

| Option | Description | Selected |
|--------|-------------|----------|
| Remove it — git is the source of truth | Clean up install.js entirely. | ✓ |
| Keep it as secondary cross-check | Added complexity for local-only case. | |

**User's choice:** Remove it — git is the source of truth

---

## INT-01: Cache clear path

| Option | Description | Selected |
|--------|-------------|----------|
| Fix update.md — add ~/.cache/gsd/ to clear step | Minimal change, one line added to existing loop. | ✓ |
| Move worker write location | Reopens Phase 4 code. | |

**User's choice:** Fix update.md — add `rm -f "$HOME/.cache/gsd/gsd-update-check.json"` to cache-clear loop.

---

## INST-01 scope

| Option | Description | Selected |
|--------|-------------|----------|
| Code changes + tests | Replace GitHub API with git rev-parse; add tests. | ✓ |
| Tests only | Would not fix INST-02 offline fallback. | |

**User's choice:** Code changes + tests (follows directly from INST-02 decision)

---

## UPD-02 scope

| Option | Description | Selected |
|--------|-------------|----------|
| Verify only — mechanism already correct | Single-bash-context comparison already exists in update.md. | ✓ |
| Fix + verify | Review for edge cases and make changes if needed. | |

**User's choice:** Verify only — mechanism already correct

---

## Claude's Discretion

- Whether to use `execSync` inline or extract to a helper for git rev-parse
- Exact sentinel string for non-git fallback
- Whether `--short` vs `--short=7` is needed for git rev-parse

## Deferred Ideas

- npm install support: when added, VERSION-writing strategy will need to handle no-git contexts; GitHub API call may be reintroduced as primary source for npm installs.
