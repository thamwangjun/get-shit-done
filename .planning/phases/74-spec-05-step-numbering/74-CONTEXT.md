# Phase 74: spec-05 Step Numbering - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase writes the body of `.planning/spec/05-step-numbering/SPEC.md` — a behavioral-contract specification of the whole-integer step-numbering system as a **three-layer contract**: (1) the **scanner** (`tests/step-numbering-scan.test.cjs`) that detects decimal step labels (Pattern A/B `**Step N.M**`, Pattern D `N.M.` ordered-list items), letter-suffix labels (`Step 7a`), and out-of-order step sequences; (2) the **`normalize-step-numbers.cjs`** cross-file-aware idempotent maintenance CLI that renumbers decimals/letter-suffixes to sequential whole integers per section and updates cross-file prose refs; (3) the **cross-file-step-refs scanner** (`tests/cross-file-step-refs.test.cjs`) that validates every `<file>.md step N` / `step N in <file>.md` prose ref points at a real Step N in the target file. The Pattern C exclusion (`## N.N.` section headings in `plan-phase.md`, `new-milestone.md`, `new-project.md`) is specced as an **intentional** exclusion, not an oversight.

The phase fills an existing stub (frontmatter + 7-section skeleton created in Phase 68). It does NOT modify the scanner tests, the normalizer CLI, or the corpus — it specifies them. The 7-section template, the `NN-INV-M` invariant-ID scheme, the status vocabulary (`Draft|Ready|Implemented|Verified`), and the source-of-truth hierarchy are LOCKED by Phase 68's `00-CONVENTIONS.md` and inherited verbatim. The only open work is authoring the spec body — Purpose, Scope, Invariants, Acceptance Tests table, Key Decisions, Code Context — and advancing Status `Draft → Ready`.

This phase inherits the Phase 69/70/71 method wholesale: role-based invariant grouping, shape-normative-not-count, advisory-marking of current paths/symbols, every MUST tracing to a real subtest, and ROADMAP-mandated decisions recorded as "Settled — do not reopen." SPEC-05 depends on SPEC-08 (test-infrastructure) — the scanner-precedence and serial-isolation policies govern this spec's tier-1 tests; the Dependencies/`Depends on: SPEC-08` edge is preserved, not re-derived.

</domain>

<decisions>
## Implementation Decisions

### Invariant Decomposition
- **D-01:** Group invariants by **behavioral role**, not one-per-test and not one-per-layer. Target **~5–6 numbered invariants** (`05-INV-1`..`05-INV-6`), each mapping to an identifiable subtest cluster:
  1. **Decimal step-label detection** — the scanner MUST flag Pattern A/B (`**Step N.M**`, including `Step N.0`), Pattern D (`N.M.` ordered-list items at columns 0–2), and letter-suffix labels (`Step 7a`) as violations requiring renumbering to whole integers; code-fenced content is excluded. Tier-1: `step-numbering-scan.test.cjs` `scanContent()` unit subtests + the `corpus scan — decimal step labels (Pattern A/B)` and `corpus scan — decimal ordered-list items (Pattern D)` describe blocks.
  2. **Out-of-order detection** — the scanner MUST flag both reversed sequences and gaps in per-section whole-integer step numbering, resetting the counter on `##`/`###` headings and ignoring code-fenced steps. Tier-1: `scanForOutOfOrder()` unit subtests + `corpus scan — out-of-order step numbering` describe block.
  3. **Cross-file-ref integrity** — every cross-file prose ref (`<file>.md step N`, `step N in <file>.md`) MUST point at an existing whole-integer Step N heading or Pattern D item in the target file; same-file refs and code-fenced refs (symmetric fence skip) are excluded; basename collisions resolve if step N exists in ANY file sharing the basename. Tier-1: `cross-file-step-refs.test.cjs` (`extractStepSet`/`findCrossFileRefs` units + the corpus + RED synthetic-stale-ref subtests).
  4. **Normalizer idempotent renumber** — the `normalize-step-numbers.cjs` CLI MUST renumber decimal/letter-suffix labels to sequential whole integers per section and converge (a second run on a clean corpus reports "No changes needed"; `--dry-run` exits 0 without writing). Traces per D-03 to scanner GREEN.
  5. **Normalizer cross-file-ref update** — when the CLI renumbers a label, it MUST update the corresponding cross-file prose refs across the corpus (dynamically discovered, not from a pre-built manifest) so the cross-file-ref scanner stays GREEN. Traces per D-03 to scanner GREEN.
  - Rationale: keeps the Acceptance Tests traceability table legible and move-proof; mirrors Phase 69/70/71 D-01. Rejected one-per-test (table rots every upstream merge) and one-per-layer (coarse, multi-claim invariants that fail the QUAL-01/02 falsifiability bar).
  - **Claude's discretion:** whether decimal detection (INV-1) and out-of-order (INV-2) collapse to one invariant or stay split; whether the two normalizer invariants (INV-4/5) merge into one if the per-section-renumber and cross-ref-update clauses read cleanly together.

