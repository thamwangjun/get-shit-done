# Phase 15: Test Suite Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 15-test-suite-gate
**Areas discussed:** Plan scope, Doc location, Test count

---

## Plan Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal — run tests, confirm pass, update status | One plan: run npm test, assert 4/4 corpus scan subtests pass, check TEST-05 | |
| Standard — run tests + diff review + per-file spot-checks | Also verify fixed files individually to confirm no unintended edits | |
| Document first — capture violation-to-fix mapping, then run tests | Produce FRAMING-XX before/after annotations before confirming green | ✓ |

**User's choice:** Document first — update each FRAMING-XX entry in REQUIREMENTS.md with the actual fix applied, then run tests.
**Notes:** Tests are already green (4168/4168). User wants a permanent record of exactly what changed before closing the gate.

---

## Doc Location

| Option | Description | Selected |
|--------|-------------|----------|
| REQUIREMENTS.md inline — add Fixed: line per entry | Co-located with the requirement; before/after text inline | ✓ |
| New verification artifact — 15-VERIFICATION.md | Dedicated file with full before/after table | |
| Git commit messages only — diff is the record | Cite commit SHAs, no new document | |

**User's choice:** REQUIREMENTS.md inline.
**Notes:** Keeps each FRAMING-XX requirement and its fix co-located.

---

## Test Count

| Option | Description | Selected |
|--------|-------------|----------|
| Update both — change ≥4142 to ≥4168 in roadmap and requirements | Keeps gate criteria accurate for future phases | ✓ |
| Leave as-is — ≥4142 is a floor, not an exact target | 4168 already satisfies ≥4142, no update needed | |

**User's choice:** Update both ROADMAP.md and REQUIREMENTS.md.
**Notes:** 4168 is the accurate post-Phase-13/14 baseline. SC-2 and TEST-05 should reflect the real number.

---

## Claude's Discretion

- Exact before/after wording for each FRAMING-XX annotation — derive from the Phase 14 git diff.

## Deferred Ideas

None.
