---
quick_id: 260430-e3c
slug: remove-all-fork-requirements-of-converti
description: Remove all fork requirements of converting XML tags to intent, persona and objective. Note this decision down. Modify files in .planning/ appropriately.
date: 2026-04-30
status: complete
---

# Summary: Quick Task 260430-e3c

## What Was Done

Removed all planning requirements for XML tag hierarchy conversion (`<intent>`, `<persona>`, `<objective>`) from the fork's scope. Three `.planning/` files updated.

## Changes Made

### `.planning/PROJECT.md`
- **Active Requirements** section: Removed all 8 requirements (HIER-L1, HIER-L2, HIER-L3, TEST-L1, TEST-L2, TEST-L3, TEST-GATE, DOCS-01); replaced with "None — see Out of Scope"
- **Abandoned Milestone: v1.37.1c** note: Changed "Deferred" to "Requirements dropped (2026-04-30)"
- **Out of Scope**: Added XML tag hierarchy conversion with rationale
- **Key Decisions**: Added decision row — "XML tag hierarchy conversion removed from fork scope"
- **Context**: Updated current state note to reflect dropped requirements
- **Last updated**: Updated timestamp

### `.planning/STATE.md`
- **Deferred Items**: Removed all 8 tag hierarchy rows; replaced with a one-line note pointing to PROJECT.md

### `.planning/references/UPSTREAM_TO_FORK_CHANGES_GUIDE.md`
- **Category 2 — Four-level tag hierarchy**: Marked as historical (no longer active); preserved rationale for context
- **Upstream Merge Checklist**: Removed tag conversion steps for new commands/workflows; kept `<persona>` check for agents (still guarded by existing tests)
- **Last updated**: Updated timestamp

## Decision Rationale

The fork's core value is applying prompt engineering quality improvements (positive framing, XML structure, context placement). Requiring every upstream merge to convert tag names across hundreds of files adds maintenance overhead that outweighs the semantic benefit of the four-level hierarchy. The already-converted files (`<persona>` in 31 agents, `<intent>` in 79 commands) are preserved and guarded by existing tests — no regression. New files from upstream are no longer subject to tag conversion.
