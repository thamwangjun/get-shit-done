# Phase 76: spec-07 Citation Guard - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase writes the body of `.planning/spec/07-citation-guard/SPEC.md` — a behavioral-contract specification of the citation-cleanup guard `tests/no-issue-citations.test.cjs`. The guard is a single corpus scanner that (1) **detects** issue/PR-number citations in three forms — inline `#NNN`, parenthetical `(#NNN)`, and feat-form `feat-NNNN` (3+ digits); (2) applies a **two-tier allowlist** — `PLACEHOLDER_DIGITS` (a global Set of illustrative example digits, exempt corpus-wide) and `FILE_ALLOWLIST` (a per-file map of functional cross-reference digits, exempt only in the listed file and flagged everywhere else); (3) applies **exclusion state machines** for YAML frontmatter (D-09, frontmatter must start on line 1) and triple-backtick code fences (D-10); and (4) scans the **five** prompt-content directories `commands/`, `get-shit-done/workflows/`, `agents/`, `get-shit-done/references/`, `get-shit-done/templates/`.

The phase fills an existing stub (frontmatter + 7-section skeleton created in Phase 68). It does NOT modify the guard test, the corpus, or the FILE_ALLOWLIST contents — it specifies them. The 7-section template, the `NN-INV-M` invariant-ID scheme, the status vocabulary (`Draft|Ready|Implemented|Verified`), and the source-of-truth hierarchy are LOCKED by Phase 68's `00-CONVENTIONS.md` and inherited verbatim. The only open work is authoring the spec body — Purpose, Scope, Invariants, Acceptance Tests table, Key Decisions, Code Context — and advancing Status `Draft → Ready`.

This phase inherits the Phase 69/70/71/74 method wholesale: role-based invariant grouping, shape-normative-not-count, advisory-marking of current paths/symbols, every MUST tracing to a real subtest, and ROADMAP-mandated decisions recorded as "Settled — do not reopen." SPEC-07 depends on SPEC-08 (test-infrastructure); the `Depends on: SPEC-08` edge is preserved, not re-derived. The ROADMAP additionally pre-locks two constraints for this spec: the two allowlist tiers MUST be **distinguished as separate invariants** with distinct per-tier semantics, and the two-tier-allowlist refactor MUST be recorded as settled in Key Decisions.

</domain>

<decisions>
## Implementation Decisions

### Invariant Decomposition
- **D-01:** Group invariants by **behavioral role**, targeting **five** numbered invariants (`07-INV-1`..`07-INV-5`), each mapping to an identifiable subtest cluster:
  1. **Citation detection** — the scanner MUST flag issue/PR-number citations in three forms as a single shape-family: inline `#NNN`, parenthetical `(#NNN)` (paren-context disambiguation within the same `INLINE_RE` pass), and feat-form `feat-NNNN` (3+ digits, `FEAT_FORM_RE`). Tier-1: `no-issue-citations.test.cjs` `scanContent()` unit subtests (inline / github-style `owner/repo#NNN` / parenthetical / feat-form) + the `corpus scan — no issue citations` describe block (one subtest per corpus file).
  2. **PLACEHOLDER_DIGITS global tier** — a digit in `PLACEHOLDER_DIGITS` MUST be exempt everywhere in the corpus (see D-02).
  3. **FILE_ALLOWLIST per-file tier** — a `FILE_ALLOWLIST` digit MUST be exempt only in its listed file(s) and MUST remain a violation in every other file; includes the test-backing clause (see D-02, D-03).
  4. **Exclusion state machines** — content inside YAML frontmatter (D-09, frontmatter recognized only when it opens on line 1; a later `---` is a thematic break, not frontmatter) and inside triple-backtick code fences (D-10) MUST NOT be scanned. Tier-1: the `scanContent() — exclusion state machines` describe block (heading-marker, frontmatter-color, code-fence, non-line-1-`---`-thematic-break subtests).
  5. **Five-directory SCAN_DIRS scope** — the corpus scanned is the five-element `SCAN_DIRS` set (advisory enumeration, current as of 2026-06-12; the normative claim is the scope shape, not the literal list).
  - Rationale: keeps the Acceptance Tests traceability table legible and move-proof; mirrors sibling D-01. Detection is kept unified (rejected splitting inline/parenthetical/feat-form into separate invariants — inline and parenthetical differ only by paren-context within one regex pass and share one corpus oracle). Exclusion state machines are kept as their own invariant rather than folded into detection (they have a dedicated unit describe block, so a standalone invariant maps cleanly).
  - **Claude's discretion:** whether INV-5 (scope) collapses into the detection invariant if it reads cleanly; final EARS pattern per invariant.

