# Phase 49: Survey and Normalization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 49-survey-and-normalization
**Areas discussed:** Sub-step renaming strategy, Commit strategy, Plan granularity

---

## Sub-step renaming strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Renumber to sequential integers | 2a→2, 2b→3, 2c→4, etc. Scanner goes 100% GREEN. agent-frontmatter.test.cjs assertions for Step 4b and Step 7b must be updated. Most structural change. | ✓ |
| Update scanner to exclude letter-suffix | Letter-suffix steps stay; scanner only catches N.M decimal violations. Resolves Phase 48 D-09 conflict without restructuring. | |

**User's choice:** Renumber to sequential integers
**Notes:** User explicitly overrides Phase 48 D-09. Letter-suffix steps ARE violations. The Phase 48 roadmap's intent (scanner detects them as violations) takes precedence over D-09's implementation suggestion (make them lettered branches). User confirmed: "Fix Phase 48 D-09 on this new decision made by me. letter-suffix is included as violations."

---

## Commit strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Renames and cross-file refs in same commit | Per original ROADMAP success criteria #4. Source rename + test assertions + cross-file refs all in one commit. | |
| Renames and cross-file refs in different commits | Source file renames + same-file refs + test assertions in one commit. Cross-file prose reference updates in a separate final commit. | ✓ |

**User's choice:** Cross-file references and rename must be in different commits
**Notes:** User explicitly overrides ROADMAP success criteria #4. This simplifies the atomic commit structure — each source file commit is self-contained; the cross-file cleanup happens as a final sweep.

---

## Plan granularity

| Option | Description | Selected |
|--------|-------------|----------|
| One plan per source file | 13+ plans. Each plan renames exactly one file and updates its same-file refs and co-located test assertions. | ✓ |
| Group by directory | 3 plans: agents/, workflows/, commands/. Fewer plans. | |
| Two plans: survey then normalize | Plan 1: MAP-01 survey. Plan 2: all renaming. | |

**User's choice:** One plan per file
**Notes:** Finest granularity. Easiest to bisect failures. Each plan is a standalone atomic unit.

---

## Claude's Discretion

- MAP-01 index format and storage location (Markdown or JSON, within phase directory)
- Exact new step numbers for each file (sequential from 1, per section)
- discuss-phase-assumptions.md fix approach (add markdown section heading before second Step 1 group)
- Whether discuss-phase-assumptions.md fix is a standalone plan or bundled

## Deferred Ideas

None — discussion stayed within phase scope.
