# SPEC-06: Per-Agent Thinking Effort

**ID:** 06
**Requirement:** SPEC-06
**Status:** Ready
**Confidence:** High
**Specced:** 2026-06-12
**Reimplementation target:** v2.1.0-h fork features on refactored upstream
**Depends on:** SPEC-08
**Reimplementation evidence (tier-1 test):** tests/feat-58-regression.test.cjs

---

## Purpose

The per-agent thinking-effort feature gives every spawned GSD agent a runtime-appropriate reasoning-effort level resolved from a single, shared source so that the model label and the effort token always track together and can never silently diverge. The connected surface is a chain of nine coordinated behaviors: the `parseModelEffort` semicolon parser turns a `model;effort` label into a structured `{model, effort}` pair using a fixed effort-token allowlist (`EFFORT_TOKENS`) and a warn-once typo path; the unified `resolveReasoningEffortInternal` precedence chain applies an ordered set of resolution steps (outermost runtime-allowlist gate, per-agent override, haiku carve-out, phase-type slot effort, user `reasoning_effort` override, catalog slot effort, and runtime-tier fallback) with the D-08 medium floor ensuring bare `{claude,codex}` slots are never effort-less; the static `RUNTIMES_WITH_REASONING_EFFORT` allowlist containing only `{claude,codex}` is the absolute outermost gate that no per-agent override can bypass; the per-runtime omit/translate contract maps every non-effort runtime to `null` and, at the Codex emit boundary, translates the GSD `max` tier to the Codex-specific `xhigh` tier via `translateEffortForCodex`; the catalog carries a `reasoning_effort` field per effort-supporting runtime/tier entry; the `*_effort` init siblings in `init.cjs` expose resolved effort to workflows; spawn-template wiring threads resolved effort into `Agent()` invocations; and the install.js Codex emit seam ties the emitted `model_reasoning_effort` TOML line to the same resolution source as the model line (WR-03 guard), so the two are always paired and can never resolve from different slots. Three failure modes reveal why each piece of this surface must be correct: without the D-08 floor, bare `{claude,codex}` slots emit no effort and silently drop every such agent to the provider default, erasing the per-agent effort dimension the milestone exists to add; without the allowlist gate, effort leaks to runtimes that cannot consume it; and without the WR-03 emit tie, the Codex `model_reasoning_effort` TOML line can resolve from a different source than the model line and the two drift, producing an incoherent TOML pair. The behavioral authority for this entire surface is `tests/feat-58-regression.test.cjs` (source-of-truth tier 1 per `00-CONVENTIONS.md` §4); `init.cjs`'s `resolveReasoningEffortInternal` is the tier-2 implementation it pins. This phase specifies a fully shipped, GREEN feature — it introduces no behavior change.

## Scope

**In scope:**