### Two-Tier Allowlist Semantics — scope-of-exemption as the normative axis
- **D-02:** The two allowlist invariants (INV-2, INV-3) are distinguished by **scope of exemption**, per ROADMAP lock (two tiers as separate invariants, distinct per-tier semantics):
  - **INV-2 (PLACEHOLDER_DIGITS):** a member is exempt **everywhere** in the corpus — global, illustrative example digits with no real referent.
  - **INV-3 (FILE_ALLOWLIST):** a digit is exempt **only in its listed file(s)** and MUST remain flagged in every other corpus file — per-file functional cross-references to real tracked work.
  - The exemption-scope contrast (global vs per-file) is the normative distinction. The current member values (`PLACEHOLDER_DIGITS` = {1, 2, 123}; the four `FILE_ALLOWLIST` entries) are a dated advisory enumeration (`current as of 2026-06-12`) — the **rule** is normative, the **values** are advisory. Rejected purpose-as-axis (intent is the consequence, scope is the testable rule) and dual-axis invariants (multi-claim, weakens QUAL-01 falsifiability).

### FILE_ALLOWLIST Test Coupling — every entry must be test-backed
- **D-03:** INV-3 carries a normative clause: **every `FILE_ALLOWLIST` entry MUST be backed by a sibling test that requires the cited digit's continued presence** in that file. An entry without a backing test is indistinguishable from an un-cleaned citation and would become a silent permanent exemption. A Key Decision records the rationale (the allowlist exempts a citation only because another contract depends on it; remove the dependency and the citation must go). The four current backings are dated advisory in Code Context: `commands/gsd/config.md` #2439 ← `bug-2439-set-profile-gsd-sdk-preflight.test.cjs`; `get-shit-done/references/thinking-partner.md` #1729 ← `thinking-partner.test.cjs`; `agents/gsd-executor.md` #2924 ← `worktree-cleanup.test.cjs`, #3542 ← `bug-3542-executor-git-stash-prohibition.test.cjs`. All four backing tests confirmed present 2026-06-12.

### Hex-color / Deliberate-False-Positive Policy
- **D-04:** The D-11 tradeoff is captured as a **settled Key Decision PLUS an Out-of-scope Scope bullet** — not as an invariant (it is a deliberate non-behavior):
  - Key Decision: the guard **accepts hex-color false positives in plain prose by design**, because false negatives (a missed real citation like `owner/repo#NNN`) are worse than false positives (a flagged hex tail an author moves to a fence or allowlists). Hex colors are protected only inside frontmatter (D-09) and code fences (D-10); a hex tail in bare prose is accepted-as-flagged. The inline regex deliberately has no hex lookbehind (it was removed).
  - Out-of-scope bullet: makes the deliberate non-coverage visible at-a-glance so a reader does not read silence as a detection gap.
  - The protected-context guarantee (hex inside frontmatter/fence MUST NOT flag) is already covered by INV-4's exclusion state machines — not duplicated as a separate hex invariant.

### Two-tier-allowlist refactor recorded as settled (ROADMAP lock)
- **D-05:** Per ROADMAP SC3, the **two-tier-allowlist refactor** (splitting a single flat allowlist into a global `PLACEHOLDER_DIGITS` tier and a per-file `FILE_ALLOWLIST` tier) is recorded as a settled Key Decision with the consequence of reopening stated. The two tiers exist because the two exemption needs are different in kind (illustrative-everywhere vs functional-here-only); collapsing them back to one flat list either over-exempts functional digits corpus-wide (a real citation in the wrong file slips through) or forces per-file scoping onto illustrative placeholders (needless churn).

