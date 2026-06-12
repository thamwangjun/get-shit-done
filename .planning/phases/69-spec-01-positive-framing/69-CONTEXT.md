# Phase 69: spec-01 Positive Framing - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase writes the body of `.planning/spec/01-positive-framing/SPEC.md` — a behavioral-contract specification of the affirmative-framing standard and the negative-framing corpus scanner, durable enough that a reimplementer can rebuild the scanner on a refactored upstream without reading the current source.

The phase fills an existing stub (frontmatter + 7-section skeleton already created in Phase 68). It does NOT modify the scanner, the standard, or any corpus file — it specifies them. The 7-section template, the `NN-INV-M` invariant-ID scheme, the status vocabulary, and the source-of-truth hierarchy are all LOCKED by Phase 68's `00-CONVENTIONS.md` and are inherited verbatim. The only open work is authoring the spec body: Purpose, Scope, Invariants, Acceptance Tests table, Key Decisions, Code Context — and advancing Status from `Draft` to `Ready`.

The tier-1 normative source is `tests/negative-framing-scan.test.cjs`. The test IS the spec; the SPEC.md is a faithful, move-proof narration of what that test asserts.

</domain>

<decisions>
## Implementation Decisions

### Invariant Decomposition
- **D-01:** Group invariants by **behavioral role**, not one-per-pattern and not a single mega-invariant. Target ~5 numbered invariants (`01-INV-1`..`01-INV-5`):
  1. **Detection** — a negative-directive token occurring as a directive at clause/line start in a scanned file is flagged as a negative-framing violation.
  2. **Two-tier severity** — block-set tokens produce a hard failure; warn-only-set tokens surface as warnings without failing (see D-04).
  3. **Exception suppression** — directives paired with a positive complement, and factual/conditional/reframe usages, MUST NOT be flagged (see D-03).
  4. **Affirmative-rewrite remediation rule** — recorded as the governing standard (see note below; lives in Key Decisions, not as a MUST invariant, because the scanner does not test rewriting).
  5. **Scan scope** — the four scan directories and code-fence exclusion.
  - Rationale: keeps the Acceptance Tests traceability table legible and move-proof; each invariant maps to an identifiable subtest cluster in the tier-1 test. Rejected one-per-pattern (table rots every upstream merge, obscures the shared shape) and single mega-invariant (not falsifiable at subtest granularity — fails the QUAL traceability bar).

### Count vs Shape
- **D-02:** The **detection shape is normative; the branch enumeration is dated, not normative.** The falsifiable invariant asserts the shape — "a clause-start negative directive, minus the exception classes, is flagged." The explicit list of 12+ current branches (doNot, never, dont, antiPatterns, mustNot, shouldNot, cannot, wont, willNot, prohibited, forbidden, avoid, warn-only variants) appears as a **supporting enumeration marked `current as of 2026-06-12`**, satisfying ROADMAP success-criterion 1 ("enumerates all 12+ branches") without making the count the contract.
  - Rationale: honors `00-CONVENTIONS.md` §4 "shape is normative, not the count — counts change with every upstream merge." Rejected count-as-normative (rots every merge, contradicts conventions).

### Exception Predicates
- **D-03:** Exception behavior is **normative as behavioral classes; the specific regex heuristics are advisory.** A MUST invariant states that factual, conditional, and reframe usages, and directives paired with a positive complement, MUST NOT be flagged. The behavioral CLASSES (paired-complement / factual-never / conditional-or-factual / reframe / factual-dont / avoid-directive / forbidden-directive) are the durable contract; the current regex predicates (`hasPositiveComplement`, `isFactualNever`, `isReframePattern`, `isConditionalOrFactual`, `isFactualDont`, `isAvoidDirective`, `isForbiddenDirective`) live in `## Code Context` as advisory pointers.
  - Rationale: a reimplementer who flags every factual "never" ships a broken, noisy scanner — so the exceptions must be reproduced. But locking exact regexes ties the spec to the current implementation and defeats reimplementation-readiness. Rejected fully-advisory (loses the contract) and fully-normative-incl-regexes (brittle).

### Warn vs Block Tiering
- **D-04:** Two-tier severity is a **falsifiable invariant plus a locked Key Decision.** Invariant: block-set tokens (never, do not, avoid, don't, `<anti_patterns>` tag, must not, should not, prohibited, forbidden) cause a hard failure; the warn-only set (cannot, won't, will not) surfaces in the warnings bucket without failing the run. Tier membership and the warn-only rationale (test decisions D-16–D-23) are recorded as a Key Decision **"Settled — do not reopen."**
  - Rationale: the two-tier split is a deliberate design contract a reimplementer must preserve; collapsing it loses warn-only intent. Rejected single-severity-with-footnote.

### Affirmative-Rewrite Replacement Rule
- **D-05:** The affirmative-rewrite rule ("negative directives are replaced with affirmative instructions that state the correct behavior — not merely deleting the prohibition") is captured as a **Key Decision / governing standard in Purpose**, NOT as a MUST invariant. The scanner only *flags*; it does not test rewriting, so there is no tier-1 test for the rewrite rule. Per `00-CONVENTIONS.md`, every MUST invariant must map to a test — a rewrite invariant would be permanently `[MISSING — write test first]`, which is wrong here because the rule is a human/authoring standard, not a scanner behavior. ROADMAP criterion 1 ("enumerate the affirmative-rewrite replacement rule") is satisfied by documenting it in Purpose + Key Decisions.

