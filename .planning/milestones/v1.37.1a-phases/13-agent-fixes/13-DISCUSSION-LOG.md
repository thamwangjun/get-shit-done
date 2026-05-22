# Phase 13: Agent Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 13-agent-fixes
**Areas discussed:** Calibration count format, Exit bullet treatment

---

## Calibration count format

| Option | Description | Selected |
|--------|-------------|----------|
| Inline all tier counts | e.g. 'Limit area count to the calibration tier maximum: full_maturity 3-5, standard 3-4, minimal_decisive 2-3' — self-contained, no cross-reference needed | |
| Reference the existing block | e.g. 'Limit area count to the maximum defined in `<calibration_tiers>` above' — avoids duplication | ✓ |
| You decide | Claude picks whichever is cleaner in context | |

**User's choice:** Reference the existing `<calibration_tiers>` block above — no inline duplication.
**Notes:** The tier counts are already defined at lines 39-56 in the same file; pointing to them keeps the anti_patterns bullet DRY.

---

## Exit bullet treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Replace with positive form | e.g. 'Exit without creating REVIEW-FIX.md' — keeps the explicit clarification, just reframed | |
| Delete the bullet | Exit already implies nothing is created — the bullet is redundant | ✓ |
| You decide | Claude picks whichever reads cleaner | |

**User's choice:** Delete the bullet entirely.
**Notes:** The surrounding exit block already instructs the agent to exit; the negative-framing bullet adds no new information.

---

## Claude's Discretion

- Exact wording for FRAMING-02, FRAMING-04, FRAMING-06 within the affirmative-instruction constraint
- Precise phrasing of the FRAMING-01 reference sentence (within the "reference the block" direction)

## Deferred Ideas

None.
