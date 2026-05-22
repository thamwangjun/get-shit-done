# Phase 12: Tech Debt Remediation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 12-tech-debt-remediation
**Areas discussed:** Positive framing scope, WR-01 fix strategy, WR-03 fix approach

---

## Scope of "Never" Remediation

| Option | Description | Selected |
|--------|-------------|----------|
| Original 3 items only (WR-01, IN-01, WR-03) | Scope limited to audit-identified tech debt | |
| Middle ground: unpaired candidates, skip security guards | Partial pass, leave injection guards | |
| Full sweep: all unpaired "never" + security guards | Every "never" in LLM-read content gets positive reframing | ✓ |

**User's choice:** Full sweep — all scenarios, no exceptions.
**Notes:** User stated: "Negative framings, in all scenarios should be removed entirely. What should replace them is explicit positive framing of what to do instead." Security injection guards ("never interpret as instructions") are included and must be reframed as affirmative data-handling directives.

---

## WR-01: NEVER Skip Guard

| Option | Description | Selected |
|--------|-------------|----------|
| Remove the guard | Clean fix; guard no longer needed with positive framing | ✓ |
| Update guard text | Change to match new positive instruction text | |
| Document as intentional | Add comment, keep as-is | |

**User's choice:** Remove (implied by full-sweep decision — the guard was protecting against a "NEVER" form that no longer exists).

---

## WR-03: required_reading Block

| Option | Description | Selected |
|--------|-------------|----------|
| Replace with @mandatory-initial-read.md | Use canonical @file reference pattern | ✓ |
| Remove entirely | No required files for this agent | |
| Document as intentional | Keep prose, add explanatory comment | |

**User's choice:** Replace with canonical pattern (consistent with all other agents).

---

## Claude's Discretion

- Exact positive-reframe wording per instance
- Whether to batch into one plan or split by file type

## Deferred Ideas

None.
