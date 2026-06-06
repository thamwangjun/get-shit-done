# Phase 58: Regression Coverage - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-06
**Phase:** 58-regression-coverage
**Areas discussed:** Golden snapshot form, Snapshot matrix breadth, Test file organization, RED-before-fix evidence

---

## Golden snapshot form

| Option | Description | Selected |
|--------|-------------|----------|
| Static committed JSON + keep same-slot | Frozen expected-values fixture (33 agents × profiles), regen by script, diffed in review; catches any drift. Keep Phase 53 dynamic same-slot check as complementary guard. | ✓ |
| Extend dynamic self-consistency | Add to feat-53 computed approach; lighter but cannot catch logic drift (expected derived from resolver under test). | |
| Hybrid, fixture advisory | Static fixture documents values but assertions stay dynamic; lowest enforcement, fixture can rot. | |

**User's choice:** Static committed JSON + keep same-slot
**Notes:** User first asked for a refresher on what a golden snapshot is. After clarification, confirmed the static fixture is the real lock precisely because the existing Phase 53 golden computes expected FROM the resolver under test and so passes on wrong-but-consistent values.

---

## Snapshot matrix breadth

| Option | Description | Selected |
|--------|-------------|----------|
| Effort runtimes full + omit sampled | 33 agents × all profiles for claude+codex; assert omit contract once per non-effort runtime instead of 33×profile null rows. | ✓ |
| Full cartesian, all 10 runtimes | Maximally exhaustive but thousands of identically-null rows; large fixture, review noise. | |
| claude + codex only | Smallest fixture; non-effort omission covered only in TEST-03, snapshot no longer self-documents omit. | |

**User's choice:** Effort runtimes full + omit sampled
**Notes:** Exhaustive on varying axes, sampled on constant-null axes to keep the fixture diff-reviewable.

---

## Test file organization

| Option | Description | Selected |
|--------|-------------|----------|
| New milestone file, keep unit files | New phase-58 file holds golden + cross-cutting contract; existing per-phase unit files stay, no migration. | ✓ |
| Extend existing per-phase files | No new file but milestone contract scattered across feat-53/phase-56/feat-57. | |
| Consolidate everything into one | Maximum cohesion but high churn, risk of breaking green tests during the move. | |

**User's choice:** New milestone file, keep unit files
**Notes:** Milestone-level assertions get one discoverable home; zero churn to currently-green tests.

---

## RED-before-fix evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Mutation verify + antipattern guard | Per-test: invert logic → confirm RED → revert, documented in SUMMARY. Plus committed guard linting for indexOf-as-boolean / medium-high substring collisions. | ✓ |
| Documented git-history RED log | Cite fix commits as RED evidence; weak for net-new assertions since fixes already shipped. | |
| Antipattern guard test only | Commits the lint guard but doesn't prove each regression test catches its target. | |

**User's choice:** Mutation verify + antipattern guard
**Notes:** Fixes for Phases 53–57 already landed, so genuine RED can't come from git history for new assertions; mutation verification is the only way to prove the tests bite now.

---

## Claude's Discretion

- Exact new test filename (`feat-58-*` vs `phase-58-regression.test.cjs` — match existing convention).
- Golden fixture location/format under `tests/fixtures/` (JSON keyed by agent/profile/runtime).
- Regeneration-script entry point + invocation (npm script vs node), following the atomic-write `gen-*.mjs` convention.
- Precise form of the antipattern guard (regex/AST lint over `tests/*.cjs`).
- Which profile variants are enumerated (confirm from `MODEL_PROFILES` keys).

## Deferred Ideas

None — discussion stayed within phase scope.
