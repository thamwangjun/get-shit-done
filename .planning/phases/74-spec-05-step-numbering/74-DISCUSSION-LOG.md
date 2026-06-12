# Phase 74: spec-05 Step Numbering - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 74-spec-05-step-numbering
**Areas discussed:** Invariant grouping, Pattern C exclusion framing, Normalizer traceability

---

## Invariant grouping

| Option | Description | Selected |
|--------|-------------|----------|
| Role-based ~5–6 (sibling default) | One invariant per behavioral role: decimal detection, out-of-order, cross-file-ref integrity, normalizer idempotent renumber, normalizer cross-file-ref update. Mirrors Phase 71 D-01. | ✓ |
| Per-layer 3 invariants | One coarse invariant per layer; multi-claim, less falsifiable at subtest granularity — risks QUAL-01/02 bar. | |
| Fine-grained per-test | One invariant per subtest; table rots every upstream merge — rejected by siblings. | |

**User's choice:** Role-based ~5–6 (sibling default)
**Notes:** Captured as CONTEXT D-01 with the 5 named invariants and Claude's-discretion latitude to collapse INV-1/INV-2 or merge the two normalizer invariants.

---

## Pattern C exclusion framing

| Option | Description | Selected |
|--------|-------------|----------|
| Key Decision + Scope out (both) | Settled Key Decision (why the 3 files are excluded) AND explicit Out-of-scope bullet. Strongest anti-reopening framing for ROADMAP SC1. | ✓ |
| Key Decision only | Single settled Key Decision; Scope section won't visibly flag the exclusion. | |
| Scope out-of-scope only | Just an Out-of-scope bullet; risks reading as oversight — weaker against SC1. | |

**User's choice:** Key Decision + Scope out (both)
**Notes:** Captured as CONTEXT D-02 — rule normative, the literal three-file list dated/advisory.

---

## Normalizer traceability

| Option | Description | Selected |
|--------|-------------|----------|
| Trace to scanner GREEN + mark advisory CLI | Normalizer invariants trace to scanner tests going GREEN after a run; CLI path advisory in Code Context. Honest about no-dedicated-test reality. | ✓ |
| Flag [MISSING — write test first] | Mark normalizer MUST invariants [MISSING]; surfaces a gap but adds a row Phase 77 scrutinizes. | |
| Keep normalizer out of Invariants | Narrative-only; under-specs a feature SPEC-05 names as in-scope. | |

**User's choice:** Trace to scanner GREEN + mark advisory CLI
**Notes:** Captured as CONTEXT D-03 — scanner is the normalizer's acceptance oracle; no [MISSING] row planted.

---

## Claude's Discretion

- EARS pattern choice per invariant; whether INV-1/INV-2 collapse or the two normalizer invariants merge.
- Exact subtest/assertion-shape strings in the Acceptance Tests table (read real `describe`/`test` names).
- Placement of the explicit scanner → normalizer → cross-file-ref-scanner ordering statement (Purpose vs Key Decision vs both) — CONTEXT D-04.
- Whether to abbreviate SCAN_DIRS / Pattern C enumerations to representative classes; frontmatter Confidence value.

## Deferred Ideas

None — discussion stayed within phase scope. Writing a dedicated normalizer test was considered and explicitly declined in favor of scanner-GREEN traceability (D-03).