- **`parseModelEffort` semicolon parser** — converts a `model;effort` label to `{model, effort}` by splitting on the last `;` (`lastIndexOf`); populates `effort` only when the suffix is a member of the effort-token allowlist; strips an unrecognized `;`-suffix to recover a bare model with `effort` null and emits a warn-once warning per distinct label (WR-02 warn path); returns `{model: label, effort: null}` for a bare label with no `;`; and treats a colon as never being a delimiter. The `EFFORT_TOKENS` allowlist members (advisory enumeration, current as of 2026-06-12: `{low, medium, high, xhigh, max}`) and `parseModelEffort` itself are advisory; the normative claim is the parser's behavioral shape.
- **Unified `resolveReasoningEffortInternal` precedence chain** — an ordered sequence of resolution steps: (0) the outermost static runtime-allowlist gate; (1) per-agent override via `parseModelEffort(.effort)` applied to `model_overrides[agentType]`; (2) shared-slot resolution via `_resolveAgentSlotFromConfig` (an `inherit` or unknown slot returns `null`); (3) haiku bareTier check (an unconditional `return null` that precedes steps 3a/4/5 and the D-08 floor); (3a) phase-type slot effort; (4) user-supplied `reasoning_effort` via `model_profile_overrides`; (5) catalog slot effort; runtime-tier entry fallback; then the D-08 floor for remaining bare `{claude,codex}` slots. The resolver returns `max` verbatim — no clamp. Step numbering is advisory (current as of 2026-06-12); the normative claim is the ordered-precedence shape.
- **D-08 medium floor** — bare `{claude,codex}` slots that resolve no effort through steps 1–5 floor to `medium`. Carve-outs: haiku is always exempt (haiku bareTier check precedes the floor); `inherit`/unknown slots and non-effort runtimes always return `null`. The consequence of omitting the floor is stated as a MUST-level invariant (06-INV-3).
- **Static `RUNTIMES_WITH_REASONING_EFFORT` allowlist as the absolute outermost gate** — a static literal set containing only `{claude,codex}` (advisory, current as of 2026-06-12). Any runtime not in this set resolves to `null` regardless of any per-agent `;effort` override. The normative claim is the gate's outermost-and-absolute shape; the two-runtime membership is advisory.
- **Per-runtime omit/translate contract** — non-effort runtimes (13 entries in the `omitContract` array, advisory, current as of 2026-06-12: gemini, qwen, opencode, copilot, hermes, kilo, cline, cursor, windsurf, augment, trae, codebuddy, antigravity) resolve to `null`; `translateEffortForCodex` maps `max` to `xhigh`, passes `low|medium|high` through unchanged, and maps `null|undefined` to `null`. The 13-runtime count is advisory; the normative claim is the omit-contract shape (a complete set of non-effort runtimes) and the translate-boundary shape.
- **Catalog `reasoning_effort` schema** — the agent catalog carries a `reasoning_effort` field per tier entry for each effort-supporting runtime (advisory, current as of 2026-06-12).
- **`*_effort` init siblings** — `init.cjs` exposes resolved effort to workflows via a complete set of sibling keys (advisory key names, current as of 2026-06-12: `executor_effort`, `verifier_effort`, `researcher_effort`, `planner_effort`, `checker_effort`, `synthesizer_effort`, `roadmapper_effort`, `mapper_effort`, across approximately 21 call sites). The normative claim is complete-coverage shape, not the exact count or key names.
- **Spawn-template wiring** — resolved effort reaches `Agent()` spawns so that every spawned agent receives the effort token appropriate for its role and runtime.
- **Install.js Codex emit seam** — `readGsdRuntimeProfileResolver` returns `resolveEffort(agentName)`; the WR-03 guard ties the emitted `model_reasoning_effort` TOML line to the same resolution source as the model line so that model and effort emit paths are always paired and never diverge silently. The `max` → `xhigh` translation is applied at this boundary via `gsdTranslateEffortForCodex`.

**Out of scope:**

- **CATALOG-02 user-handover boundary** — how users author `model;effort` labels in their own catalog or the handover UX is an adjacent concern placed out of scope per ROADMAP and D-06; this spec narrates the feature's behavior, not the authoring UX.
- **Behavior change** — this phase specifies the shipped, GREEN feature; it does not alter the parser, resolver, catalog, wiring, or any test.
- **TEST-04 antipattern guard as a feature behavior** — TEST-04 in `tests/feat-58-regression.test.cjs` guards test-code correctness (no `indexOf`-as-boolean on effort tokens, no bare `includes('medium'|'high')` in `assert.ok`), not feature behavior; it is advisory supporting evidence for the emit/wiring surface and is not a standalone feature invariant.

## Invariants

**06-INV-1** — When `resolveReasoningEffortInternal` parses a `model;effort` label via `parseModelEffort`, the system MUST split the label on the last `;` character, populate `effort` only when the resulting suffix is a member of the effort-token allowlist, strip an unrecognized `;`-suffix and return `effort: null` with a single per-label warning (warn-once), return `{model: label, effort: null}` for a label containing no `;`, and MUST NOT treat a colon as a delimiter at any point. The `EFFORT_TOKENS` allowlist members and the `parseModelEffort` function are advisory supporting detail, current as of 2026-06-12.

Consequence of violating this invariant: a `model;effort` override resolves the wrong effort token or fails to parse entirely, silently corrupting every agent that carries a `;effort` suffix in its catalog slot or per-agent override; a label that uses a colon delimiter (e.g., `openrouter:anthropic/claude`) would be incorrectly split, breaking model resolution for non-semicolon-based labels.

