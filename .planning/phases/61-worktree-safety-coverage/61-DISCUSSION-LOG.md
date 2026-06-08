# Phase 61: Worktree Safety Coverage - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-08
**Phase:** 61-worktree-safety-coverage
**Areas discussed:** Describe block placement, Submodule skip token

---

## Describe block placement

| Option | Description | Selected |
|--------|-------------|----------|
| New `describe('phase-61: ...')` block | Appended after existing blocks. Matches cross-file phase precedent. Clean TAP output. | ✓ |
| Inside existing `describe('bug #3097...')` | Semantically related but misleading label in test output | |
| Bare `test()` outside describe | No codebase precedent | |

**User's choice:** New `describe('phase-61: submodule exclusion guard', ...)` block (recommended)
**Notes:** Advisor research confirmed that the phase-60-in-phase-56 precedent is the canonical pattern. Submodule exclusion is semantically related to #3097 but is a new phase-61 assertion, not a #3097 regression fix — keeping attribution correct matters for future contributor discoverability.

---

## Submodule skip token

| Option | Description | Selected |
|--------|-------------|----------|
| Both `'GIT_CONTENT='` + `'skip worktree guards'` | Two `assert.ok` calls: mechanism + documentation-as-contract. Mirrors EWC-04 style. | ✓ |
| Only `'GIT_CONTENT='` | Single assertion on behavioral mechanism. Less readable alone. | |
| Only `'skip worktree guards'` | Single assertion on comment text. Readable but comment-only. | |
| `'.git/modules/'` | Appears only in comment — does not prove skip branch exists | |

**User's choice:** Both tokens (recommended)
**Notes:** Advisor research noted that `GIT_CONTENT=` appears at both the capture line and the reset line, so neither alone pins the skip-branch. Using both tokens covers mechanism and documented intent. In this fork, comment text is part of the deployed agent contract ("source-text-is-the-product"), reducing comment-fragility concern.

---

## Claude's Discretion

- Exact `describe`/`test` title wording — follow existing file's naming style.
- Whether to add a standalone SC-1 assertion or confirm the existing `describe('bug #3097...')` test already satisfies it.

## Deferred Ideas

None — discussion stayed within phase scope.
