# Phase 75: spec-06 Thinking Effort - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase writes the body of `.planning/spec/06-thinking-effort/SPEC.md` — a behavioral-contract specification of the fork's per-agent thinking-effort feature, the **most complex spec surface** in the v2.1.0-h milestone. The feature spans, as one connected behavior: (1) the `parseModelEffort` **semicolon parser** (`model;effort` → `{model, effort}`, with an `EFFORT_TOKENS` allowlist `{low, medium, high, xhigh, max}` and D2 typo-handling that strips an unrecognized `;`-suffix and warns once); (2) the **unified resolver** `resolveReasoningEffortInternal` with its full precedence chain (outermost runtime-allowlist gate → per-agent override → phase-type slot → user `reasoning_effort` override → catalog slot effort → runtime-tier fallback) including the **haiku-omits-effort** carve-out; (3) the **D-08 medium floor** (bare `{claude, codex}` slots floor to `medium`); (4) the **static runtime allowlist** `RUNTIMES_WITH_REASONING_EFFORT = {claude, codex}` as an absolute outer gate that overrides cannot bypass; (5) the **per-runtime omit/translate contract** (13 non-effort runtimes resolve to `null`; `translateEffortForCodex` maps `max → xhigh` and passes `low|medium|high` through); (6) the **catalog schema** carrying `reasoning_effort`; (7) the **20 `*_effort` init siblings** in `init.cjs` that expose resolved effort to workflows; (8) **spawn-template wiring**; and (9) the **install.js Codex emit seam** that ties the emitted `reasoning_effort` line to the same source as the model line (WR-03, no silent divergence).

The phase fills an existing stub (frontmatter + 7-section skeleton created in Phase 68). It does NOT modify the parser, resolver, catalog, init siblings, wiring, regression tests, or the golden snapshot — it **specifies** them. The 7-section template, the `NN-INV-M` invariant-ID scheme, the status vocabulary (`Draft|Ready|Implemented|Verified`), and the source-of-truth hierarchy are LOCKED by Phase 68's `00-CONVENTIONS.md` and inherited verbatim. The only open work is authoring the spec body — Purpose, Scope, Invariants, Acceptance Tests table, Key Decisions, Code Context — and advancing Status `Draft → Ready`.

This phase inherits the Phase 69/70/71/74/76 method wholesale: role-based invariant grouping, shape-normative-not-count, advisory-marking of current paths/symbols, every MUST tracing to a real subtest, and ROADMAP-mandated decisions recorded as "Settled — do not reopen." SPEC-06 depends on SPEC-08 (test-infrastructure); the `Depends on: SPEC-08` edge is preserved, not re-derived. The ROADMAP pre-locks two correctness linchpins the spec MUST elevate: the **D-08 medium floor stated as a MUST-level invariant** (not optional, with the consequence of omission), and the **Codex emit fix** named as the correctness linchpin.

</domain>

<decisions>
## Implementation Decisions

