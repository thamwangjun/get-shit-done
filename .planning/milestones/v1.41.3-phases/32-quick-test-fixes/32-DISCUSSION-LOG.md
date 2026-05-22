# Phase 32: Quick Test Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 32-quick-test-fixes
**Areas discussed:** HOOKS-01 placement, TEST-02 comment, PATH-01 scope

---

## HOOKS-01 placement

| Option | Description | Selected |
|--------|-------------|----------|
| Alphabetical order | Between gsd-check-update.js and gsd-context-monitor.js — consistent with existing sorted pattern | ✓ |
| End of array | Append after gsd-workflow-guard.js — minimal diff | |

**User's choice:** Alphabetical order
**Notes:** User asked what MANAGED_HOOKS is and whether gsd-update-banner.js should be in it. Confirmed: the file ships in hooks/ and the test asserts every shipped gsd-*.js is in MANAGED_HOOKS.

---

## TEST-02 comment

| Option | Description | Selected |
|--------|-------------|----------|
| Keep existing comment | The file already has an allow-test-rule comment at top explaining rationale | |
| Add inline skip comment | Add comment next to describe.skip explaining fork replaces npm-based update arch with GitHub API | ✓ |

**User's choice:** Add inline skip comment

---

## PATH-01 scope

| Option | Description | Selected |
|--------|-------------|----------|
| Update path + description text | Fix readFile path and test description string | |
| Path only | Fix readFile path only — minimum change to make test pass | ✓ |

**User's choice:** Path only (user redirected from updating description — not in requirements)
**Notes:** User questioned why PATH-01 was needed. Clarified: upstream v1.41.2 renamed extract_learnings.md → extract-learnings.md; test still references old underscore path causing ENOENT.

---

## Claude's Discretion

- PATH-01 test description text — update only if it causes noise; requirement is path fix only

## Deferred Ideas

None.