---

**06-INV-2** — When `resolveReasoningEffortInternal` resolves effort for a given agent and config, the system MUST apply steps in the fixed ordered precedence: outermost allowlist gate first, then per-agent override, then haiku carve-out (which is unconditional and precedes steps 3a/4/5 and the D-08 floor), then phase-type slot effort, then user `reasoning_effort` override, then catalog slot effort, then runtime-tier fallback; and the system MUST return any resolved `max` value verbatim without clamping or translating it to `xhigh` (the `max` → `xhigh` translation is an emit-boundary concern covered by 06-INV-5 and 06-INV-7, not a resolver concern). The step numbering and the `resolveReasoningEffortInternal` symbol are advisory, current as of 2026-06-12.

Consequence of violating this invariant: a lower-priority source (e.g., catalog slot) overrides a higher-priority source (e.g., per-agent override), causing the wrong effort level to reach spawned agents; clamping `max` in the resolver loses the GSD/Codex `max` tier before the emit seam can translate it correctly.

---

**06-INV-3** — When `resolveReasoningEffortInternal` has evaluated all precedence steps for an agent on a `{claude,codex}` runtime and has not resolved any effort value, the system MUST floor the result to `medium`. The following carve-outs apply within this same invariant: a `haiku` bareTier slot MUST resolve to `null` (the haiku carve-out fires unconditionally before the floor); an `inherit` or unknown slot MUST resolve to `null`; and a non-effort runtime MUST resolve to `null`. Without the floor, bare `{claude,codex}` slots emit no effort and silently drop every such agent to the provider default, erasing the per-agent effort dimension the milestone exists to add.

Consequence of violating this invariant: every agent assigned to a bare `{claude,codex}` slot (an agent whose catalog entry has no `reasoning_effort` value and whose config has no per-agent override) silently receives no effort token, the provider applies its default, and the milestone's per-agent effort differentiation is entirely lost.

---

**06-INV-4** — The system MUST treat the static `RUNTIMES_WITH_REASONING_EFFORT` set as the absolute outermost gate; if the active install runtime is not a member of this set, the system MUST resolve effort to `null` for every agent regardless of any per-agent `;effort` override or any `reasoning_effort` value in the catalog. Per-agent overrides, catalog entries, and user config MUST NOT bypass this gate. The `RUNTIMES_WITH_REASONING_EFFORT` symbol and its current two-member value are advisory, current as of 2026-06-12; the normative claim is that the gate is static, outermost, and absolute.

Consequence of violating this invariant: a non-`{claude,codex}` runtime that gains a `reasoning_effort` field in its catalog entry or that is configured with a `;effort` suffix will silently receive an effort value it cannot consume, producing malformed agent invocations or TOML output.

---

**06-INV-5** — The system MUST resolve every non-effort runtime to `null` (the omit contract), and at the Codex emit boundary the system MUST translate a resolved `max` value to `xhigh`, pass `low`, `medium`, and `high` through unchanged, and map `null` or `undefined` to `null`. The 13-runtime omit-contract set and the `translateEffortForCodex` symbol are advisory, current as of 2026-06-12; the normative claim is the omit-contract shape and the translate-boundary shape.

Consequence of violating this invariant: a non-effort runtime emits an effort value it cannot consume; a Codex install where the resolver returned `max` emits the Claude-form `max` directly into the TOML, which Codex does not recognize as a valid effort tier.

---

**06-INV-6** — The catalog MUST carry a `reasoning_effort` field per tier entry for each effort-supporting runtime, and `init.cjs` MUST expose a complete set of resolved-effort siblings (the `*_effort` keys) by calling `resolveReasoningEffortInternal(cwd, agentType)` at each agent init site so that every workflow that spawns an effort-aware agent receives the resolved effort token. The catalog schema and the init-sibling key names are advisory, current as of 2026-06-12; the normative claim is complete-coverage shape (every effort-supporting runtime/tier entry has a `reasoning_effort` field; every agent init site has a corresponding `*_effort` sibling).

