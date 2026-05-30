# Phase 50: Maintenance Script and Cross-Ref Scanner - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver two new artifacts that make the whole-integer step numbering invariant self-maintaining after upstream merges:

1. `scripts/normalize-step-numbers.cjs` — a cross-file-aware, idempotent maintenance script. Detects decimal step labels across SCAN_DIRS, renumbers them to sequential whole integers, updates same-file prose references, and dynamically discovers and updates cross-file prose references. Runs standalone after any upstream merge.

2. `tests/cross-file-step-refs.test.cjs` — a scanner test that detects prose cross-file step references (e.g., `execute-phase.md step 5` or `step 5 in execute-phase.md`) where the referenced step number does not exist as a heading in the target file. Prevents stale step refs from surviving future upstream merges undetected.

Plus: harden `scanForOutOfOrder` in `tests/step-numbering-scan.test.cjs` (replace line-start anchor `^\s*\*?\*?` with `^[\s*]*` + list-marker stripping) as a prerequisite plan.

**In scope:** `agents/`, `get-shit-done/workflows/`, `commands/gsd/` — same SCAN_DIRS as `step-numbering-scan.test.cjs`
**Out of scope:** Pattern C files (`plan-phase.md`, `new-milestone.md`, `new-project.md`), `get-shit-done/references/`, `get-shit-done/templates/`, `sdk/`, `tests/` source

</domain>

<decisions>
## Implementation Decisions

### Normalize Script: Cross-File Reference Discovery
- **D-01:** `normalize-step-numbers.cjs` discovers cross-file prose references dynamically by grepping the entire corpus on every run — no pre-built manifest file consumed. This ensures the script remains accurate after any upstream merge that introduces new cross-file refs, without requiring Phase 49's MAP-01.md artifact.
- **D-02:** The script's output reports cross-file ref updates explicitly — each updated cross-file reference is logged alongside file-level rename stats. Transparency makes post-merge verification straightforward.
- **D-03:** `--dry-run` flag exits 0 and reports "no changes needed" on the post-Phase-49 clean corpus (idempotency guarantee). In dry-run mode the script also reports what it *would* change.

### Cross-File Scanner: Detection Pattern
- **D-04:** `tests/cross-file-step-refs.test.cjs` detects both word-order variants: `filename.md step N` AND `step N in filename.md`. No same-file ref exclusion needed (scanner checks whether the file referenced is the *same* file doing the referencing — if so, skip).
- **D-05:** Step existence check uses prose headings only, skipping content inside code fences — mirrors `step-numbering-scan.test.cjs` behavior. A cross-file ref pointing to a code-fenced step is a false ref (code fences document examples, not real steps).
- **D-06:** The RED test (synthetic stale ref injection) injects a reference in a temporary file (not by modifying corpus files) to confirm detection without dirtying the actual corpus.

### Plan Structure
- **D-07:** `scanForOutOfOrder` anchor hardening is Plan 1 — a standalone plan that edits `tests/step-numbering-scan.test.cjs` before any new artifacts are built. This ensures the scanner is solid before the normalize script and cross-file test build on top of it.
- **D-08:** Plan 2 builds `scripts/normalize-step-numbers.cjs`. Plan 3 builds `tests/cross-file-step-refs.test.cjs`. Three plans total for Phase 50.

### Claude's Discretion
- Exact output format of the normalize script (tabular, list, or summary counts — Claude decides)
- Whether `normalize-step-numbers.cjs` accepts specific file paths as arguments for targeted single-file runs (useful ergonomic enhancement — Claude decides if it adds complexity)
- Synthetic stale ref injection mechanism in the RED test (temp file creation pattern or inline string fixture)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scanner (Phase 50 builds on top of)
- `tests/step-numbering-scan.test.cjs` — the Phase 48/49 scanner; read `scanContent()`, `scanForOutOfOrder()`, file collection pattern, and PATTERN_C_EXCLUDES before writing the normalize script or cross-file test; Phase 50 Plan 1 hardens `scanForOutOfOrder` here
- `tests/execute-phase-step-7-deviation-doc.test.cjs` — renamed from `execute-phase-step-5-5` in Phase 49; confirms the test rename precedent and how co-located test assertions were updated

