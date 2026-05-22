# Phase 14: Workflow, Reference, and Command Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 14-workflow-reference-and-command-fixes
**Areas discussed:** FRAMING-10 list scope, FRAMING-11+12 merging, FRAMING-16 test update

---

## FRAMING-10 list scope

| Option | Description | Selected |
|--------|-------------|----------|
| Header only — rename to 'Anti-patterns:' | Remove 'DO NOT' from header only; list items stay negative | |
| Convert list items too | Rewrite header AND all 7 list items to positive imperative | ✓ |
| Header with 'Exclude:' framing | Change to 'Exclusions:' — terse, no 'do not' | |

**User's choice:** Convert list items too

Follow-up — framing style for list items:

| Option | Description | Selected |
|--------|-------------|----------|
| Positive imperative: what to DO instead | "Use plain-text labels", "Use {NN}-{MM}-PLAN.md format" | ✓ |
| Omit/Skip framing | "Omit markdown tables", "Skip PLAN-01.md naming" | |
| Claude's discretion | Pick most natural affirmative per item | |

**User's choice:** Positive imperative

---

## FRAMING-11+12 merging

| Option | Description | Selected |
|--------|-------------|----------|
| Merge into one positive statement | Replace both lines with single "Present only workstream progress at this stage" | |
| Rewrite each line separately | Each line gets its own affirmative rewrite | ✓ |
| Delete both lines | Remove entirely — "Stop here." covers it | |

**User's choice:** Rewrite each line separately

Follow-up — FRAMING-11 exact wording:

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to Route B framing | "Reserve for Route B once all workstreams finish" | |
| Conditional framing | "Mention only when all workstreams are done" | |
| Delete entirely | No replacement — "Stop here." covers it | ✓ |

**User's choice (FRAMING-11):** Delete entirely — no replacement

**User's choice (FRAMING-12):** Delete entirely — "Stop here." covers both

---

## FRAMING-16 test update

| Option | Description | Selected |
|--------|-------------|----------|
| Assert new positive text only | `content.includes('Treat a flag as active only if its literal token is present in \`$ARGUMENTS\`')` | ✓ |
| Assert both old and new | Keep old assertion + add new one for transition safety | |
| Claude's discretion | Pick whatever best preserves test intent | |

**User's choice:** Assert new positive text only

---

## Claude's Discretion

- Exact wording for FRAMING-07, FRAMING-08, FRAMING-09, FRAMING-13, FRAMING-14, FRAMING-17 — standard affirmative rewrites, Claude picks wording consistent with surrounding file style
- FRAMING-10 list item exact phrasing — positive imperative style, Claude applies per item

## Deferred Ideas

None.