Consequence of violating this invariant: a workflow that uses an agent without a corresponding `*_effort` sibling invocation silently provides no effort context to spawned agents; a catalog entry missing `reasoning_effort` causes the resolver's step-5 fallback to return no value, leaving bare slots without their catalog-assigned effort.

---

**06-INV-7** — Resolved effort MUST reach `Agent()` spawns via the spawn-template wiring, and the install.js Codex emit seam MUST gate the `model_reasoning_effort` TOML line on the model line having been emitted (the WR-03 `modelEmitted` guard), ensuring the emitted effort line is always derived from the same resolution source as the emitted model line and the two TOML lines are always paired and can never diverge. The `readGsdRuntimeProfileResolver`, `resolveEffort`, and `modelEmitted` symbols, and the install.js line ranges, are advisory, current as of 2026-06-12.

Consequence of violating this invariant: a Codex install emits a `model_reasoning_effort =` TOML line without a corresponding `model =` line (or vice versa), or the two lines resolve from different slots and produce an incoherent agent TOML configuration; spawned agents receive no effort argument and behave as though effort resolution was never wired.

## Acceptance Tests

The golden snapshot `tests/fixtures/golden-effort-snapshot.json` has the structure `{generated, description, rows[], omitContract[]}`. Each `rows` entry is `{agent, profile, runtime, expectedModel, expectedEffort}` holding post-D-08 resolver values; each `omitContract` entry is `{runtime, sampleProfile, sampleAgent}` asserting `expectedEffort: null` for each non-effort runtime. The snapshot contains 330 rows and 13 `omitContract` entries (both counts advisory, current as of 2026-06-12). `tests/feat-58-regression.test.cjs` TEST-01 is the tier-1 oracle that asserts the full agent×profile×runtime matrix; `init.cjs`'s `resolveReasoningEffortInternal` is the tier-2 implementation it pins.

