# Phase 33: Positive Framing Pass - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 33-positive-framing-pass
**Areas discussed:** Scope, debug.md/reapply-patches.md fix depth, Bug-3242 assignment

---

## Scope — all failures vs. v1.41.2 only

| Option | Description | Selected |
|--------|-------------|----------|
| Fix all 5 current failures | Phase 34 needs 0 failures for the gate. Clearing everything in Phase 33 makes Phase 34 a clean merge — no loose ends. | ✓ |
| FRAME-01/FRAME-02 only | Strictly fix debug.md and reapply-patches.md as specified. Leave the other 5 failures for Phase 34. | |

**User's choice:** Fix all 5 current scanner failures plus FRAME-01/FRAME-02  
**Notes:** Phase 34 is a pure gate + merge; cleaner to ship Phase 33 with everything green.

---

## debug.md / reapply-patches.md fix depth

| Option | Description | Selected |
|--------|-------------|----------|
| Framing violations only | Add scanner tests for their specific violation types (if not already tested), then fix only the negative framing language. | ✓ |
| Full critique implementation | Also apply structural improvements from .planning/critique/workflows/: persona rewrites, task tag restructuring, canonical phase tags, output format additions. | |
| Framing + easy structural wins | Fix framing, and pick up any straightforward critique items (e.g., renaming a tag). Skip invasive rewrites. | |

**User's choice:** Framing violations only  
**Notes:** Structural critique deferred to a future quality pass.

---

## Bug-3242 assignment

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 33 | Fix it here alongside the framing pass. Phase 34 then starts with a fully clean suite and is purely a gate + merge. | ✓ |
| Phase 34 | Leave it for Phase 34's gate work. | |

**User's choice:** Fix in Phase 33  
**Notes:** Keeps Phase 34 simple — no code changes, just verify and fast-forward.

---

## Claude's Discretion

- Whether to add new scanner RED gate subtests for debug.md/reapply-patches.md before fixing (TDD pattern) — Claude to follow established Phase 25–29 TDD approach
- Whether to use `// allow-test-rule` comments for semantically load-bearing negatives vs. full positive rewrite

## Deferred Ideas

- Structural improvements to `debug.md` and `reapply-patches.md` from `.planning/critique/` (persona, task block, canonical `<phase>` tag) — future quality pass