### Invariant Decomposition — role-based, 6–8 invariants
- **D-01:** Group invariants by **behavioral role**, targeting **six to eight** numbered invariants (`06-INV-1`..`06-INV-N`), each mapping to an identifiable subtest cluster. The complex surface justifies more invariants than the 5-invariant siblings — compressing it would force multi-claim invariants that weaken QUAL-01 falsifiability. The role axis (current intent; final count is Claude's discretion within falsifiability):
  1. **`parseModelEffort` semicolon contract** — `model;effort` splits on `;`; an effort token in `EFFORT_TOKENS` populates `effort`; a non-token `;`-suffix is a typo (stripped from `model`, `effort` null, warn-once); a bare label yields `{model: label, effort: null}`. Tier-1: `parse-model-effort.test.cjs` + `parse-model-effort-parity.test.cjs` + `tests/fixtures/parse-model-effort.json`.
  2. **Resolver precedence chain** — the ordered precedence in `resolveReasoningEffortInternal` (allowlist gate → per-agent override → phase-type slot effort → user `reasoning_effort` override → catalog slot effort → runtime-tier fallback), including the **haiku-omits-effort** carve-out that precedes steps 3/4/5. Tier-1: `feat-53-unified-effort-resolver.test.cjs`.
  3. **D-08 medium floor (MUST)** — bare `{claude, codex}` slots floor to `medium`; `inherit`/unknown slots and non-effort runtimes still return `null`; haiku is exempt. Stated as a MUST-level invariant per ROADMAP SC2 (see D-03).
  4. **Static runtime allowlist gate** — `RUNTIMES_WITH_REASONING_EFFORT = {claude, codex}` is the absolute outermost gate; a non-`{claude,codex}` install with a `;effort` override still returns `null` — overrides cannot bypass it.
  5. **Per-runtime omit/translate contract** — the 13 non-effort runtimes resolve to `null` (the `omitContract` rows); `translateEffortForCodex` maps `max → xhigh` and passes `low|medium|high` through, `null|undefined → null`. Tier-1: `feat-58-regression.test.cjs` TEST-03.
  6. **Catalog schema + 20 init siblings** — the catalog carries `reasoning_effort`; the 20 `*_effort` siblings in `init.cjs` expose resolved effort to workflows via `resolveReasoningEffortInternal(cwd, agentType)`.
  7. **Spawn-template + Codex emit wiring** — resolved effort reaches `Agent()` spawns; the install.js Codex emit seam ties the effort line to the same source as the model line (see D-02).
  - Rationale: keeps the Acceptance Tests traceability table legible and move-proof; mirrors sibling D-01. INV-3/INV-4 are kept separate from INV-2 (the floor and the gate are distinct MUST claims with distinct failure consequences and distinct subtests).
  - **Claude's discretion:** final invariant count (6, 7, or 8); whether INV-6 splits catalog-schema from init-siblings; whether INV-7 splits spawn-wiring from Codex-emit; exact EARS pattern per invariant.

### D-08 Medium Floor — MUST-level, omission consequence stated (ROADMAP lock)
- **D-03:** Per ROADMAP SC2, the **D-08 medium floor is a MUST-level invariant**, not an optional/SHOULD behavior. The consequence of omission is stated explicitly: without the floor, bare `{claude, codex}` slots emit no effort, silently dropping every agent to the provider default and erasing the per-agent effort dimension the milestone exists to add. The floor's carve-outs (haiku exempt; `inherit`/unknown → null; non-effort runtimes → null) are part of the same invariant, not separate.

### Codex Emit Fix — correctness linchpin as Key Decision; researcher pins the symbol
- **D-04:** The ROADMAP names a "`rawSlotForRuntime` Codex fix" as the correctness linchpin, but **no literal `rawSlotForRuntime` symbol exists in the source** — "rawSlotForRuntime" is a ROADMAP paraphrase. The real Codex emit seam lives in `bin/install.js` (the `translateEffortForCodex` boundary `max → xhigh`, and the WR-03 tie ensuring the emitted `reasoning_effort` line shares the model line's source so model and effort emit paths do not silently diverge). Decision:
  - Capture the linchpin as a **settled Key Decision**: the Codex emit MUST tie effort to the same resolution source as model (WR-03, no silent divergence); `max` translates to the Codex-specific `xhigh` tier.
  - The **researcher MUST locate the exact symbol/seam in `install.js`** and cite it advisory in Code Context. The translate/omit boundary itself is also carried by INV-5 (testable via `feat-58-regression.test.cjs` TEST-03); the Key Decision carries the *design rationale and linchpin status*, the invariant carries the *testable behavior*.

### Tier-1 Oracle — golden regression test tier-1, init.cjs tier-2 (ROADMAP SC3)
- **D-05:** The **330-row golden snapshot** (`tests/fixtures/golden-effort-snapshot.json`, exercised by `feat-58-regression.test.cjs` TEST-01) is the **tier-1 behavioral oracle**; `init.cjs`'s `resolveReasoningEffortInternal` is the **tier-2 implementation** the test pins. Per ROADMAP SC3, the spec **describes the snapshot's structure**, not just its existence: it is an agent × profile × runtime matrix of `{agent, profile, runtime, expectedModel, expectedEffort}` rows (post-D-08 values), plus a separate `omitContract` array asserting `expectedEffort: null` for each of the **13 non-effort runtimes**. Both the golden regression test and `init.cjs` are cited as tier-1/tier-2 sources per SC3.
  - **Claude's discretion:** precise per-invariant tier-1/tier-2 assignment (some invariants — parser, translate boundary — have their own dedicated unit oracles and need not route through the golden snapshot).

### Scope Boundary — CATALOG-02 user-handover out of scope (ROADMAP)
- **D-06:** The spec governs the resolver/parser/catalog-schema/init-siblings/wiring/Codex-emit behavior. The **CATALOG-02 user-handover boundary** (how users author `model;effort` labels in their own catalog / the handover UX) is explicitly placed **out of scope** as an adjacent concern, per ROADMAP. Inherits the sibling line: narrate the feature's behavior, not the authoring UX.

### Enumerations — shape normative, values dated advisory
- **D-07:** Per `00-CONVENTIONS.md` §4 and sibling precedent, every concrete enumeration (the `EFFORT_TOKENS` set, the `{claude, codex}` allowlist, the 13 non-effort runtimes in `omitContract`, the 20 `*_effort` init siblings, the 330 snapshot rows, the precedence-step numbers) is recorded as a **dated "current as of 2026-06-12" advisory enumeration**; the normative claim is always the **shape** (a fixed effort-token allowlist, a two-runtime effort gate, a per-runtime omit contract, a complete-coverage init-sibling set, a full agent×profile×runtime matrix), never the literal values. Rejected values-as-normative (rots on every catalog/runtime/agent edit).

### Claude's Discretion
- Final invariant count (6–8) and exact role boundaries within the locked role-based axis.
- Exact EARS pattern per invariant (Ubiquitous vs Event-driven vs Unwanted-behavior), provided each is a single falsifiable claim mapping to a subtest.
- Exact subtest/assertion-shape strings in the Acceptance Tests table — read the real `describe`/`test` names from the tier-1 test files.
- Whether to abbreviate the 20-sibling / 13-runtime / 330-row enumerations to representative classes vs literal lists in Code Context.
- Confidence value to stamp in frontmatter when the body is finalized.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tier-1 normative source (the spec narrates this)
- `tests/feat-58-regression.test.cjs` — THE behavioral oracle. TEST-01 (static golden snapshot, post-D-08 resolver values), TEST-03 (`translateEffortForCodex` boundary `max → xhigh` + per-runtime omit contract, 13 non-effort runtimes → null), TEST-04 (antipattern guard). The stub's `Reimplementation evidence (tier-1 test)` already names this file.
- `tests/fixtures/golden-effort-snapshot.json` — the 330-row golden snapshot. Structure: `{generated, description, rows[], omitContract[]}`; each `rows` entry is `{agent, profile, runtime, expectedModel, expectedEffort}`; `omitContract` asserts `expectedEffort: null` for the 13 non-effort runtimes. The spec describes this structure (SC3).

### Tier-2 implementation sources (advisory — narrate into Code Context; pinned by tier-1 tests)
- `get-shit-done/bin/lib/core.cjs` — `parseModelEffort` (~line 1242, with `EFFORT_TOKENS` ~line 1221 and the warn-once typo path) and `resolveReasoningEffortInternal` (~line 1628, the full precedence chain + haiku carve-out + D-08 floor; the JSDoc above it enumerates steps 0–5 and the D-08 amendment).
- `get-shit-done/bin/lib/init.cjs` — the 20 `*_effort` siblings calling `resolveReasoningEffortInternal(cwd, agentType)` across workflow init blocks (tier-2 per SC3).
- `get-shit-done/bin/lib/model-catalog.cjs` — `RUNTIMES_WITH_REASONING_EFFORT = {claude, codex}` (~line 97), `KNOWN_RUNTIMES`, `RUNTIME_PROFILE_MAP`, the catalog `reasoning_effort` schema.
- `bin/install.js` — the Codex emit seam (~lines 1445–1530, 2667–2761): `translateEffortForCodex`, `resolveEffort`, the WR-01/WR-03 model/effort emit tie. **Researcher MUST pin the exact symbol the ROADMAP calls `rawSlotForRuntime`** (D-04) and cite it advisory.

### Sibling tier-1 unit oracles (advisory — per-invariant, no normative claim rests on them individually)
- `tests/parse-model-effort.test.cjs`, `tests/parse-model-effort-parity.test.cjs`, `tests/fixtures/parse-model-effort.json` — parser contract (INV-1).
- `tests/feat-53-unified-effort-resolver.test.cjs`, `tests/feat-53-config-sites-and-golden.test.cjs` — resolver precedence + D-08 cross-resolver golden (INV-2/INV-3).
- `tests/phase-56-effort-wiring.test.cjs` — spawn-template/init wiring (INV-6/INV-7).
- `tests/feat-57-install-translation.test.cjs` — install-time translation (INV-5/INV-7).
- `tests/bare-effort-arg-scan.test.cjs` — bare-effort-arg guard.

### Spec-set conventions (LOCKED — inherited verbatim)
- `.planning/spec/00-CONVENTIONS.md` — the 7-section template, the `NN-INV-M` ID scheme, status vocabulary, source-of-truth hierarchy, and §4 "shape is normative, not the count." The SPEC.md MUST conform exactly — no section drift (Phase 77 rejects drift).
- `.planning/spec/06-thinking-effort/SPEC.md` — the stub being filled (frontmatter + empty section skeleton; `Depends on: SPEC-08`; tier-1 evidence already names `tests/feat-58-regression.test.cjs`).
- `.planning/spec/INDEX.md` — feature-status manifest; the `SPEC-06` row (Draft, depends on SPEC-08), the `SPEC-08 → SPEC-06` dependency edge, and the Wave-2 mapping (Phase 75) this spec must stay consistent with.

### Milestone scope & requirements
- `.planning/REQUIREMENTS.md` — the SPEC-06 handle and the shared QUAL-01–05 quality bars a spec must satisfy to reach `Ready`.
- `.planning/ROADMAP.md` §"Phase 75: spec-06 Thinking Effort" — the three success criteria (full surface enumeration; D-08 floor as MUST + Codex fix as linchpin; golden-snapshot + init.cjs as tier-1/tier-2, snapshot structure described, traceability complete, paths advisory, Key Decisions settled). Also §"Phase 77" for the cross-spec reconciliation this spec must survive, and the v2.1.0-e milestone history (Phases 52–58, `.planning/milestones/v2.1.0-e-ROADMAP.md`) that built the feature and originated the D-01..D-08 / WR-xx / RESOLVE-xx / CONFIG-xx decision IDs.
- `.planning/phases/68-spec-scaffold/68-CONTEXT.md` — Phase 68 decisions (template, ID scheme) that bind this phase.
- `.planning/phases/69-spec-01-positive-framing/69-CONTEXT.md`, `.planning/phases/70-spec-02-sha-versioning/70-CONTEXT.md`, `.planning/phases/71-spec-04-eta-materialization/71-CONTEXT.md`, `.planning/phases/74-spec-05-step-numbering/74-CONTEXT.md`, `.planning/phases/76-spec-07-citation-guard/76-CONTEXT.md` — sibling specs; their D-01 (role-based grouping), shape-not-count, advisory-marking, and Key-Decision-vs-Invariant split patterns are inherited here.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/feat-58-regression.test.cjs` + `tests/fixtures/golden-effort-snapshot.json` — fully populated and GREEN; together they are both the evidence and the structure for the spec. The author reads them once and narrates TEST-01/TEST-03/TEST-04 and the snapshot's `rows`/`omitContract` shape.
- The JSDoc above `resolveReasoningEffortInternal` (core.cjs ~line 1610) already enumerates the precedence steps 0–5, the D-08 amendment, and the haiku carve-out in prose — it is a ready-made narration source for INV-2/INV-3 (advisory; the test is tier-1).
- The sibling scanner specs (`.planning/spec/05-step-numbering/SPEC.md`, `.planning/spec/07-citation-guard/SPEC.md`) are worked references for section shape, advisory-marking, the invariant+Key-Decision split, and the rule-normative/list-advisory pattern — though SPEC-06 is a resolver/parser spec, not a scanner spec, so the Acceptance Tests table has more invariants and multiple tier-1 oracles.

### Established Patterns
- The spec is a narration exercise, not a design exercise: the source-of-truth hierarchy puts the tests at tier-1, so any disagreement between a test and an implementation file resolves in favor of the test; init.cjs/core.cjs/install.js are tier-2 (pinned, not authoritative).
- Advisory marking: every current path/symbol/constant (`parseModelEffort`, `EFFORT_TOKENS`, `resolveReasoningEffortInternal`, `RUNTIMES_WITH_REASONING_EFFORT`, `translateEffortForCodex`, the 20 init siblings, the install.js emit seam) goes under `## Code Context` with advisory marking; no normative claim rests on it (move-proofing for the upstream refactor).
- Multiple tier-1 oracles (unlike single-test sibling specs): the parser, resolver, translate boundary, and wiring each have dedicated unit tests in addition to the golden snapshot. The Acceptance Tests table routes each invariant to its closest oracle rather than forcing everything through the 330-row snapshot.

### Integration Points
- SPEC-06 is a **dependent node** in the INDEX dependency graph (`Depends on: SPEC-08`) — the edge already exists; this phase preserves it, adds none.
- This SPEC.md feeds Phase 77 (Cross-Spec Consistency Review). The Acceptance Tests table must be mechanically checkable (keyed on `06-INV-M`, citing real subtests) with no unflagged `[MISSING]` rows.
- Status transition `Draft → Ready` happens in this phase, gated on QUAL-01–05.
- The Codex emit seam (D-04) is a cross-layer integration: resolution happens in core.cjs/init.cjs (tier-2) but the runtime-specific emit happens in install.js — the spec must surface that the effort value crosses from resolver to install-time translation without the model/effort sources diverging (WR-03).

</code_context>

<specifics>
## Specific Ideas

- The headline non-obvious surfaces the spec must make unmistakable: (a) the **D-08 medium floor** is a deliberate milestone amendment (2026-06-04), not a default — bare `{claude,codex}` slots floor to medium while `inherit`/non-effort runtimes stay null; (b) the **allowlist gate is outermost and absolute** — a `;effort` override on a non-effort runtime still returns null; (c) **haiku omits effort on every runtime**, and this carve-out precedes the floor and the runtime-tier fallback (Pitfall 1 in the JSDoc); (d) `max` is a GSD/Codex tier that **translates to `xhigh`** at the Codex emit seam and is returned verbatim (no resolver clamp) before that point.
- The ROADMAP-named "`rawSlotForRuntime` Codex fix" is a paraphrase with no literal symbol — the researcher resolves it to the actual install.js seam (`translateEffortForCodex` + WR-03 tie). This is the single most important pin for D-04.
- The 330-row golden snapshot's `omitContract` is the cleanest evidence for the per-runtime omit invariant (13 explicit runtime→null rows); the spec describes it as structure, not just cites it.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. The Codex-linchpin placement (D-04 invariant-plus-Key-Decision split), the tier-1/tier-2 oracle assignment (D-05), and the CATALOG-02 out-of-scope boundary (D-06) are framing decisions within the spec, not deferrals. No INDEX dependency edges or scope additions were proposed; no behavior change to the parser/resolver/catalog/wiring is in scope (this phase specifies the shipped feature, does not alter it).

</deferred>

---

*Phase: 75-spec-06-thinking-effort*
*Context gathered: 2026-06-12*