| Invariant | Test File | Subtest / Assertion Shape |
|-----------|-----------|--------------------------|
| 06-INV-1 | tests/parse-model-effort.test.cjs | `'parseModelEffort splits model;effort on the effort allowlist'` |
| 06-INV-1 | tests/parse-model-effort.test.cjs | `'parseModelEffort treats every allowlist token as a valid effort suffix'` |
| 06-INV-1 | tests/parse-model-effort.test.cjs | `'parseModelEffort never treats a colon as a delimiter'` |
| 06-INV-1 | tests/parse-model-effort.test.cjs | `'parseModelEffort returns bare model with null effort (backward-compatible)'` |
| 06-INV-1 | tests/parse-model-effort.test.cjs | `'parseModelEffort splits on lastIndexOf(";") so embedded semicolons stay in model'` |
| 06-INV-1 | tests/parse-model-effort-parity.test.cjs | describe `'parseModelEffort CJS parity (shared fixture)'` — one subtest per fixture case |
| 06-INV-1 | tests/parse-model-effort-parity.test.cjs | describe `'parseModelEffort allowlist parity'` |
| 06-INV-1 | tests/parse-model-effort-parity.test.cjs | describe `'parseModelEffort warning-path parity (WR-02)'` |
| 06-INV-2 | tests/feat-53-unified-effort-resolver.test.cjs | describe `'Phase 53: claude runtime emits slot effort'` |
| 06-INV-2 | tests/feat-53-unified-effort-resolver.test.cjs | describe `'Phase 53: codex runtime — slot effort over per-tier fallback (RESOLVE-03)'` |
| 06-INV-2 | tests/feat-53-unified-effort-resolver.test.cjs | describe `'Phase 53: no runtime set → claude path; bare config → null'` |
| 06-INV-2 | tests/feat-53-unified-effort-resolver.test.cjs | describe `'Phase 53: inherit paths → null (RESOLVE-06)'` |
| 06-INV-2 | tests/feat-53-unified-effort-resolver.test.cjs | describe `'Phase 53: malformed effort token degrades gracefully (CONFIG-04/D-05)'` |
| 06-INV-2 | tests/feat-57-install-translation.test.cjs | describe `'Phase 57: resolver returns max verbatim on both runtimes (D-03 / RESOLVE-04)'` |
| 06-INV-3 | tests/feat-53-config-sites-and-golden.test.cjs | describe `'D-08: cross-resolver golden snapshot — bare config back-compat + same-slot invariant'` |
| 06-INV-3 | tests/feat-53-config-sites-and-golden.test.cjs | describe `'#3023 same-slot fixture: model_profile=inherit + models.execution=opus on codex'` |
| 06-INV-3 | tests/feat-58-regression.test.cjs | describe `'TEST-01: static golden snapshot — post-D-08 resolver values'` — `golden: ${row.agent}/${row.profile}/${row.runtime}` (one subtest per row) |
| 06-INV-4 | tests/feat-53-unified-effort-resolver.test.cjs | describe `'Phase 53: non-{claude,codex} runtime hard no-op (RESOLVE-05, D-02)'` |
| 06-INV-4 | tests/feat-58-regression.test.cjs | describe `'TEST-01: static golden snapshot — post-D-08 resolver values'` — `omit contract: runtime=${row.runtime} → effort null` (one subtest per omitContract entry) |
| 06-INV-5 | tests/feat-58-regression.test.cjs | describe `'TEST-03: translateEffortForCodex boundary + per-runtime omit contract'` — `'translateEffortForCodex("max") === "xhigh"'` |
| 06-INV-5 | tests/feat-58-regression.test.cjs | `'translateEffortForCodex passes through "low"'` |
| 06-INV-5 | tests/feat-58-regression.test.cjs | `'translateEffortForCodex passes through "medium"'` |
| 06-INV-5 | tests/feat-58-regression.test.cjs | `'translateEffortForCodex passes through "high"'` |
| 06-INV-5 | tests/feat-58-regression.test.cjs | `'translateEffortForCodex(null) === null'` |
| 06-INV-5 | tests/feat-58-regression.test.cjs | `'translateEffortForCodex(undefined) === null'` |
| 06-INV-5 | tests/feat-58-regression.test.cjs | nested describe `'non-effort runtimes return null from resolveReasoningEffortInternal'` — `resolveReasoningEffortInternal returns null for runtime=${runtime}` (one subtest per non-effort runtime) |
| 06-INV-6 | tests/phase-56-effort-wiring.test.cjs | describe `'phase-56 GAP A: Group A init-fed workflows carry effort token variables'` |
| 06-INV-6 | tests/phase-56-effort-wiring.test.cjs | describe `'phase-56 GAP B: Group B standalone-resolve sites carry resolve-model-effort capture lines'` |
| 06-INV-6 | tests/phase-56-effort-wiring.test.cjs | describe `'phase-60 Group B effort wiring: newly-covered workflows'` |
| 06-INV-6 | tests/feat-58-regression.test.cjs | describe `'TEST-01: static golden snapshot — post-D-08 resolver values'` — full agent×profile×runtime matrix |
| 06-INV-7 | tests/feat-57-install-translation.test.cjs | describe `'Phase 57: Codex TOML emit via generateCodexAgentToml (INSTALL-02)'` |
| 06-INV-7 | tests/feat-57-install-translation.test.cjs | describe `'Phase 57: haiku tier omits effort entirely (INSTALL-02 / D-03)'` |
| 06-INV-7 | tests/phase-56-effort-wiring.test.cjs | describe `'phase-56 GAP A: Group A init-fed workflows carry effort token variables'` |

## Key Decisions

### (a) Codex emit fix — correctness linchpin (D-04)

The Codex emit MUST tie the emitted `reasoning_effort` line to the same resolution source as the model line (WR-03, no silent divergence), and `max` translates to the Codex-specific `xhigh` tier at the emit seam. The real install.js seam is: `readGsdRuntimeProfileResolver` (advisory, install.js ~line 1456) returns an object with a `resolveEffort(agentName)` method (advisory, ~lines 1520–1529); the WR-03 guard tracks `modelEmitted` and emits the `model_reasoning_effort =` TOML line ONLY when `modelEmitted && runtimeResolver?.resolveEffort && runtimeResolver.runtime === 'codex'` (advisory, ~lines 2760–2787); `gsdTranslateEffortForCodex` applies `max` → `xhigh` at the boundary (advisory, ~line 2795). The ROADMAP label "`rawSlotForRuntime`" is a paraphrase — there is no literal symbol named `rawSlotForRuntime` in the source; any reimplementation that searches for this symbol will not find it. The correctness linchpin is the WR-03 `modelEmitted` guard, not a symbol called `rawSlotForRuntime`.