### Pattern C Exclusion — intentional, dual-framed
- **D-02:** The **Pattern C exclusion is recorded as BOTH a settled Key Decision AND an explicit Out-of-scope Scope bullet.** ROADMAP SC1 demands it be specced as intended, not an oversight. The durable framing: `## N.N.` numbered **section headings** (no "Step" keyword) in `plan-phase.md`, `new-milestone.md`, and `new-project.md` are document structure, not step sequences, and are deliberately excluded from all corpus subtests (the original v2.1.0-d D-07 deferral). The Key Decision entry carries the consequence of reopening (the three files' section headings would be mass-flagged as false-positive violations and either corrupted by the normalizer or block CI). The Scope Out-of-scope bullet makes the exclusion visible at-a-glance so a future reader does not read silence as an oversight. The literal three-file list is a dated, advisory enumeration (`PATTERN_C_EXCLUDES` `current as of 2026-06-12`) — the **rule** is normative, the **file list** is advisory.

### Normalizer Traceability — scanner-GREEN as acceptance check
- **D-03:** The normalizer's MUST invariants (D-01 INV-4/5) **trace to the scanner tests going GREEN after a normalizer run**, not to a dedicated normalizer test (none exists). The scanner IS the normalizer's acceptance oracle: a correct normalization run leaves `step-numbering-scan.test.cjs` and `cross-file-step-refs.test.cjs` with zero corpus violations, and a second run is a no-op. The Acceptance Tests table cites those two scanner test files as the evidence for the normalizer invariants (NOT `[MISSING — write test first]` — the coverage exists, just indirectly). The CLI file path (`scripts/normalize-step-numbers.cjs`), its function names (`buildRenameMap`, `applyRenameMap`, `discoverCrossFileRefs`, `processFile`), and the `--dry-run`/idempotency behavior go in `## Code Context` marked `<!-- advisory -->`. Rationale: honest about the no-dedicated-test reality while still giving the normalizer a falsifiable contract; avoids planting a `[MISSING]` row that Phase 77 would flag for a gap that does not actually exist.

### Internal Ordering (ROADMAP SC2)
- **D-04:** The **scanner → normalizer → cross-file-ref-scanner internal ordering MUST be stated explicitly within the spec** (ROADMAP SC2). Placement is the Purpose narrative and/or a Key Decision: the scanner detects violations (the gate), the normalizer fixes them in-place (the remediation), and the cross-file-ref scanner validates that remediation did not strand prose references. Captured as a stated contract, not left implicit. **Claude's discretion:** whether this lives as a sentence in Purpose, a dedicated Key Decision, or both.

### Corpus counts — shape normative, count dated
- **D-05:** Per `00-CONVENTIONS.md` §4 and sibling precedent, any corpus count (the historically "6 known violating files", the SCAN_DIRS set, the three Pattern C files) is recorded as a **dated "current as of 2026-06-12" advisory enumeration**; the normative claim is the **shape** (what constitutes a violation, what the SCAN_DIRS scope means), never the count. Rejected count-as-normative (rots every merge).

### Claude's Discretion
- Exact EARS pattern per invariant (Ubiquitous vs Event-driven vs Unwanted-behavior), provided each is a single falsifiable claim mapping to a subtest.
- Exact subtest/assertion-shape strings in the Acceptance Tests table — planner/executor read the two test files and cite the real `describe`/`test` names.
- Whether to abbreviate the SCAN_DIRS / Pattern C enumerations to representative classes vs literal lists.
- Confidence value to stamp in frontmatter when the body is finalized.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tier-1 normative sources (the spec narrates these)
- `tests/step-numbering-scan.test.cjs` — THE scanner behavioral source. `scanContent()` (Pattern A/B + Pattern D + letter-suffix detection, code-fence exclusion) and `scanForOutOfOrder()` (per-section reversed/gap detection, `##`/`###` reset, list/blockquote-marker stripping) unit subtests, plus the three corpus describe blocks. Defines `SCAN_DIRS`, `PATTERN_C_EXCLUDES`, `STEP_DECIMAL_RE`. Every scanner invariant and Acceptance Tests row traces here.
- `tests/cross-file-step-refs.test.cjs` — THE cross-file-ref scanner source. `extractStepSet()` (whole-integer heading + Pattern D extraction, symmetric fence skip), `findCrossFileRefs()` (two `XREF_PATTERNS` word-order variants, same-file skip, basename-collision tolerance), the corpus describe block, and the RED synthetic-stale-ref subtest. INV-3 traces here.

### Implementation file (advisory — narrate into Code Context, no normative claim rests here)
- `scripts/normalize-step-numbers.cjs` — the cross-file-aware idempotent maintenance CLI. Functions: `buildRenameMap` (per-section sequential renumber, Step 0 preserved), `applyRenameMap` (line-by-line rewrite with symmetric fence skip), `discoverCrossFileRefs` (dynamic corpus-wide ref discovery, merged basename rename maps), `processFile` (idempotent write gate, `--dry-run`). `STEP_DECIMAL_RE`/`PATTERN_D_RE`/`XREF_PATTERNS` literals to narrate (advisory). Normalizer invariants trace to scanner-GREEN per D-03, not to this file.

### Spec-set conventions (LOCKED — inherited verbatim)
- `.planning/spec/00-CONVENTIONS.md` — the 7-section template, the `NN-INV-M` ID scheme, status vocabulary, source-of-truth hierarchy, and §4 "shape is normative, not the count." The SPEC.md MUST conform exactly — no section drift (Phase 77 rejects drift).
- `.planning/spec/05-step-numbering/SPEC.md` — the stub being filled (frontmatter + empty section skeleton already present; `Depends on: SPEC-08`; tier-1 evidence already names both scanner test files).
- `.planning/spec/INDEX.md` — feature-status manifest; the `SPEC-05` row (Draft, depends on SPEC-08), the `SPEC-08 → SPEC-05` dependency edge, and the Wave-2 mapping this spec must stay consistent with.

### Milestone scope & requirements
- `.planning/REQUIREMENTS.md` — the SPEC-05 handle and the shared QUAL-01–05 quality bars a spec must satisfy to reach `Ready`.
- `.planning/ROADMAP.md` §"Phase 74: spec-05 Step Numbering" (lines ~870–881) — the three success criteria (three-layer contract w/ Pattern C intentional; explicit internal ordering; EARS invariants + shape-not-count + traceability + advisory paths + settled Key Decisions). Also §"Phase 77" for the cross-spec reconciliation this spec must survive.
- `.planning/phases/68-spec-scaffold/68-CONTEXT.md` — Phase 68 decisions (template, ID scheme) that bind this phase.
- `.planning/phases/69-spec-01-positive-framing/69-CONTEXT.md`, `.planning/phases/70-spec-02-sha-versioning/70-CONTEXT.md`, `.planning/phases/71-spec-04-eta-materialization/71-CONTEXT.md` — sibling specs; their D-01 (role-based grouping), shape-not-count, advisory-marking, and Key-Decision-vs-Invariant split patterns are inherited here.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/step-numbering-scan.test.cjs` (~329 lines) and `tests/cross-file-step-refs.test.cjs` (~420 lines) — fully populated and passing; they are both the evidence and the structure for the spec. The author reads them once and narrates the `describe`/`test` names, the detection regexes, and the corpus/unit/RED subtest split.
- Phase 71's `04-eta-materialization/SPEC.md` (and 69/70) are worked references for section shape, advisory-marking, the invariant+Key-Decision split, and the rule-normative-list-advisory pattern (directly applicable to D-02's Pattern C framing and D-05's corpus-count framing).

### Established Patterns
- The spec is a narration exercise, not a design exercise: the source-of-truth hierarchy puts the tests at tier-1, so any disagreement between a test and a reference doc resolves in favor of the test.
- Advisory marking: every current path/symbol/function name (the two test files' helpers, `normalize-step-numbers.cjs`, the regex literals, `SCAN_DIRS`) goes under `## Code Context` with `<!-- advisory -->`; no normative claim rests on it (move-proofing for the upstream refactor).
- Three test artifacts and one untested CLI cover the three layers — the normalizer's correctness is observable via scanner-GREEN (D-03), the key asymmetry this spec must narrate honestly.

### Integration Points
- SPEC-05 is a **dependent node** in the INDEX dependency graph (`Depends on: SPEC-08`) — the edge already exists; this phase preserves it, adds none.
- This SPEC.md feeds Phase 77 (Cross-Spec Consistency Review). The Acceptance Tests table must be mechanically checkable (keyed on `05-INV-M`, citing real subtests) with no unflagged `[MISSING]` rows.
- Status transition `Draft → Ready` happens in this phase, gated on QUAL-01–05.

</code_context>

<specifics>
## Specific Ideas

- The scanner detects FOUR violation shapes the spec must enumerate: Pattern A/B (`**Step N.M**`, incl. `Step N.0`), Pattern D (`N.M.` list items cols 0–2), letter-suffix (`Step 7a`), and out-of-order sequences (reversed + gaps). Step 0 is a valid starting label, not a violation.
- The cross-file-ref scanner has a subtle basename-collision rule: a ref to `execute-phase.md` is valid if Step N exists in ANY file with that basename (e.g., the thin `commands/gsd/execute-phase.md` delegates to the canonical `get-shit-done/workflows/execute-phase.md`) — INV-3 must state this, not assume one file per basename.
- The normalizer's cross-file-ref discovery is **dynamic** (greps the whole corpus on every run, D-01 of v2.1.0-d) — there is NO pre-built MAP-01 manifest consumed at runtime; the spec must not imply a persisted map.
- Symmetric fence skip is a recurring invariant clause across all three layers: code-fenced steps/refs are excluded on BOTH the source-scan and target-extract sides.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. The normalizer-traceability choice (D-03), the Pattern C dual-framing (D-02), and the internal-ordering placement (D-04) are placement decisions within the spec, not deferrals. No INDEX dependency edges or scope additions were proposed; writing a dedicated normalizer test was considered (D-03 option B) and explicitly declined in favor of scanner-GREEN traceability.

</deferred>

---

*Phase: 74-spec-05-step-numbering*
*Context gathered: 2026-06-12*
