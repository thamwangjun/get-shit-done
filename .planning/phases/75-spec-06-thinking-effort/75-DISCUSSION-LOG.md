# Phase 75: spec-06 Thinking Effort - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 75-spec-06-thinking-effort
**Areas discussed:** Invariant decomposition shape, Codex linchpin handling, Tier-1 oracle, Scope boundary

---

## Invariant Decomposition Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Role-based, ~6-8 invariants | Group by behavioral role (parse / resolve-precedence / D-08 floor / allowlist gate / omit-translate / catalog+siblings / wiring+emit), each mapping to a subtest cluster; accepts a complex surface needs more than the 5-invariant siblings | ✓ |
| Minimal, ~4 invariants | Compress to match sibling count; risks multi-claim invariants weakening QUAL-01 falsifiability | |
| Let Claude decide final count | Lock the role axis + must-haves, leave grouping to author discretion | |

**User's choice:** Role-based, ~6-8 invariants
**Notes:** Final count (6/7/8) remains Claude's discretion within QUAL-01 falsifiability (D-01). The D-08 floor (INV-3) and allowlist gate (INV-4) are kept separate from the precedence chain (INV-2) because each is a distinct MUST with a distinct failure consequence and a distinct subtest.

---

## Codex Linchpin Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Key Decision + researcher pins symbol | Capture as settled Key Decision (Codex emit ties effort to model source, no silent divergence); researcher locates the real install.js symbol — treats `rawSlotForRuntime` as a ROADMAP paraphrase | ✓ |
| Dedicated invariant | Make the Codex emit/translate boundary its own MUST invariant | |
| Both — invariant + Key Decision | Invariant for the testable boundary; Key Decision for the rationale | |

**User's choice:** Key Decision + researcher pins symbol
**Notes:** No literal `rawSlotForRuntime` symbol exists in source (D-04). The testable translate/omit boundary is still carried by INV-5 (traced to feat-58 TEST-03); the Key Decision carries the design rationale and linchpin status. Researcher MUST pin the actual install.js seam (`translateEffortForCodex` + WR-03 tie).

---

## Tier-1 Oracle

| Option | Description | Selected |
|--------|-------------|----------|
| Golden regression test tier-1, init.cjs tier-2 | 330-row golden snapshot is the tier-1 behavioral oracle; init.cjs resolver is tier-2 implementation it pins; spec describes snapshot structure (rows + omitContract) — matches SC3 | ✓ |
| Let Claude decide split | Lock that both are cited + structure described; leave per-invariant assignment to author | |

**User's choice:** Golden regression test tier-1, init.cjs tier-2
**Notes:** Per ROADMAP SC3 both are cited; snapshot structure (agent×profile×runtime rows + 13-runtime omitContract) is described, not just referenced (D-05). Per-invariant tier-1 assignment stays Claude's discretion — parser and translate boundary have dedicated unit oracles and need not route through the 330-row snapshot.

---

## Scope Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| CATALOG-02 user-handover = out of scope | Spec the resolver/parser/catalog/wiring/emit; place the CATALOG-02 user-handover UX out of scope as adjacent, per ROADMAP | ✓ |
| Include handover boundary as an invariant | Treat the handover boundary as an in-scope invariant | |

**User's choice:** CATALOG-02 user-handover = out of scope
**Notes:** Inherits the sibling line — narrate the feature's behavior, not the authoring UX (D-06).

---

## Claude's Discretion

- Final invariant count (6–8) and exact role boundaries within the locked role-based axis.
- Exact EARS pattern per invariant (Ubiquitous / Event-driven / Unwanted-behavior).
- Exact subtest/assertion-shape strings in the Acceptance Tests table — read from the real tier-1 test files.
- Whether to abbreviate the 20-sibling / 13-runtime / 330-row enumerations to representative classes vs literal lists.
- Confidence value stamped in frontmatter when the body is finalized.

## Deferred Ideas

None — discussion stayed within phase scope. The Codex-linchpin placement (D-04), tier-1/tier-2 oracle assignment (D-05), and CATALOG-02 out-of-scope boundary (D-06) are framing decisions within the spec, not deferrals.