Rationale: without the `modelEmitted` gate, a Codex TOML section could contain `model_reasoning_effort =` without a corresponding `model =` line, or the two lines could resolve from different slots in edge-case configurations.

**Settled — do not reopen.** Consequence of reopening: the model and effort emit paths resolve from different slots and silently diverge, producing a `model_reasoning_effort` TOML line that does not match the emitted model; Codex receives incoherent agent configuration.

---

### (b) D-08 medium floor — deliberate milestone amendment (D-03 / D-08, amended 2026-06-04)

Bare `{claude,codex}` slots that resolve no effort through the precedence chain floor to `medium`. This is a deliberate milestone amendment applied 2026-06-04, not a provider default. The floor fires only after the haiku carve-out, inherit/unknown-slot null-return, and non-effort-runtime null-return have already been applied; those carve-outs are not overridden by the floor.

Rationale: before the D-08 amendment, every agent assigned to a bare catalog slot (no per-agent override, no `;effort` suffix in the catalog entry) silently produced no effort token, dropping to the provider default and erasing the per-agent effort dimension the milestone was built to establish.

**Settled — do not reopen.** Consequence of reopening: every bare-slot agent silently reverts to the provider default, erasing the per-agent effort differentiation and making the catalog `reasoning_effort` schema redundant for any agent that does not carry an explicit `reasoning_effort` field.

---

### (c) Static allowlist as the outermost absolute gate (RESOLVE-01 / D-07)

`RUNTIMES_WITH_REASONING_EFFORT` is a static literal set, not a data-derived scan, and is the absolute outermost gate — its check fires before any per-agent override, catalog lookup, or user config is evaluated.

Rationale: a data-derived scan would auto-admit any runtime that gains a `reasoning_effort` field in the catalog, silently leaking effort to runtimes that have not been validated to consume it; an explicit code edit is required to admit a new runtime.

**Settled — do not reopen.** Consequence of reopening: any runtime whose catalog entry gains a `reasoning_effort` field (including future runtimes added upstream) silently starts receiving effort tokens it cannot consume, producing malformed agent invocations.

---

### (d) `max` returned verbatim by the resolver; translated only at the emit boundary (D-03 / RESOLVE-04)

The resolver (`resolveReasoningEffortInternal`) returns `max` verbatim without clamping or translating it. The `max` → `xhigh` translation is applied exclusively at the Codex TOML emit boundary by `translateEffortForCodex`.

Rationale: clamping `max` in the resolver loses the GSD/Codex distinction between `max` (the resolver-layer tier) and `xhigh` (the Codex-protocol tier) before the emit seam can apply the correct translation.

**Settled — do not reopen.** Consequence of reopening: clamping `max` in the resolver causes the emit seam to receive `xhigh` instead of `max`; if the emit seam's `translateEffortForCodex` is then applied, the result is `xhigh` passed through (correct), but the resolver's contract changes from "returns verbatim" to "implicitly translates," making it inconsistent with the Claude runtime path where `max` is valid and must not be translated.

---

### (e) Haiku omits effort on every runtime; the carve-out precedes the floor (Pitfall 1)

A `haiku` bareTier slot resolves effort to `null` unconditionally on every runtime, including `{claude,codex}`. The haiku bareTier check fires at step 3 of the precedence chain, before steps 3a/4/5 and before the D-08 floor. A haiku slot with a `reasoning_effort: 'medium'` catalog entry still resolves to `null` because the bareTier check fires first.

Rationale: the haiku carve-out is intentional product behavior — haiku models on supported runtimes are intended to run without an explicit effort token regardless of any catalog or config value.

**Settled — do not reopen.** Consequence of reopening: a haiku slot with a catalog `reasoning_effort` value would emit effort that the feature intends to suppress, changing the per-runtime behavior for haiku-tier agents.

