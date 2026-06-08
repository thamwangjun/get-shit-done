# Phase 62: Rubric Inlining Coverage - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-08
**Phase:** 62-rubric-inlining-coverage
**Areas discussed:** Test file placement, Assertion tokens

---

## Test File Placement

| Option | Description | Selected |
|--------|-------------|----------|
| debug-session-management.test.cjs | ROADMAP primary. Phase 63 (SFC-01) also adds to this file — both coverage-gap tests land in the same place. Matches the pattern of phases 60/61 appending to existing files. | ✓ |
| A profiler-specific test file | bug-2973-profile-user-skills-path.test.cjs or similar. More semantically correct, but splits coverage-gap tests across files. | |

**User's choice:** debug-session-management.test.cjs

---

## Assertion Tokens

| Option | Description | Selected |
|--------|-------------|----------|
| user-profiling.md only | Matches ROADMAP success criteria SC-2 literally. Two assert.ok() calls total: load_rubric step exists + filename referenced. | |
| user-profiling.md + 'included above in the `<reference>` block' | Adds a third assert.ok() asserting the inlining confirmation phrase. More precisely guards against regression to a bare-read pattern. Matches RIC-01 requirement text. | ✓ |

**User's choice:** Three assertions — load_rubric step + user-profiling.md + "included above" phrase

---

## Claude's Discretion

- Exact `describe`/`test` titles and assertion message wording — follow existing file's phrasing style.

## Deferred Ideas

None.
