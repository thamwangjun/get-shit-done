# Phase 69: spec-01 Positive Framing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 69-spec-01-positive-framing
**Areas discussed:** Invariant decomposition, Count-vs-shape tension, Exception predicates normativity, Warn-vs-block tiering

---

## Invariant Decomposition

| Option | Description | Selected |
|--------|-------------|----------|
| Group by behavioral role | ~5 invariants: detection, two-tier severity, exception suppression, affirmative-rewrite remediation, scan scope + code-fence exclusion | ✓ |
| One invariant per pattern | 12+ invariants, one per token | |
| Single mega-invariant | One invariant covers all detection | |

**User's choice:** Group by behavioral role
**Notes:** Keeps traceability table legible and move-proof; one-per-pattern rots every merge, mega-invariant fails QUAL subtest-granularity bar.

---

## Count-vs-Shape Tension

| Option | Description | Selected |
|--------|-------------|----------|
| Shape normative, enumeration dated | Falsifiable invariant asserts detection shape; 12+ list appears as supporting enumeration marked 'current as of 2026-06-12' | ✓ |
| Count is normative | Assert exactly 12+ named branches as a MUST | |

**User's choice:** Shape normative, enumeration dated
**Notes:** Honors 00-CONVENTIONS.md §4 (shape normative, not count). Satisfies ROADMAP criterion 1 without making the count the contract.

---

## Exception Predicates Normativity

| Option | Description | Selected |
|--------|-------------|----------|
| Normative as classes, regex advisory | MUST invariant: factual/conditional/reframe/positive-complement-paired usages not flagged; regex heuristics in Code Context as advisory | ✓ |
| Fully advisory | All exceptions are implementation detail | |
| Fully normative incl. regexes | Lock exact regex predicates as MUST | |

**User's choice:** Normative as classes, regex advisory
**Notes:** A reimplementer flagging every factual "never" ships a broken scanner — exceptions must be reproduced. Exact regexes are brittle and defeat reimplementation-readiness.

---

## Warn-vs-Block Tiering

| Option | Description | Selected |
|--------|-------------|----------|
| Invariant + locked Key Decision | Block-set hard-fails, warn-only set (cannot/won't/will not) surfaces as warnings; tier membership + rationale locked "do not reopen" | ✓ |
| Single severity, note warnings | Spec only hard-failure detection; warn-only as footnote | |

**User's choice:** Invariant + locked Key Decision
**Notes:** Two-tier split is a deliberate contract (test D-16–D-23) a reimplementer must preserve.

---

## Claude's Discretion

- EARS pattern choice and exact wording per invariant (single falsifiable claim each).
- Exact subtest/assertion-shape strings in the Acceptance Tests table (read from the real test).
- Confidence value stamped in frontmatter at finalization.
- Table vs bullet-list rendering of the supporting branch enumeration.
- Placement of the affirmative-rewrite rule: resolved by Claude (D-05) as a Key Decision / Purpose item rather than a MUST invariant, because the scanner does not test rewriting and every MUST invariant must map to a test.

## Deferred Ideas

None — discussion stayed within phase scope.
