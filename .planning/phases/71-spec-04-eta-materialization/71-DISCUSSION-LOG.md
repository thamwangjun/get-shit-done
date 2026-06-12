# Phase 71: spec-04 Eta Materialization - Discussion Log

**Date:** 2026-06-12
**Mode:** discuss (default)

> Human-reference record of the discussion. NOT consumed by downstream agents — see `71-CONTEXT.md` for the canonical decisions.

## Area Selection

Presented 4 SPEC-04-specific gray areas (template/method already LOCKED by Phases 68–70 and carried forward verbatim). User selected **all four**:
- Copy-path coverage invariant
- Engine-config: invariant vs Key Decision
- ALLOWED_INLINE_REFS: rule vs list
- Error-path invariants

## Decisions

### Copy-path coverage (→ D-01, D-02)
- **Options presented:** (a) One invariant with skills `wrappedConverter` named as sub-clause, traced to TEST-01 full-install walk; (b) split per copy path.
- **Selected:** One invariant, skills named as sub-clause (recommended).
- **Notes:** `renderEtaContent` fires at `install.js:6515` and `:8731`; skills path covered only via TEST-01's full-install walk — the audit-found gap. ROADMAP SC1 mandates the explicit-invariant framing.

### Engine configuration (→ D-03, D-05)
- **Options presented:** (a) Observable config = MUST invariant, design choices = settled Key Decisions; (b) all engine config as Key Decisions only.
- **Selected:** Observable config = invariant; choices = Key Decision (recommended) — mirrors Phase 70's invariant+Key-Decision split.
- **Notes:** `autoEscape:false`, raw `<%~`, custom `resolvePath` are the observable invariant; "Eta v4 over custom resolver" + "default delimiters" are the settled decisions (ROADMAP SC3).

### ALLOWED_INLINE_REFS (→ D-04)
- **Framing adopted:** rule normative, ~30-entry list dated/advisory — the Phase 69 D-02/D-03 pattern. (Endorsed via area selection; no separate vote needed — the option described the recommended framing.)

### Error-path invariants (→ D-01 invariants 4 & 5)
- **Options presented:** (a) Two separate invariants (TEST-04 circular → descriptive `Error`; TEST-05 missing → `EtaFileResolutionError`); (b) one combined "fail-loud resolution" invariant.
- **Selected:** Two separate invariants (recommended) — distinct error classes, distinct subtests, cleanest traceability.

## Deferred Ideas

None.

## Claude's Discretion (recorded in CONTEXT.md)

EARS pattern per invariant; exact subtest-name strings in the traceability table; whether `04-INV-3` splits the resolve-path clause to a 6th invariant; table-vs-bullet rendering of the allowlist enumeration; frontmatter confidence value.