---

### (f) Shape is normative; concrete enumerations are dated advisory (D-07)

Every concrete enumeration — the `EFFORT_TOKENS` member list, the `{claude,codex}` allowlist, the 13 non-effort runtimes, the `*_effort` init-sibling key names, the 330-row/13-omitContract snapshot counts, and the precedence-step numbering — is a dated advisory enumeration marked "current as of 2026-06-12." The normative claim is always the shape: a fixed effort-token allowlist, a two-runtime absolute gate, a per-runtime omit contract covering all non-effort runtimes, a complete-coverage init-sibling set, and a full agent×profile×runtime matrix.

Rationale: every catalog edit, runtime addition, or upstream merge can shift the literal member values; a spec that locks literal values rots on every such change and stops being move-proof.

**Settled — do not reopen.** Consequence of reopening: the spec rots on every catalog edit, runtime addition, or agent rename, requiring a Phase 77 update on every upstream merge; the spec's value as a durable, move-proof contract is eliminated.

## Code Context

<!-- advisory -->

The items below are current as of 2026-06-12. All file paths, function names, symbols, and line numbers are advisory and will shift on any source edit or upstream refactor. No normative invariant depends on these paths or symbols — a reimplementer rebuilds the feature from the behavioral contract in §Invariants, §Acceptance Tests, and §Key Decisions above.

---

### `get-shit-done/bin/lib/core.cjs` — parser, resolver, translator

| Symbol | What it does | Line (advisory) |
|--------|--------------|-----------------|
| `EFFORT_TOKENS` | `new Set(['low', 'medium', 'high', 'xhigh', 'max'])` — effort-token allowlist for `parseModelEffort` | ~1221 |
| `parseModelEffort` | Splits a `model;effort` label on `lastIndexOf(';')`; validates suffix against `EFFORT_TOKENS`; warn-once on unknown suffix; returns `{model, effort}` | ~1242 |
| `translateEffortForCodex` | Maps `max` → `xhigh`; passes `low|medium|high` through; maps `null|undefined` → `null` | ~1278 |
| `resolveReasoningEffortInternal` | Unified resolver — full precedence chain (steps 0–5 + D-08 floor); haiku bareTier check precedes the floor | ~1628 |
| D-08 floor `return 'medium'` | Final return reached only for bare `{claude,codex}` slots with no effort at steps 1–5 (non-haiku, non-inherit, non-unknown) | ~1719 |

The JSDoc above `resolveReasoningEffortInternal` (~line 1610) enumerates the precedence steps 0–5, the D-08 amendment, and the haiku carve-out in prose — it is a ready narration source for the resolver chain.

---

### `get-shit-done/bin/lib/model-catalog.cjs` — allowlist and catalog schema

| Symbol | What it does | Line (advisory) |
|--------|--------------|-----------------|
| `KNOWN_RUNTIMES` | `new Set(Object.keys(catalog.runtimeTierDefaults))` — data-derived set of all catalog runtimes | ~91 |
| `RUNTIMES_WITH_REASONING_EFFORT` | `new Set(['claude', 'codex'])` — static literal; comment at ~93–96 explains why a data-derived scan would leak effort to unsupported runtimes | ~97 |

The catalog's `runtimeTierDefaults` section carries `reasoning_effort` per tier entry for each effort-supporting runtime (`claude`, `codex`). Advisory example from confirmed source (current as of 2026-06-12): codex entries carry `reasoning_effort` values per tier (`opus`/`sonnet`/`haiku`); the haiku catalog value is overridden by the resolver's haiku carve-out and resolves to `null` regardless.

---

### `get-shit-done/bin/lib/init.cjs` — effort siblings

`init.cjs` calls `resolveReasoningEffortInternal(cwd, agentType)` at approximately 21 call sites (~20 unique sibling key names) across workflow init blocks. Advisory key names, current as of 2026-06-12: `executor_effort`, `verifier_effort`, `researcher_effort`, `planner_effort`, `checker_effort`, `synthesizer_effort`, `roadmapper_effort`, `mapper_effort`. The count is advisory; the normative claim is complete-coverage shape (every agent init site has a corresponding `*_effort` sibling).