### Requirements
- `.planning/REQUIREMENTS.md` §NORM-02 — normalize script spec: cross-file-aware, MAP-01 reference index pattern, `--dry-run` flag, idempotency guarantee
- `.planning/REQUIREMENTS.md` §XREF-01 — cross-file scanner spec: detects prose refs where step N doesn't exist as heading in target file
- `.planning/ROADMAP.md` §Phase 50 — success criteria and the Phase 48 anchor hardening note (Known input from Phase 48 section)

### Cross-File Reference Context (from Phase 49)
- `.planning/phases/49-survey-and-normalization/49-MAP-01.md` — the Phase 49 cross-file reference inventory; shows the exact patterns found in the corpus (`execute-phase.md step 5.5`, `step 5.8` ref in post-merge-gate.md) and which were classified as same-file vs. cross-file; normalize script must find these dynamically at runtime
- `.planning/phases/49-survey-and-normalization/49-CONTEXT.md` — Phase 49 decisions; D-03 commit strategy and D-05 plan granularity inform what Phase 50 builds on top of

### Project Context
- `.planning/PROJECT.md` — milestone goal, constraints, key decisions; read §Current Milestone and §Key Decisions before planning
- `.planning/phases/48-tdd-red-gate/48-CONTEXT.md` — Phase 48 scanner design decisions; SCAN_DIRS and PATTERN_C_EXCLUDES set here

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/step-numbering-scan.test.cjs` — direct structural template: file collection loop, per-directory describe blocks, `scanContent()` return shape, code-fence skip pattern, and `PATTERN_C_EXCLUDES` Set. Both new artifacts should mirror this structure.
- `scripts/strip-prose-atrefs.cjs` — an existing scripts/ maintenance script; read its structure (arg parsing, dry-run flag pattern, file enumeration, in-place write) as a template for `normalize-step-numbers.cjs`
- `tests/negative-framing-scan.test.cjs` — scanner that injects synthetic corpus entries in tests; examine its RED-test approach for the cross-file scanner's stale-ref injection pattern

### Established Patterns
- Code-fence exclusion: scanner toggles inside-fence state on ` ``` ` lines — apply same toggle in cross-file-step-refs.test.cjs when extracting real step headings from target files
- SCAN_DIRS + PATTERN_C_EXCLUDES: defined in step-numbering-scan.test.cjs; cross-file-step-refs.test.cjs must use identical scope to stay consistent
- Per-section step counter reset: `##` and `###` headings trigger reset in `scanForOutOfOrder` — relevant context for the anchor hardening in Plan 1

### Integration Points
- `tests/step-numbering-scan.test.cjs` — Plan 1 modifies `scanForOutOfOrder` anchor; must not break any of the existing 7 corpus subtests or the unit subtests (run `npm test` after Plan 1)
- `scripts/` directory — `normalize-step-numbers.cjs` goes here alongside other maintenance scripts; no test infrastructure wiring needed (it's a standalone CLI, not a test file)
- `tests/` directory — `cross-file-step-refs.test.cjs` is auto-discovered by `scripts/run-tests.cjs`; adding it there is sufficient

</code_context>

<specifics>
## Specific Ideas

- The normalize script's cross-file ref discovery should use the same grep pattern as MAP-01's survey command: `Step\s+\d+(?:\.\d|[a-z])` combined with `[filename].md` co-occurrence — building the reference map the same way Phase 49 did it manually
- The cross-file scanner's two detection patterns: `(?:[\w/-]+\.md)\s+step\s+(\d+)` and `step\s+(\d+)\s+in\s+(?:[\w/-]+\.md)` — roughly; exact regex is Claude's call
- `normalize-step-numbers.cjs --dry-run` should produce the same output shape as a real run but with "(dry run)" annotations rather than writing files

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 50-Maintenance Script and Cross-Ref Scanner*
*Context gathered: 2026-05-30*
