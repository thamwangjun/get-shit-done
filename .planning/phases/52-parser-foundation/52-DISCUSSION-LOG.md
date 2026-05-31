# Phase 52: Parser Foundation — Discussion Log

**Date:** 2026-05-31
**Mode:** discuss (standard)

> Human-reference record of the discussion. Not consumed by downstream agents — see `52-CONTEXT.md` for the authoritative decisions.

## Areas Selected for Discussion

All three offered gray areas were selected:
1. Malformed-effort behavior
2. `_resolveAgentSlot` scope for Phase 52
3. Parity test mechanism

(The parser's split rule, `core.cjs` placement, and the TS mirror were pre-locked by HIGH-confidence research and not re-discussed.)

## Area 1 — Malformed-effort behavior

**Question:** When `parseModelEffort` sees a colon suffix not in the effort allowlist (typo vs. real provider ID), warn or stay silent?
**Options:** Pure/silent (recommended) | Warn inside parser
**Selected:** Warn inside parser.

**Follow-up:** How to warn without false-positives on provider IDs (`openrouter:...`)?
**User decision (pivot):** Switch the delimiter from `:` to `;`. With a semicolon, provider colons are never delimiters, so the false-positive problem vanishes and any non-token suffix after `;` is an unambiguous typo → warn cleanly. User flagged this as a new decision with milestone-wide impact and asked for it to be propagated across artifacts.

## Area 2 — `_resolveAgentSlot` scope

**Question:** Refactor existing `resolveModelInternal` to use the new helper now, or helper-only and defer wiring to Phase 53?
**Options:** Refactor model resolver now (recommended) | Helper-only, defer
**Selected:** Refactor model resolver now — proves the same-slot path end-to-end and removes the #3023 copy-paste this phase.

## Area 3 — Parity test mechanism

**Question:** Shared fixture table vs. duplicated cases per language?
**Options:** Shared JSON fixture table (recommended) | Duplicated cases
**Selected:** Shared JSON fixture table — single source of truth, prevents drift.

## Claude's Discretion / Notes

- Derived the malformed-suffix behavior under the `;` delimiter: strip to base model, `effort: null`, one-time warn (recorded in CONTEXT DECISION 2).
- Flagged a shell-safety verification item: combined `model;effort` strings must not reach an unquoted shell context.

## Milestone Artifacts Updated (delimiter `:` → `;`)

- `.planning/ROADMAP.md` (milestone goal, Phase 52 criterion #1, Phases 53/55 notation)
- `.planning/REQUIREMENTS.md` (PARSE-01 rewrite + delimiter note; all `model;effort` notation)
- `.planning/research/PITFALLS.md` (Pitfall 1 reframed RESOLVED + code snippet)
- `.planning/research/ARCHITECTURE.md` (parser pattern, diagram, data-flow)
- `.planning/research/SUMMARY.md`, `FEATURES.md`, `STACK.md` (notation/examples)

## Deferred Ideas

None.