---

### `bin/install.js` — Codex emit seam

| Symbol | What it does | Line (advisory) |
|--------|--------------|-----------------|
| `gsdResolveReasoningEffort` | Import alias for `resolveReasoningEffortInternal` from core.cjs | ~162 |
| `gsdTranslateEffortForCodex` | Import alias for `translateEffortForCodex` from core.cjs | ~163 |
| `readGsdRuntimeProfileResolver` | Returns an object with `resolveEffort(agentName)` and `runtime`; WR-01 gate on `merged.runtime && probedProjectDir` | ~1456 |
| `resolveEffort(agentName)` | Method on the resolver object; calls `gsdResolveReasoningEffort` for the given agent | ~1520–1529 |
| WR-03 `modelEmitted` guard | `let modelEmitted = false`; emits `model_reasoning_effort =` ONLY when `modelEmitted && runtimeResolver?.resolveEffort && runtimeResolver.runtime === 'codex'` | ~2760–2787 |
| `gsdTranslateEffortForCodex(...)` boundary | Applies `max` → `xhigh` translation at the TOML emit boundary | ~2795 |

There is no literal symbol named `rawSlotForRuntime` in `bin/install.js`; the ROADMAP label "`rawSlotForRuntime` Codex fix" is a paraphrase for the WR-03 guard described above.

---

### `tests/fixtures/golden-effort-snapshot.json` — tier-1 oracle structure

| Field | Description |
|-------|-------------|
| `generated` | ISO date the snapshot was last regenerated (advisory, current as of 2026-06-12: `"2026-06-07"`) |
| `description` | Human-readable label for the snapshot |
| `rows[]` | Array of `{agent, profile, runtime, expectedModel, expectedEffort}` entries — post-D-08 resolver values for the full agent×profile×runtime matrix (330 entries, advisory count) |
| `omitContract[]` | Array of `{runtime, sampleProfile, sampleAgent}` entries — each asserts `expectedEffort: null` for a non-effort runtime (13 entries, advisory count) |

`tests/feat-58-regression.test.cjs` TEST-01 is the tier-1 oracle for this snapshot. For each `rows` entry, TEST-01 calls `resolveModelInternal` and `resolveReasoningEffortInternal` and asserts the frozen expected values. For each `omitContract` entry, it asserts `null` from `resolveReasoningEffortInternal`.

---

### Dated advisory enumerations (current as of 2026-06-12 — shape normative, values advisory)

- **`EFFORT_TOKENS` members:** `{low, medium, high, xhigh, max}` — a fixed five-member allowlist; the normative claim is a fixed allowlist shape, not the specific five members.
- **`RUNTIMES_WITH_REASONING_EFFORT` members:** `{claude, codex}` — a two-runtime static set; the normative claim is a static, outermost-gate shape.
- **`omitContract` runtimes (13 advisory):** gemini, qwen, opencode, copilot, hermes, kilo, cline, cursor, windsurf, augment, trae, codebuddy, antigravity — the normative claim is complete omit-contract coverage for all non-effort runtimes.
- **`*_effort` init-sibling key names (~8 unique, ~21 call sites):** `executor_effort`, `verifier_effort`, `researcher_effort`, `planner_effort`, `checker_effort`, `synthesizer_effort`, `roadmapper_effort`, `mapper_effort` — the normative claim is complete-coverage shape, not the specific key names or call count.
- **Golden snapshot counts:** 330 rows, 13 `omitContract` entries — advisory counts as of 2026-06-12; the normative claim is full agent×profile×runtime matrix coverage and full non-effort-runtime omit-contract coverage.
- **Precedence-step numbers (0–5):** advisory step numbering from the JSDoc; the normative claim is the ordered-precedence shape.

Advisory note (TEST-04): `tests/feat-58-regression.test.cjs` TEST-04 guards test-code correctness (no `indexOf`-as-boolean on effort tokens; no bare `includes('medium'|'high')` in `assert.ok`). It governs testing-assertion conventions, not feature behavior; it is supporting evidence for the effort-token surface (06-INV-1 / 06-INV-5) but is not a feature invariant.
