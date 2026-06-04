# Phase 56: Spawn-Template Wiring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-04
**Phase:** 56-spawn-template-wiring
**Areas discussed:** Effort carrier mechanism, Conditional-omission style, Resolve-call shape, Edit-surface scope

---

## Effort carrier mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Agent() argument, parallel to model= | effort="{x_effort}" line next to model=; verify API honors it first | ✓ |
| Agent frontmatter effort: | Add effort: to agents/*.md frontmatter | |
| Verify-then-decide (carrier is research-output) | Lock outcome, make carrier a research deliverable | |

**User's choice:** Agent() argument, parallel to model=
**Notes:** Surfaced during discuss: the in-session Agent/Task schema exposes `model` but no `effort` param, so a mandatory plan-time verification against the live API was baked in (CONTEXT D-02) — if the arg isn't honored, fall back to the verified carrier. User later corrected that effort must be per-agent/per-site (e.g. `debugger_model_effort`), never a single global value (CONTEXT D-03).

---

## Conditional-omission style

| Option | Description | Selected |
|--------|-------------|----------|
| Shell-built arg fragment | EFFORT_ARG set only when non-empty, concatenated into call | |
| Inline conditional placeholder + instruction | effort= line with directive to render only when non-empty | ✓ |
| Resolve to omit-safe sentinel | Resolve step produces no line at all when null | |

**User's choice:** Inline conditional placeholder + instruction
**Notes:** Clarified that the Agent() block is orchestrator-interpreted pseudocode, not literal bash string-building — so a rigid shell-fragment fights the grain. User combined this with the resolve-call decision below: the `resolve-model-effort` query emits empty string when absent, so the inline conditional naturally suppresses the line. Byte-identical bare-config output is the contract (CONTEXT D-04/D-05).

---

## Resolve-call shape

| Option | Description | Selected |
|--------|-------------|----------|
| Parse model+effort from one JSON call | jq both fields from existing resolve-model | |
| Dedicated sibling query parallel to model line | resolve-model-effort gsd-X --raw | ✓ |
| Let planner choose | Lock contract, defer mechanism | |

**User's choice:** Dedicated SDK query `resolve-model-effort gsd-<agent> --raw`, parallel to the existing `resolve-model` line.
**Notes:** User directive: `debugger_model_effort=$($GSD_SDK query resolve-model-effort gsd-debugger ...)`. Thin wrapper over the existing resolver (effort already in resolve-model JSON), chosen for symmetry/grep-ability. One resolve line per site, no step renumbering (CONTEXT D-06).

---

## Edit-surface scope

| Option | Description | Selected |
|--------|-------------|----------|
| Workflows only (where spawns live) | Wire the 16 workflow files only | |
| Enumerate all three, wire where spawns exist | Grep agents/, commands/, workflows/ as evidence, then wire | ✓ |
| Let planner enumerate | Lock contract, defer enumeration | |

**User's choice:** Enumerate all three dirs, wire where spawns exist
**Notes:** Discuss-time grep vindicated the choice — found a stray spawn site in `agents/gsd-debug-session-manager.md` (resolves gsd-debugger, passes model=) that a workflows-only scope would have missed. commands/gsd/ has zero spawn sites. Inventory captured in CONTEXT D-07.

---

## Claude's Discretion

- Exact handler name/registration of the effort query (`resolve-model-effort` intended) and whether it shares the `resolve-model` code path.
- Exact wording of the inline conditional render directive (must be uniform + grep-verifiable).
- Per-site placement of the new resolve line within each existing resolve block.

## Deferred Ideas

- Codex `max`→`xhigh` translation + per-runtime install-time materialization — Phase 57.
- Golden-snapshot byte-identical proof + full regression suite — Phase 58.

(Both are downstream phases, not scope creep.)