### Claude's Discretion
- Exact wording and EARS pattern choice per invariant (Ubiquitous vs Event-driven vs Unwanted-behavior), provided each is a single falsifiable claim mapping to a subtest.
- Exact subtest/assertion-shape strings in the Acceptance Tests table — planner/executor read `tests/negative-framing-scan.test.cjs` and cite the real subtest names.
- Confidence value to stamp in frontmatter when the body is finalized.
- Whether the supporting branch enumeration (D-02) renders as a table or a bullet list.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tier-1 normative source (the spec narrates this)
- `tests/negative-framing-scan.test.cjs` — THE behavioral source. Defines `SCAN_DIRS` (the four scan directories), the hard-violations vs soft-warnings buckets, every detection branch, the code-fence exclusion, and all exception predicates (`hasPositiveComplement`, `isReframePattern`, `isFactualNever`, `isAvoidDirective`, `isForbiddenDirective`, `isFactualDont`, `isConditionalOrFactual`). Every invariant and every Acceptance Tests row must trace to a subtest here.

### Spec-set conventions (LOCKED — inherited verbatim)
- `.planning/spec/00-CONVENTIONS.md` — the 7-section template, the `NN-INV-M` ID scheme (D-04 of Phase 68), status vocabulary (`Draft|Ready|Implemented|Verified`), and the source-of-truth hierarchy. The SPEC.md MUST conform exactly — no section drift (Phase 77 rejects drift).
- `.planning/spec/01-positive-framing/SPEC.md` — the stub being filled (frontmatter + empty section skeleton already present).
- `.planning/spec/INDEX.md` — feature-status manifest; SPEC-01 row + dependency graph this spec sits in.

### Milestone scope & requirements
- `.planning/REQUIREMENTS.md` — SPEC-01 (this feature's handle) and the shared QUAL-01–05 quality bars a spec must satisfy to reach `Ready`.
- `.planning/ROADMAP.md` §"Phase 69: spec-01 Positive Framing" (lines ~794–805) — the three success criteria; also §"Phase 77" for the cross-spec reconciliation this spec must survive.
- `.planning/phases/68-spec-scaffold/68-CONTEXT.md` — Phase 68 decisions (D-01 template, D-04 ID scheme) that bind this phase.

### Authoring standard (background, tier-4 — not normative)
- `CLAUDE.md` §"Positive framing replacement rule" — the fork's affirmative-framing standard (informs D-05). Background only; the test is authoritative for scanner behavior.
- `.planning/references/PROMPT_IMPROVEMENT_GUIDE_V01.md` and `PROMPT_ENGINEERING_GUIDE_V09.md` — the framing standard's origin. Tier-4 per conventions §4; known-stale, cite the test instead for any normative claim.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/negative-framing-scan.test.cjs` (62 KB) — fully populated and passing; it is both the evidence and the structure for the spec. The spec author reads it once and narrates: `SCAN_DIRS` array, the per-line violation loop (~line 234–365), the hard-violations vs warnings buckets, and the standalone `describe()` blocks unit-testing each exception predicate (~line 396–562).
- Phase 68's `00-CONVENTIONS.md` example invariant `01-INV-1` is literally a positive-framing invariant — it can be adopted/adapted as the detection invariant.

### Established Patterns
- The spec is a narration exercise, not a design exercise: source-of-truth hierarchy puts the test at tier-1, so disagreements between the test and any reference guide resolve in favor of the test.
- Advisory marking: every current path/symbol/regex name goes under `## Code Context` with `<!-- advisory -->`; no normative claim may rest on it (move-proofing for the upstream refactor).

### Integration Points
- This SPEC.md feeds Phase 77 (Cross-Spec Consistency Review), which reconciles the INDEX dependency graph, per-spec traceability tables, and exclusion list. The Acceptance Tests table must be mechanically checkable (keyed on `01-INV-M`, citing real subtests).
- Status transition `Draft → Ready` happens in this phase and is gated on QUAL-01–05.

</code_context>

<specifics>
## Specific Ideas

- Block bucket (hard failure): never, do not, avoid, don't, `<anti_patterns>` tag, must not, should not, prohibited, forbidden.
- Warn-only bucket: cannot, won't, will not (test decisions D-16–D-23).
- Exception predicate classes to spec normatively (regexes advisory): positive-complement pairing, factual-never, conditional-or-factual, reframe ("job is not to … it is to"), factual-dont, avoid-directive, forbidden-directive. Code fences (```` ``` ````) excluded from all scanning.
- Enumeration of branches carries the literal marker `current as of 2026-06-12`; the assertion *shape*, not the count, is normative.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (The affirmative-rewrite rule was considered as a MUST invariant and deliberately placed in Key Decisions instead — D-05 — because the scanner does not test rewriting; this is a placement decision, not a deferral.)

</deferred>

---

*Phase: 69-spec-01-positive-framing*
*Context gathered: 2026-06-12*
