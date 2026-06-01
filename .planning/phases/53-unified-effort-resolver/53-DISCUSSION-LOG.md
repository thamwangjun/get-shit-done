# Phase 53: Unified Effort Resolver - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 53-unified-effort-resolver
**Areas discussed:** Override + effort interaction, Claude 'max' ceiling, CONFIG-04 validation strictness, Rewrite vs extend the fn

---

## Override + Effort Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Parse & emit from override | parseModelEffort(override); parsed effort becomes highest-precedence; bare override omits. Removes early-null at core.cjs:1545. | ✓ |
| Emit, but gate on allowlist | Same, but emit only when runtime ∈ {claude,codex} | |
| Keep omit-on-override | Any override suppresses effort (rejects CONFIG-01) | |

**User's choice:** Parse & emit from override.
**Notes:** Reconciliation locked by RESOLVE-05 — the `{claude,codex}` allowlist remains the outermost gate; the override effort emits only within it. A non-{claude,codex} install with a `model;effort` override still omits. (Effectively the intent of the runner-up option, but applied as a global invariant rather than an override-specific branch.)

---

## Claude 'max' Ceiling

| Option | Description | Selected |
|--------|-------------|----------|
| Verify first, then decide | Plan tests effort: max; clamp on Claude path only if rejected | |
| Always clamp max→xhigh | Proactively clamp on Claude path, skip verification | |
| Emit max, no clamp | Trust Claude accepts max; emit verbatim | ✓ (via authoritative answer) |

**User's choice:** Provided authoritative documentation that `max` IS a valid Claude effort level (Opus 4.8, Mythos Preview, Opus 4.7, Opus 4.6, Sonnet 4.6).
**Notes:** This closes the ROADMAP plan-time-verification item outright — no Claude-side clamp. Codex max→xhigh clamp (RESOLVE-04) still applies for Codex only. Model-capability caveat (max needs a capable model) deferred to Phase 55 catalog assignment.

---

## CONFIG-04 Validation Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Warn + graceful degrade | One-time warn, strip to base model, effort: null; route 3 sites through parseModelEffort | ✓ |
| Hard-reject at validation | Malformed token = blocking error in validate pass | |
| Warn now, reject in validate-only | Lenient at runtime, strict on demand | |

**User's choice:** Warn + graceful degrade.
**Notes:** Consistent with existing tier-typo handling (core.cjs:1199) and Phase 52 warn-inside-parser. No separate validation pass; CONFIG-04 satisfied by routing the three config sites through parseModelEffort.

---

## Rewrite vs Extend the Fn

| Option | Description | Selected |
|--------|-------------|----------|
| Full rewrite, one chain | Single precedence chain consuming _resolveAgentSlot + parseModelEffort; static {claude,codex} allowlist; golden-snapshot guard | ✓ |
| Minimal layering | Add Claude branch alongside existing Codex branches; leaves duplicated tier lookup | |

**User's choice:** Full rewrite, one chain.
**Notes:** Kills the duplicated phase-type tier block (~core.cjs:1563-1577), upholds Phase 52's same-slot invariant, swaps the data-derived allowlist for static. Behavior-preserving golden snapshot guards bare configs.

## Claude's Discretion

- Internal structure of the rewritten function, helper extraction, and exact placement of the Codex max→xhigh clamp at the emit boundary.

## Deferred Ideas

- Per-model `max` capability validation → Phase 55 catalog assignment.
- SDK/JSON exposure of resolved effort → Phase 54.
- Catalog schema widening + user hand-assignment → Phase 55.