### Corpus counts / member values — shape normative, values dated
- **D-06:** Per `00-CONVENTIONS.md` §4 and sibling precedent, every concrete enumeration (the five `SCAN_DIRS`, the `PLACEHOLDER_DIGITS` members, the four `FILE_ALLOWLIST` entries and their backing tests) is recorded as a **dated "current as of 2026-06-12" advisory enumeration**; the normative claim is always the **shape** (three citation forms, two exemption scopes, two exclusion state machines, five-directory scope), never the literal values. Rejected values-as-normative (rots every corpus/allowlist edit).

### Claude's Discretion
- Exact EARS pattern per invariant (Ubiquitous vs Event-driven vs Unwanted-behavior), provided each is a single falsifiable claim mapping to a subtest.
- Exact subtest/assertion-shape strings in the Acceptance Tests table — planner/executor read `no-issue-citations.test.cjs` and cite the real `describe`/`test` names.
- Whether INV-5 (five-directory scope) stays standalone or folds into the detection invariant.
- Whether to abbreviate the `SCAN_DIRS` / allowlist enumerations to representative classes vs literal lists.
- Confidence value to stamp in frontmatter when the body is finalized.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tier-1 normative source (the spec narrates this)
- `tests/no-issue-citations.test.cjs` — THE guard behavioral source. `scanContent(content, relPath)` (three-form detection via `INLINE_RE` + `FEAT_FORM_RE`; paren-context disambiguation; `PLACEHOLDER_DIGITS` + `FILE_ALLOWLIST[relPath]` exemption; frontmatter + code-fence state machines) plus the `corpus scan — no issue citations` describe block. Defines `SCAN_DIRS`, `PLACEHOLDER_DIGITS`, `FILE_ALLOWLIST`, `INLINE_RE`, `FEAT_FORM_RE`. Every invariant and Acceptance Tests row traces here.

### Sibling backing tests (advisory — narrate into Code Context under D-03; no normative claim rests on them individually)
- `tests/bug-2439-set-profile-gsd-sdk-preflight.test.cjs` — backs `commands/gsd/config.md` #2439.
- `tests/thinking-partner.test.cjs` — backs `get-shit-done/references/thinking-partner.md` #1729.
- `tests/worktree-cleanup.test.cjs` — backs `agents/gsd-executor.md` #2924.
- `tests/bug-3542-executor-git-stash-prohibition.test.cjs` — backs `agents/gsd-executor.md` #3542.

### Spec-set conventions (LOCKED — inherited verbatim)
- `.planning/spec/00-CONVENTIONS.md` — the 7-section template, the `NN-INV-M` ID scheme, status vocabulary, source-of-truth hierarchy, and §4 "shape is normative, not the count." The SPEC.md MUST conform exactly — no section drift (Phase 77 rejects drift).
- `.planning/spec/07-citation-guard/SPEC.md` — the stub being filled (frontmatter + empty section skeleton already present; `Depends on: SPEC-08`; tier-1 evidence already names `tests/no-issue-citations.test.cjs`).
- `.planning/spec/INDEX.md` — feature-status manifest; the `SPEC-07` row (Draft, depends on SPEC-08), the `SPEC-08 → SPEC-07` dependency edge, and the Wave-2 mapping (Phase 76) this spec must stay consistent with.

