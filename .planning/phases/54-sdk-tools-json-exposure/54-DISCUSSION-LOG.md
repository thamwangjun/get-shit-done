# Phase 54: SDK & Tools JSON Exposure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-02
**Phase:** 54-sdk-tools-json-exposure
**Areas discussed:** Null representation, Field naming, Sibling coverage, Parity mechanism

---

## Null representation

| Option | Description | Selected |
|--------|-------------|----------|
| Omit when null (recommended) | Match existing cmdResolveModel omit-when-falsy; bare JSON stays byte-identical; trivial additive-only snapshot | |
| Explicit null | Always emit `*_effort` / `effort` with `null` on bare catalog; uniform contract; changes bare JSON shape | ✓ |

**User's choice:** Explicit null
**Notes:** Chosen against the byte-identical recommendation. The consequence (Phase 58's additive-only golden must assert additive-superset on existing-field values, not whole-JSON byte-equality) was surfaced before locking and accepted. Explicit null also simplifies EXPOSE-03 parity (key always present on both SDK and CLI). Captured as D-01/D-02/D-03.

---

## Field naming

| Option | Description | Selected |
|--------|-------------|----------|
| `effort` canonical, rename (recommended) | Canonical `effort` field + `<role>_effort` siblings; rename existing reasoning_effort→effort (no consumer reads it) | ✓ |
| Keep both | Add `effort` but retain `reasoning_effort` alias; redundant field | |
| Keep `reasoning_effort` name | Siblings become `*_reasoning_effort`; verbose, diverges from EXPOSE wording | |

**User's choice:** `effort` canonical, rename
**Notes:** Rename verified safe — zero references to resolve-model's `reasoning_effort` in commands/workflows/agents; Codex install resolves its own effort from the catalog independently. Captured as D-04/D-05.

---

## Sibling coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Blanket — every *_model (recommended) | Every *_model in every init builder gets a *_effort sibling via same-agent resolver; uniform, no special-casing | ✓ |
| Selective — spawn consumers only | Only spawn-relevant *_model fields; smaller surface but asymmetric, harder to reason about | |

**User's choice:** Blanket — every *_model
**Notes:** Coherent with explicit-null (every model has a visible effort sibling). Captured as D-06.

---

## Parity mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse golden harness + port resolver (recommended) | Port minimal effort resolution to SDK; extend existing read-only golden parity harness | ✓ |
| Dedicated effort parity fixture | Standalone parity test separate from golden init harness; second mechanism to maintain | |
| Let planner/researcher decide | Lock requirement, defer test vehicle + SDK-port boundary | |

**User's choice:** Reuse golden harness + port resolver
**Notes:** Reuses Phase 52's cross-language fixture precedent; no parallel mechanism. SDK needs the resolver shape ported (only parseModelEffort exists today). Captured as D-07/D-08.

---

## Claude's Discretion

- Exact internal structure of the SDK effort-resolver port, helper extraction, and `?? null` defaulting placement — provided the four locked contracts hold.

## Deferred Ideas

None — discussion stayed within phase scope. Adjacent concerns are already downstream phases (55, 56, 58).
