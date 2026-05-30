# Phase 48: TDD Red Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 48-tdd-red-gate
**Areas discussed:** Out-of-order corpus RED scope, Out-of-order gap+reversed detection, Indented steps detection, Test granularity

---

## Out-of-order: corpus RED or unit tests?

| Option | Description | Selected |
|--------|-------------|----------|
| Unit tests only | Verify out-of-order via synthetic fixtures. Corpus tests for out-of-order start GREEN — acceptable. Phase 48 RED gate is about decimal violations. | ✓ |
| Corpus RED required | Find or confirm a real out-of-order violation so corpus tests also fail RED. More rigorous but may require searching or creating a test scenario. | |

**User's choice:** Unit tests only
**Notes:** Phase 48's RED requirement applies to decimal violations only. Out-of-order detection is a correctness check, verified via synthetic unit test fixtures.

---

## Out-of-order: reversed vs. gap detection

| Option | Description | Selected |
|--------|-------------|----------|
| Reversed only | Flag Step 1, Step 3, Step 2 as bad — but Step 1, Step 3, Step 4 (gap) is fine. Catches genuinely misordered steps without false positives from intentional gaps. | |
| Gaps + reversed | Flag both reversed sequences AND gaps. Stricter — any non-sequential jump triggers failure. | ✓ |

**User's choice:** Gaps + reversed (strict sequential)
**Notes:** Any jump in step numbering that is not exactly +1 from the previous step is a violation. The user accepted the tradeoff of possible false positives in files with intentionally skipped step numbers.

Follow-up question resolved: **Per-section detection** — step counter resets on `##` or `###` headings. Files with multiple independent step sequences (each starting from Step 1) are not incorrectly flagged.

---

## Indented steps: detect or skip?

| Option | Description | Selected |
|--------|-------------|----------|
| Detect — no indentation guard for Pattern A/B | Step N.0 is a violation regardless of indentation. execute-phase.md Step 7.0–7.3 are caught. Simpler logic. | ✓ |
| Skip indented — apply 3+ space guard to Pattern A/B | Treats Step 7.0–7.3 as sub-steps exempt from violation detection. execute-phase.md still fails via Pattern D items. | |

**User's choice:** Detect — no indentation guard for Pattern A/B
**Notes:** Consistent with the STATE.md decision that Step N.0 labels are violations. The Pattern A/B scanner uses a flat regex regardless of leading whitespace.

---

## Test granularity

| Option | Description | Selected |
|--------|-------------|----------|
| One test per file, combined check | Like negative-framing-scan.test.cjs: `test(file, ...)`. Each file-test fails if it has ANY violation. Simpler, mirrors established pattern. | |
| One test per file per pattern | Each file gets two subtests: decimal violations + out-of-order violations. Clearer failure messages, departs from established scanner pattern. | ✓ |

**User's choice:** One test per file per pattern
**Notes:** Prioritizes clarity of failure attribution during Phase 49 normalization. The structure `describe(filename, () => { test('decimal', ...); test('out-of-order', ...); })` is used.

---

## Claude's Discretion

- Pattern D regex design and the exact indentation threshold for ordered-list guard
- Whether to inline or modularize `collectMarkdownFiles` (follow `negative-framing-scan.test.cjs` pattern)
- Letter-suffix false-positive guard implementation detail (`\.[0-9]` requirement)

## Deferred Ideas

- Cross-file reference detection (execute-plan.md → execute-phase.md step 5.5) — Phase 50 scope
- Pattern C normalization (plan-phase.md etc. `## N.N.` headings) — follow-on milestone