### Milestone scope & requirements
- `.planning/REQUIREMENTS.md` — the SPEC-07 handle and the shared QUAL-01–05 quality bars a spec must satisfy to reach `Ready`.
- `.planning/ROADMAP.md` §"Phase 76: spec-07 Citation Guard" (lines ~898–909) — the three success criteria (three-form detection + two-tier allowlist with distinct per-tier semantics + 5-directory scope; two tiers as separate invariants + traceability; advisory paths + two-tier-allowlist refactor settled). Also §"Phase 77" for the cross-spec reconciliation this spec must survive, and the v2.1.0-g milestone history (Phases 64–67) that built the guard.
- `.planning/phases/68-spec-scaffold/68-CONTEXT.md` — Phase 68 decisions (template, ID scheme) that bind this phase.
- `.planning/phases/69-spec-01-positive-framing/69-CONTEXT.md`, `.planning/phases/70-spec-02-sha-versioning/70-CONTEXT.md`, `.planning/phases/71-spec-04-eta-materialization/71-CONTEXT.md`, `.planning/phases/74-spec-05-step-numbering/74-CONTEXT.md` — sibling specs; their D-01 (role-based grouping), shape-not-count, advisory-marking, and Key-Decision-vs-Invariant split patterns are inherited here. SPEC-05 (`.planning/spec/05-step-numbering/SPEC.md`) is the closest worked reference for a scanner-style spec.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/no-issue-citations.test.cjs` (~286 lines) — fully populated and GREEN; it is both the evidence and the structure for the spec. The author reads it once and narrates the `describe`/`test` names (`scanContent() — inline citation detection`, `scanContent() — exclusion state machines`, `corpus scan — no issue citations`), the two detection regexes, and the two allowlist constants.
- The sibling scanner spec `.planning/spec/05-step-numbering/SPEC.md` is a directly-applicable worked reference for section shape, advisory-marking, the invariant+Key-Decision split, and the rule-normative-list-advisory pattern (maps onto D-02's two-tier framing, D-04's hex-policy framing, and D-06's enumeration-is-advisory rule).

### Established Patterns
- The spec is a narration exercise, not a design exercise: the source-of-truth hierarchy puts the test at tier-1, so any disagreement between the test and a reference doc resolves in favor of the test.
- Advisory marking: every current path/symbol/constant/regex (the `scanContent` helper, `SCAN_DIRS`, `PLACEHOLDER_DIGITS`, `FILE_ALLOWLIST` entries, `INLINE_RE`/`FEAT_FORM_RE`, the four backing tests) goes under `## Code Context` with `<!-- advisory -->`; no normative claim rests on it (move-proofing for the upstream refactor).
- Single test artifact, no normalizer/CLI counterpart (unlike SPEC-05): the guard is detection-only. There is no remediation tool to spec — Phase 66 did the one-time cleanup manually. This keeps the Acceptance Tests table simpler than SPEC-05's (no scanner-GREEN-as-oracle indirection needed; every invariant has a direct subtest).

### Integration Points
- SPEC-07 is a **dependent node** in the INDEX dependency graph (`Depends on: SPEC-08`) — the edge already exists; this phase preserves it, adds none.
- This SPEC.md feeds Phase 77 (Cross-Spec Consistency Review). The Acceptance Tests table must be mechanically checkable (keyed on `07-INV-M`, citing real subtests) with no unflagged `[MISSING]` rows.
- Status transition `Draft → Ready` happens in this phase, gated on QUAL-01–05.
- The FILE_ALLOWLIST → sibling-test coupling (D-03) is a cross-test integration the spec must surface: the guard's allowlist correctness depends on four OTHER tests continuing to require their cited digits.

</code_context>

<specifics>
## Specific Ideas

- Detection covers three citation forms the spec must enumerate: inline `#NNN`, parenthetical `(#NNN)` (same regex pass, paren-context decides the category), and feat-form `feat-NNNN` (3+ digits). The github-style `owner/repo#NNN` case is a deliberate positive — it IS detected (the trailing `#NNN` matches), per a dedicated unit subtest.
- The two-tier allowlist is the phase's headline non-obvious surface: `PLACEHOLDER_DIGITS` exempts globally; `FILE_ALLOWLIST` exempts per-file and re-flags the same digit elsewhere. INV-2/INV-3 must make the scope contrast unmistakable.
- Frontmatter exclusion has a precise rule: frontmatter is recognized ONLY when the opening `---` is on line 1; a `---` on any later line is a thematic break and content after it IS scanned (dedicated subtest: `non-line-1 --- is not frontmatter`).
- Hex-color handling is a deliberate false-positive tradeoff (D-11): the inline regex's hex lookbehind was removed on purpose; hex in bare prose is accepted-as-flagged because false negatives are worse. Protected only inside frontmatter/fences.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. The hex-policy placement (D-04), the FILE_ALLOWLIST test-backing clause (D-03), and the two-tier-refactor Key Decision (D-05) are placement/framing decisions within the spec, not deferrals. No INDEX dependency edges or scope additions were proposed; no remediation/normalizer tool exists to spec for this guard (detection-only, by design).

</deferred>

---

*Phase: 76-spec-07-citation-guard*
*Context gathered: 2026-06-12*
