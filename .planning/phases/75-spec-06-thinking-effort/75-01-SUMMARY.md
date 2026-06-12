---
phase: 75-spec-06-thinking-effort
plan: 01
subsystem: spec
tags: [spec, thinking-effort, resolver, parser, codex-emit, golden-snapshot]
dependency_graph:
  requires: [SPEC-08]
  provides: [SPEC-06]
  affects: [.planning/spec/06-thinking-effort/SPEC.md, .planning/spec/INDEX.md]
tech_stack:
  added: []
  patterns: [role-based-invariants, shape-normative-advisory, EARS-RFC2119, acceptance-tests-traceability, settled-key-decisions]
key_files:
  created: []
  modified:
    - .planning/spec/06-thinking-effort/SPEC.md
    - .planning/spec/INDEX.md
decisions:
  - "SPEC-06 Status advanced Draft -> Ready; 7 role-based EARS invariants authored (06-INV-1..06-INV-7)"
  - "D-08 medium floor stated as MUST-level invariant (06-INV-3), separate from precedence chain (06-INV-2) and allowlist gate (06-INV-4), per D-03"
  - "Codex emit linchpin Key Decision (a) names real WR-03 modelEmitted guard seam; flags rawSlotForRuntime as ROADMAP paraphrase with no literal symbol"
  - "All enumerations marked advisory current as of 2026-06-12; normative claim is always the shape per D-07"
  - "Golden snapshot structure described (330 rows, 13 omitContract entries, advisory); feat-58-regression.test.cjs named tier-1, init.cjs named tier-2 per SC3"
  - "Acceptance Tests table routes each invariant to its closest oracle (7 dedicated unit oracles + golden snapshot); no unflagged [MISSING] rows"
metrics:
  duration: 377s
  completed: 2026-06-12
  tasks: 2
  files: 2
---

# Phase 75 Plan 01: SPEC-06 Thinking Effort Summary

**One-liner:** Full behavioral-contract spec for GSD per-agent thinking effort — `parseModelEffort` semicolon parser, `resolveReasoningEffortInternal` unified precedence chain with D-08 medium floor, static `{claude,codex}` allowlist gate, `translateEffortForCodex` boundary, `*_effort` init siblings, spawn-template wiring, and install.js WR-03 Codex emit seam — Status advanced Draft -> Ready.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author Purpose, Scope, Invariants, and Acceptance Tests | 06fde3b0 | `.planning/spec/06-thinking-effort/SPEC.md` |
| 2 | Author Key Decisions + Code Context, flip Status, sync INDEX.md | d49540bb | `.planning/spec/06-thinking-effort/SPEC.md`, `.planning/spec/INDEX.md` |

## What Was Built

**Task 1** filled the first four sections of the SPEC-06 stub with normative content:

- **Purpose** (one paragraph): states the per-agent thinking-effort "why" — the nine connected surface behaviors, the three failure modes (D-08 floor absence / allowlist leak / WR-03 drift), and cites `tests/feat-58-regression.test.cjs` as tier-1 oracle and `init.cjs` as tier-2 implementation.
- **Scope In-scope**: one bullet per behavioral role with every concrete enumeration marked advisory "current as of 2026-06-12"; Out-of-scope covers CATALOG-02 user-handover boundary (D-06), no-behavior-change assertion, and TEST-04 antipattern guard placement.
- **Invariants**: 7 role-based EARS invariants (06-INV-1 through 06-INV-7) with RFC 2119 MUST strength and "Consequence of violating this invariant:" closers. 06-INV-3 (D-08 floor) and 06-INV-4 (static allowlist gate) are kept SEPARATE from 06-INV-2 (precedence chain) per D-03.
- **Acceptance Tests**: traceability table keyed on 06-INV-M routes each invariant to its closest dedicated oracle. 06-INV-1 → `parse-model-effort.test.cjs` + parity; 06-INV-2 → `feat-53-unified-effort-resolver.test.cjs` + feat-57 max-verbatim; 06-INV-3 → `feat-53-config-sites-and-golden.test.cjs` D-08 + feat-58 TEST-01; 06-INV-4 → feat-53 non-effort no-op + feat-58 omitContract rows; 06-INV-5 → feat-58 TEST-03; 06-INV-6 → `phase-56-effort-wiring.test.cjs` + feat-58 TEST-01; 06-INV-7 → `feat-57-install-translation.test.cjs` Codex TOML emit + phase-56 GAP A. Golden snapshot structure described (330 rows, 13 omitContract, advisory counts). Zero unflagged [MISSING] rows.

**Task 2** authored the remaining two sections and advanced the status:

- **Key Decisions**: six settled decisions in lettered format `### (a)..(f)` with decision statement, one-sentence rationale, "Settled — do not reopen.", and "Consequence of reopening:" closer. Decision (a) names the real WR-03 `modelEmitted` guard as the correctness linchpin and explicitly states that "`rawSlotForRuntime`" is a ROADMAP paraphrase with no literal symbol in source. All six decisions are "Settled — do not reopen."
- **Code Context**: marked `<!-- advisory -->`, dated "current as of 2026-06-12", with symbol/line tables for `core.cjs` (~1221/~1242/~1278/~1628/~1719), `model-catalog.cjs` (~97), `init.cjs` siblings (~21 call sites), and `bin/install.js` emit seam (~1456/~1520–1529/~2760–2787/~2795). All enumerations marked advisory with shape called out as normative.
- **Frontmatter status flip**: `**Status:** Draft` → `**Status:** Ready`, `**Confidence:** High`, `**Specced:** 2026-06-12`. H1, `**Depends on:** SPEC-08`, and tier-1 evidence line preserved unchanged.
- **INDEX.md**: SPEC-06 Feature-Status row advanced Draft → Ready. SPEC-08 → SPEC-06 dependency edge and Depends On cell preserved.

## Deviations from Plan

None — plan executed exactly as written. Both tasks completed in the intended order; all verify blocks passed on first execution.

## Verification Results

Task 1 automated verify:
```
test $(grep -cE '06-INV-[1-8]' SPEC.md) -ge 6  →  PASS (14 occurrences; 7 distinct IDs)
grep -F 'TEST-03: translateEffortForCodex boundary'  →  PASS
grep -F 'Phase 53: non-{claude,codex} runtime hard no-op'  →  PASS
! grep -q '\[MISSING'  →  PASS (zero [MISSING] rows)
```

Task 2 automated verify:
```
grep -q '^\*\*Status:\*\* Ready'  →  PASS
grep -q 'modelEmitted'  →  PASS
grep -q 'rawSlotForRuntime'  →  PASS
grep -q '<!-- advisory -->'  →  PASS
grep -q '\*\*Depends on:\*\* SPEC-08'  →  PASS
grep -qE 'SPEC-06.*Ready' INDEX.md  →  PASS
```

Full test suite: 1789 pass, 0 fail, 1 skip — GREEN. No fenced code blocks in authored SPEC.md sections (0 occurrences of ```).

## Known Stubs

None. This phase authors a specification document, not executable code. No data flow is wired; no stubs exist.

## Threat Flags

None. This phase authors a non-executable Markdown specification file. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries were introduced. All content references public source symbols and test names only.

## Self-Check: PASSED

- `.planning/spec/06-thinking-effort/SPEC.md` exists with Status Ready and all six sections authored.
- `.planning/spec/INDEX.md` SPEC-06 row reads Ready with SPEC-08 dependency edge preserved.
- Task 1 commit `06fde3b0` and Task 2 commit `d49540bb` verified in git log.
- Test suite GREEN (1789/1789 pass).
