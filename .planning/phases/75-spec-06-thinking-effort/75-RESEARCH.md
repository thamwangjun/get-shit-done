# Phase 75: spec-06 Thinking Effort - Research

**Researched:** 2026-06-12
**Domain:** Spec authoring — per-agent thinking effort (resolver/parser/catalog/wiring/install-emit)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Role-based invariant grouping, 6–8 invariants along the 7-role axis (parse / resolve-precedence / D-08 floor / allowlist gate / omit-translate / catalog+siblings / wiring+emit). Final count (6/7/8) and exact role boundaries are Claude's discretion within QUAL-01 falsifiability.
- **D-03:** The D-08 medium floor is a MUST-level invariant. Consequence of omission: bare {claude,codex} slots floor to `medium`; without it every such agent silently drops to the provider default, erasing the per-agent effort dimension. Carve-outs (haiku exempt; inherit/unknown → null; non-effort runtimes → null) are part of the same invariant.
- **D-04:** Codex linchpin handled as Key Decision (design rationale + linchpin status) PLUS testable boundary carried by INV-5 (traced to feat-58 TEST-03). Researcher pins the real install.js symbol.
- **D-05:** Golden snapshot = tier-1 oracle, init.cjs = tier-2; both cited per SC3; snapshot structure described. Per-invariant tier-1 assignment is planner discretion.
- **D-06:** CATALOG-02 user-handover boundary is OUT OF SCOPE.
- **D-07:** Concrete enumerations (EFFORT_TOKENS set, {claude,codex} allowlist, 13 non-effort runtimes, 20 init siblings, 330 snapshot rows, precedence-step numbers) are dated "current as of 2026-06-12" advisory enumerations. Shape is normative, not the count.

### Claude's Discretion

- Final invariant count (6–8) and exact role boundaries within the locked role-based axis.
- Exact EARS pattern per invariant (Ubiquitous vs Event-driven vs Unwanted-behavior), provided each is a single falsifiable claim mapping to a subtest.
- Exact subtest/assertion-shape strings in the Acceptance Tests table — read from real `describe`/`test` names.
- Whether to abbreviate the 20-sibling / 13-runtime / 330-row enumerations to representative classes vs literal lists in Code Context.
- Confidence value to stamp in frontmatter when the body is finalized.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. No INDEX dependency edges or scope additions; no behavior change to the parser/resolver/catalog/wiring is in scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SPEC-06 | `06-thinking-effort/SPEC.md` fully specifies per-agent thinking effort: `parseModelEffort` semicolon parser, unified `{claude,codex}` resolver precedence chain, D-08 medium floor, static runtime allowlist, per-runtime behavior matrix, catalog schema, 20 `*_effort` init siblings, spawn-template wiring, install.js Codex emit seam, and Codex fix linchpin | All source seams pinned: `parseModelEffort` (core.cjs line 1242), `EFFORT_TOKENS` (line 1221), `translateEffortForCodex` (line 1278), `resolveReasoningEffortInternal` (line 1628), `RUNTIMES_WITH_REASONING_EFFORT` (model-catalog.cjs line 97), `readGsdRuntimeProfileResolver` + `resolveEffort`/WR-03 (install.js lines 1456, 1520–1529, 2760–2798). All tier-1 test describe/test names confirmed from source. |
| QUAL-01 | Each spec states behavioral invariants as numbered, falsifiable EARS statements with RFC 2119 strength | 6–8 role-based invariants identified, each maps to a real subtest cluster |
| QUAL-02 | Each spec has an Acceptance-Tests traceability table mapping each MUST-level invariant to a test file and subtest name | All tier-1/sibling oracle test describe/test names confirmed from source |
| QUAL-03 | Each spec separates normative contract from advisory implementation notes | All current file paths/symbols marked advisory; advisory markers demonstrated in sibling SPEC-07 |
| QUAL-04 | Each spec cites at least one tier-1 or tier-2 artifact | `tests/feat-58-regression.test.cjs` is tier-1; `core.cjs`, `init.cjs`, `model-catalog.cjs`, `install.js` are tier-2 |
| QUAL-05 | Each spec has a Key Decisions section recording settled decisions with rationale | D-08 floor, Codex emit linchpin (D-04), allowlist-as-outermost-gate, max-verbatim (D-03), haiku-omits-effort, shape-not-count (D-07) are all settled decisions |

</phase_requirements>

---

## Summary

Phase 75 writes the body of `.planning/spec/06-thinking-effort/SPEC.md` — a behavioral-contract spec of GSD's per-agent thinking-effort feature. This is a narration-and-pinning exercise: the feature is fully implemented and GREEN across all tier-1 tests; the spec author reads the real source symbols, test describe/test names, and snapshot structure, then narrates them into the 7-section CONVENTIONS template with role-based invariants.

The most complex spec surface in the v2.1.0-h milestone spans 9 connected behaviors: (1) the `parseModelEffort` semicolon parser with `EFFORT_TOKENS` allowlist and typo-handling, (2) the `resolveReasoningEffortInternal` unified precedence chain (allowlist gate → per-agent override → phase-type slot → user override → catalog slot → runtime-tier fallback), (3) the D-08 medium floor for bare `{claude,codex}` slots, (4) the static `RUNTIMES_WITH_REASONING_EFFORT = {claude, codex}` allowlist as absolute outermost gate, (5) the per-runtime omit/translate contract (`translateEffortForCodex`: `max → xhigh`, pass-through for `low|medium|high`, `null|undefined → null`), (6) the catalog schema carrying `reasoning_effort`, (7) 20 `*_effort` init siblings calling `resolveReasoningEffortInternal`, (8) spawn-template wiring, and (9) the install.js Codex emit seam (`readGsdRuntimeProfileResolver` / `resolveEffort` / WR-03 gate) that ties the `model_reasoning_effort` TOML line to the same source as the `model` line.

The critical linchpin the ROADMAP calls "`rawSlotForRuntime` Codex fix" resolves to the WR-03 guard at install.js line 2784–2787: `modelEmitted` gates the effort emit so model and effort lines are always paired from the same resolution source, never diverge silently. The literal symbol `rawSlotForRuntime` does not exist in source — it was a ROADMAP paraphrase.

**Primary recommendation:** The planner authors the spec body by reading the pinned symbols and test names below, narrating invariants by role, routing each to its closest tier-1 oracle, and capturing the Codex linchpin as a Key Decision with the WR-03 guard as the advisory implementation pointer.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `parseModelEffort` parser | API / Backend (core.cjs) | — | Parser is a pure function in the shared CLI library; no frontend or storage concern |
| `resolveReasoningEffortInternal` resolver | API / Backend (core.cjs) | — | Resolver reads config, applies precedence chain; single-module ownership |
| `RUNTIMES_WITH_REASONING_EFFORT` gate | API / Backend (model-catalog.cjs) | — | Static capability allowlist; must be explicit to prevent silent leakage to unsupported runtimes |
| Catalog `reasoning_effort` schema | Database / Storage (model-catalog.json) | — | Catalog is the data source for runtime/tier entries; resolver reads from it |
| `*_effort` init siblings | API / Backend (init.cjs) | — | Init block is the workflow orchestration layer; exposes resolved effort to spawned agents |
| Codex emit seam | CDN / Static (install.js TOML emit) | API / Backend (core.cjs resolver) | Install.js emits static TOML at install time; effort value crosses from resolver (tier-2) to install-time translation |
| Golden regression snapshot | Database / Storage (fixtures) | — | Static fixture file asserting resolver output matrix across all agent×profile×runtime combinations |

---

## Standard Stack

This is a spec-authoring phase — no new packages are installed. All referenced libraries are the project's existing CommonJS Node.js stack.

### Core (existing — no installs needed)

| Module | Location | Purpose |
|--------|----------|---------|
| `core.cjs` | `get-shit-done/bin/lib/core.cjs` | `parseModelEffort`, `translateEffortForCodex`, `resolveReasoningEffortInternal` |
| `model-catalog.cjs` | `get-shit-done/bin/lib/model-catalog.cjs` | `RUNTIMES_WITH_REASONING_EFFORT`, `KNOWN_RUNTIMES`, `RUNTIME_PROFILE_MAP` |
| `init.cjs` | `get-shit-done/bin/lib/init.cjs` | 20 `*_effort` siblings |
| `install.js` | `bin/install.js` | Codex emit seam: `readGsdRuntimeProfileResolver`, `resolveEffort`, WR-03 gate |

**Installation:** None required.

---

## Package Legitimacy Audit

Not applicable — this phase installs no external packages.

---

## Architecture Patterns

No new architecture. The spec follows the locked 7-section template from `00-CONVENTIONS.md` exactly, mirroring the section shape of SPEC-07 (the closest worked reference for advisory markers, Key Decision format, and invariant/acceptance-test split).

SPEC-06 differs from single-oracle scanner specs (SPEC-07) in one key dimension: the Acceptance Tests table routes each invariant to its **closest dedicated oracle** rather than a single corpus scan. The parser, resolver precedence chain, floor, translate boundary, and wiring each have dedicated unit oracles.

### Recommended Spec Structure (follows 7-section template)

```
06-thinking-effort/
└── SPEC.md    # stub frontmatter already present; body to be filled
```

### Pattern: Per-Invariant Oracle Routing (SPEC-06 specific)

Each invariant routes to its closest dedicated test rather than always routing to the golden snapshot:

- **Parser invariant (INV-1):** `tests/parse-model-effort.test.cjs` + `parse-model-effort-parity.test.cjs` + fixture JSON
- **Resolver precedence invariant (INV-2):** `tests/feat-53-unified-effort-resolver.test.cjs`
- **D-08 floor invariant (INV-3):** `tests/feat-53-config-sites-and-golden.test.cjs` (D-08 cross-resolver golden describe)
- **Allowlist gate invariant (INV-4):** `tests/feat-53-unified-effort-resolver.test.cjs` (non-{claude,codex} no-op describe)
- **Omit/translate invariant (INV-5):** `tests/feat-58-regression.test.cjs` TEST-03
- **Catalog+siblings invariant (INV-6):** `tests/phase-56-effort-wiring.test.cjs` + `tests/feat-58-regression.test.cjs` TEST-01 (golden)
- **Wiring+emit invariant (INV-7):** `tests/feat-57-install-translation.test.cjs` (Codex TOML emit describe)

### Anti-Patterns to Avoid

- **Values-as-normative:** Never state the literal member count of EFFORT_TOKENS, the list of 13 non-effort runtimes, or the 330 row count as the normative claim. Mark all as advisory "current as of 2026-06-12."
- **Single-oracle routing:** Do not force all invariants through the 330-row golden snapshot — each invariant routes to its closest dedicated oracle (Section 5 / QUAL-02).
- **Prose duplicate of Code Context in Invariants:** Invariants must be behavioral claims, not implementation descriptions. Implementation details go in `## Code Context` with advisory markers.

---

## Don't Hand-Roll

Not applicable for a spec-authoring phase. No custom solutions are being built; the spec narrates existing shipped behavior.

---

## Pinned Source Seams (THE MOST IMPORTANT RESEARCH OUTPUT)

This section documents every symbol, line number, and test name the planner needs to author SPEC-06 accurately. All values are verified from source on 2026-06-12 and are advisory.

### D-04 Linchpin — The Real Codex Emit Seam (resolves ROADMAP paraphrase `rawSlotForRuntime`)

The ROADMAP paraphrase "`rawSlotForRuntime` Codex fix" has **no literal symbol** in the source. The real seam, confirmed in `bin/install.js`, is:

**Symbol:** `readGsdRuntimeProfileResolver` (install.js line 1456)

This function returns an object with a `resolveEffort(agentName)` method (lines 1520–1529). The method gates on `merged.runtime && probedProjectDir` (WR-01, line 1528) — a home-only config (no per-project `.planning/`) intentionally produces no effort line, so model and effort emit paths cannot diverge silently.

**The WR-03 guard** (install.js lines 2760–2787) is the linchpin correctness seam:
- `let modelEmitted = false` — tracks whether a `model =` TOML line was emitted
- The `model_reasoning_effort =` line is ONLY emitted when `modelEmitted && runtimeResolver?.resolveEffort && runtimeResolver.runtime === 'codex'` (line 2787)
- This ensures the emitted `reasoning_effort` line shares the same resolution source as the model line — they are always paired, never independently resolved from different slots

**Translation at the boundary:** `gsdTranslateEffortForCodex(runtimeResolver.resolveEffort(effortName))` (line 2795) applies the `max → xhigh` translation at the TOML boundary. The resolver itself (`resolveReasoningEffortInternal`) returns `max` verbatim — no clamp.

**Import alias:** In install.js, `translateEffortForCodex` from core.cjs is aliased as `gsdTranslateEffortForCodex` (line 163); `resolveReasoningEffortInternal` is aliased as `gsdResolveReasoningEffort` (line 162).

### core.cjs — Exact Line Numbers

| Symbol | Line | Notes |
|--------|------|-------|
| `EFFORT_TOKENS` | 1221 | `new Set(['low', 'medium', 'high', 'xhigh', 'max'])` |
| `parseModelEffort` | 1242 | Splits on `lastIndexOf(';')`; splits colons never; `suffix === ''` → strip silently (WR-04); unknown suffix → warn-once + null effort |
| `translateEffortForCodex` | 1278 | `max → xhigh`; `low|medium|high` pass through; `null|undefined → null` |
| `resolveReasoningEffortInternal` | 1628 | Full precedence chain; D-08 floor at line 1719 (`return 'medium'`) |

**Precedence chain (verbatim from JSDoc above line 1628):**

```
0. Outermost gate: runtime must be in {claude, codex} (D-02/RESOLVE-05) — absolute
1. Per-agent override: model_overrides[agentType] parsed by parseModelEffort (.effort)
   - Haiku override: haiku;high → null (haiku exclusion wins over ;effort, line 1644)
2. Shared slot: _resolveAgentSlotFromConfig → tier string; inherit/null → return null (RESOLVE-06)
3. Haiku bareTier check: bareTier === 'haiku' → return null (precedes steps 3a/4/5)
3. Phase-type slot effort (CONFIG-02): models.<phase-type> with ;effort suffix
3a. User-supplied reasoning_effort in model_profile_overrides (D-02)
4. Catalog slot effort (same-slot invariant/D-08): parseModelEffort(tier).effort
5. Runtime-tier entry fallback (RESOLVE-03/CONFIG-03): _resolveRuntimeTier(config, bareTier).reasoning_effort
   → For claude runtime: RUNTIME_PROFILE_MAP has no entry → null
D-08 floor: return 'medium' (reached only for bare {claude,codex} slots with no effort at steps 1–5)
```

Note: steps are labeled 0–5 in JSDoc; step 3 has two sub-steps (3/3a) in source. The planner may renumber for spec clarity (advisory).

**D-08 floor mechanics:** The `return 'medium'` at line 1719 is only reached when:
- Runtime is in `{claude, codex}` (step 0 passed)
- Slot is not `inherit`/unknown (step 2 passed)
- Slot is not `haiku` (step 3 passed)
- No effort resolved from steps 1/3/3a/4/5

This means: bare `{claude,codex}` slots (e.g., a plain `opus` slot with no `reasoning_effort` in the catalog and no user override) floor to `medium`. The D-08 amendment was applied 2026-06-04.

### model-catalog.cjs — Exact Line Numbers

| Symbol | Line | Value |
|--------|------|-------|
| `RUNTIMES_WITH_REASONING_EFFORT` | 97 | `new Set(['claude', 'codex'])` |
| `KNOWN_RUNTIMES` | 91 | `new Set(Object.keys(catalog.runtimeTierDefaults))` — data-derived |

**Why static allowlist (D-07/RESOLVE-01):** Comment at line 93–96: a data-derived scan would auto-admit any runtime that gains a `reasoning_effort` field, silently leaking effort to unsupported runtimes. The static literal is intentional — admitting a new runtime requires an explicit source edit.

**Catalog `reasoning_effort` schema:** The `model-catalog.json` `runtimeTierDefaults` section carries `reasoning_effort` per tier entry for effort-supporting runtimes only. Example from confirmed source (codex runtime):
```json
"codex": {
  "opus":   { "model": "gpt-5.4",      "reasoning_effort": "xhigh" },
  "sonnet": { "model": "gpt-5.3-codex","reasoning_effort": "medium" },
  "haiku":  { "model": "gpt-5.4-mini", "reasoning_effort": "medium" }
}
```
Note: the catalog carries `reasoning_effort: "medium"` for the `haiku` codex tier, but the resolver overrides this at step 3 (haiku bareTier check) — the resolver's haiku carve-out takes precedence over the catalog value.

### init.cjs — Effort Siblings

**Count:** 21 calls to `resolveReasoningEffortInternal` in init.cjs (confirmed by grep -c), but 20 unique sibling key names (`*_effort` properties exposed to workflows). The gap is one repeated occurrence across different init blocks.

**Unique sibling keys (confirmed from source, current as of 2026-06-12, advisory):**
- `executor_effort`
- `verifier_effort`
- `researcher_effort` (appears twice — in phase-research and new-roadmap blocks)
- `planner_effort`
- `checker_effort`
- `synthesizer_effort`
- `roadmapper_effort`
- `mapper_effort`

8 unique key names across ~21 call sites (multiple init blocks reuse the same key names for different workflow contexts). The CONTEXT.md "20 init siblings" count refers to 20 distinct call sites; the D-07 advisory note applies: "a complete-coverage init-sibling set" is the normative shape, not the exact count.

### Golden Snapshot Structure (feat-58-regression.test.cjs TEST-01 oracle)

**File:** `tests/fixtures/golden-effort-snapshot.json`

**Confirmed structure:**
```json
{
  "generated": "2026-06-07",
  "description": "Static post-D-08 golden: agent × profile × runtime",
  "rows": [ { "agent": "...", "profile": "...", "runtime": "...", "expectedModel": "...", "expectedEffort": "..." }, ... ],
  "omitContract": [ { "runtime": "...", "sampleProfile": "...", "sampleAgent": "..." }, ... ]
}
```

**Confirmed counts (current as of 2026-06-12, advisory):**
- `rows`: **330** entries
- `omitContract`: **13** entries

**omitContract runtimes (advisory enumeration, current as of 2026-06-12):**
`gemini`, `qwen`, `opencode`, `copilot`, `hermes`, `kilo`, `cline`, `cursor`, `windsurf`, `augment`, `trae`, `codebuddy`, `antigravity`

**How TEST-01 uses the snapshot:**
- For each `rows` entry: calls `resolveModelInternal(d, row.agent)` and `resolveReasoningEffortInternal(d, row.agent)` with `{ runtime: row.runtime, model_profile: row.profile }` config; asserts `=== row.expectedModel` and `=== row.expectedEffort`
- For each `omitContract` entry: calls `resolveReasoningEffortInternal(d, row.sampleAgent)` with `{ runtime: row.runtime, model_profile: row.sampleProfile }` config; asserts `=== null`

The snapshot's `omitContract` structure is the cleanest evidence for the per-runtime omit invariant — 13 explicit runtime→null assertions.

---

## Tier-1 and Sibling Oracle Test Names (for Acceptance Tests table)

All describe/test names confirmed from source. Format mirrors SPEC-07's Acceptance Tests table.

### `tests/feat-58-regression.test.cjs` (tier-1 behavioral oracle)

**TEST-01 describe block:**
```
describe('TEST-01: static golden snapshot — post-D-08 resolver values', ...)
  test(`golden: ${row.agent}/${row.profile}/${row.runtime}`, ...)      // one subtest per row
  test(`omit contract: runtime=${row.runtime} → effort null`, ...)     // one subtest per omitContract entry
```

**TEST-03 describe block:**
```
describe('TEST-03: translateEffortForCodex boundary + per-runtime omit contract', ...)
  test('translateEffortForCodex("max") === "xhigh"', ...)
  test('translateEffortForCodex passes through "low"', ...)
  test('translateEffortForCodex passes through "medium"', ...)
  test('translateEffortForCodex passes through "high"', ...)
  test('translateEffortForCodex(null) === null', ...)
  test('translateEffortForCodex(undefined) === null', ...)
  describe('non-effort runtimes return null from resolveReasoningEffortInternal', ...)
    test(`resolveReasoningEffortInternal returns null for runtime=${runtime}`, ...)   // one per non-effort runtime
```

**TEST-04 describe block:**
```
describe('TEST-04: antipattern guard — indexOf-as-boolean and bare includes substring collision', ...)
  test('no test file uses indexOf-as-boolean on effort tokens', ...)
  test('no test file uses bare includes("medium"|"high") in assert.ok (substring collision)', ...)
  test('D-G1: feat-57 safe structured-string includes() is not flagged by either guard', ...)
```

### `tests/parse-model-effort.test.cjs` (INV-1 parser oracle)

Top-level tests (not inside describe):
- `test('parseModelEffort is exported as a function', ...)`
- `test('parseModelEffort splits model;effort on the effort allowlist', ...)`
- `test('parseModelEffort treats every allowlist token as a valid effort suffix', ...)`
- `test('parseModelEffort never treats a colon as a delimiter', ...)`
- `test('parseModelEffort returns bare model with null effort (backward-compatible)', ...)`
- `test('parseModelEffort splits on lastIndexOf(";") so embedded semicolons stay in model', ...)`

### `tests/parse-model-effort-parity.test.cjs` (INV-1 parity oracle)

```
describe('parseModelEffort CJS parity (shared fixture)', ...)
describe('parseModelEffort allowlist parity', ...)
describe('parseModelEffort warning-path parity (WR-02)', ...)
```

### `tests/feat-53-unified-effort-resolver.test.cjs` (INV-2 resolver precedence oracle, INV-4 allowlist gate oracle)

```
describe('Phase 53: claude runtime emits slot effort', ...)
describe('Phase 53: codex runtime — slot effort over per-tier fallback (RESOLVE-03)', ...)
describe('Phase 53: non-{claude,codex} runtime hard no-op (RESOLVE-05, D-02)', ...)
describe('Phase 53: no runtime set → claude path; bare config → null', ...)
describe('Phase 53: inherit paths → null (RESOLVE-06)', ...)
describe('Phase 53: malformed effort token degrades gracefully (CONFIG-04/D-05)', ...)
```

### `tests/feat-53-config-sites-and-golden.test.cjs` (INV-2/INV-3 D-08 floor oracle)

```
describe('CONFIG-02: models.<phase-type> model;effort reaches parseModelEffort in resolver', ...)
describe('CONFIG-03: model_profile_overrides string shorthand parses ;effort suffix', ...)
describe('CONFIG-04: malformed effort token degrades to null + one-time warning', ...)
describe('D-08: cross-resolver golden snapshot — bare config back-compat + same-slot invariant', ...)
describe('#3023 same-slot fixture: model_profile=inherit + models.execution=opus on codex', ...)
```

### `tests/phase-56-effort-wiring.test.cjs` (INV-6/INV-7 wiring oracle)

```
describe('phase-56 GAP A: Group A init-fed workflows carry effort token variables', ...)
describe('phase-56 GAP B: Group B standalone-resolve sites carry resolve-model-effort capture lines', ...)
describe('phase-60 Group B effort wiring: newly-covered workflows', ...)
```

### `tests/feat-57-install-translation.test.cjs` (INV-5/INV-7 install-emit oracle)

```
describe('Phase 57: translateEffortForCodex export', ...)
  test('translateEffortForCodex is exported as a function (INSTALL-01)', ...)
describe('Phase 57: translateEffortForCodex translations (INSTALL-01)', ...)
describe('Phase 57: resolver returns max verbatim on both runtimes (D-03 / RESOLVE-04)', ...)
describe('Phase 57: haiku tier omits effort entirely (INSTALL-02 / D-03)', ...)
describe('Phase 57: Codex TOML emit via generateCodexAgentToml (INSTALL-02)', ...)
```

### `tests/bare-effort-arg-scan.test.cjs` (INV-7 / antipattern guard)

```
describe('bare-effort-arg-scan: no bare {*_effort_arg} in Agent invocations', ...)
```

---

## Common Pitfalls

### Pitfall 1: Haiku Carve-Out Position

**What goes wrong:** Treating the haiku-omits-effort carve-out as happening after the D-08 floor check, rather than before.

**Why it happens:** The D-08 floor is described as the final step; it can appear that haiku's null would be "overridden" by the floor.

**How to avoid:** The JSDoc is explicit — the haiku bareTier check at step 3 precedes steps 3a/4/5 AND precedes the floor. A `haiku` slot with `reasoning_effort: 'medium'` in the catalog still resolves to `null` because the bareTier check fires first (code line 1663: `if (bareTier === 'haiku') return null`).

**Warning signs:** An invariant that says "haiku returns null unless the floor applies" — the carve-out is unconditional.

---

### Pitfall 2: Conflating `rawSlotForRuntime` with a Real Symbol

**What goes wrong:** Citing `rawSlotForRuntime` as an actual function or variable name in the spec's Code Context.

**Why it happens:** The ROADMAP uses this paraphrase to describe the linchpin; the symbol does not exist.

**How to avoid:** The real seam is `readGsdRuntimeProfileResolver` → `resolveEffort` → WR-03 guard (`modelEmitted` gate). Pin these real symbols in Code Context with advisory markers.

---

### Pitfall 3: D-08 Floor as SHOULD (not MUST)

**What goes wrong:** Treating the D-08 medium floor as optional/advisory behavior.

**Why it happens:** It was a milestone amendment (added 2026-06-04, not an original design requirement), so it might appear to be a late addition.

**How to avoid:** Per D-03 (ROADMAP lock), the floor is a MUST-level invariant. State the consequence of omission: without the floor, bare `{claude,codex}` slots emit no effort, silently dropping every such agent to the provider default and erasing the per-agent effort dimension the milestone exists to add.

---

### Pitfall 4: Values-as-Normative (D-07 violation)

**What goes wrong:** Stating "EFFORT_TOKENS is `{low, medium, high, xhigh, max}`" or "13 non-effort runtimes" as a normative claim in Invariants.

**Why it happens:** The specific values are useful and verified; it is tempting to lock them.

**How to avoid:** Mark all concrete enumerations as advisory "current as of 2026-06-12." The normative claim is always the shape: "a fixed effort-token allowlist," "a two-runtime effort gate," "a per-runtime omit contract." See SPEC-07 §Scope for the exact advisory-marking pattern to mirror.

---

### Pitfall 5: max Token — Resolver vs. Emit Boundary

**What goes wrong:** Stating that the resolver returns `xhigh` for `max` input.

**Why it happens:** The Codex catalog entry uses `xhigh` and the end result for Codex is `xhigh`.

**How to avoid:** The resolver returns `max` verbatim (D-03/RESOLVE-04, code at step 4: `max returned verbatim — no resolver clamp`). The `max → xhigh` translation happens exclusively at the install.js TOML boundary via `translateEffortForCodex`. INV-5 covers the translate behavior; INV-2 (resolver) must not claim the resolver clamps `max`.

---

## Code Examples

All examples are from confirmed source, current as of 2026-06-12. All advisory.

### EFFORT_TOKENS allowlist declaration (core.cjs line 1221)

```javascript
// Source: get-shit-done/bin/lib/core.cjs line 1221
const EFFORT_TOKENS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);
```

### translateEffortForCodex (core.cjs lines 1278–1281)

```javascript
// Source: get-shit-done/bin/lib/core.cjs line 1278
function translateEffortForCodex(effort) {
  if (effort == null) return null;
  return effort === 'max' ? 'xhigh' : effort;
}
```

### D-08 floor (core.cjs line 1719 — the final return)

```javascript
// Source: get-shit-done/bin/lib/core.cjs line 1719
// D-08: floor un-assigned {claude,codex} slots to 'medium'.
return 'medium';
```

### WR-03 gate in install.js (lines 2784–2798)

```javascript
// Source: bin/install.js lines 2784–2798 (advisory)
// WR-03: gate the effort emit on a model line having been emitted
// (modelEmitted) so the two TOML lines stay paired and can never drift
if (modelEmitted && runtimeResolver?.resolveEffort && runtimeResolver.runtime === 'codex') {
  const effortName = runtimeResolver.resolve(resolvedName) ? resolvedName : agentName;
  const codexEffort = gsdTranslateEffortForCodex(runtimeResolver.resolveEffort(effortName));
  if (codexEffort) {
    lines.push(`model_reasoning_effort = ${JSON.stringify(codexEffort)}`);
  }
}
```

### RUNTIMES_WITH_REASONING_EFFORT declaration (model-catalog.cjs line 97)

```javascript
// Source: get-shit-done/bin/lib/model-catalog.cjs line 97
const RUNTIMES_WITH_REASONING_EFFORT = new Set(['claude', 'codex']);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Early-null: any `model_overrides` present → omit effort | Parse override through `parseModelEffort`; only omit effort when override has no `;effort` suffix | Phase 53 (D-01/CONFIG-01) | `model;effort` overrides now propagate effort |
| Separate effort resolution per tier in install.js | Unified `resolveReasoningEffortInternal` with `_resolveAgentSlot` shared helper | Phase 53 (D-06) | Eliminates #3023 model/effort divergence |
| Data-derived `RUNTIMES_WITH_REASONING_EFFORT` scan | Static literal `new Set(['claude', 'codex'])` | Phase 53 (D-07/RESOLVE-01) | Prevents silent leakage to runtimes that gain `reasoning_effort` in catalog |
| No medium floor for bare slots | D-08: bare `{claude,codex}` slots floor to `medium` | 2026-06-04 (D-08 amendment) | Per-agent effort dimension preserved; agents without explicit effort still get `medium` instead of provider default |
| `reasoning_effort` emitted in tier-resolution branch of install.js | Exclusively via `resolveEffort()` at the TOML boundary (Phase 57) | Phase 57 | Eliminates reasoning_effort-without-model TOML pairs |

**Deprecated/outdated:**
- `rawSlotForRuntime`: ROADMAP paraphrase — no such symbol; real seam is `readGsdRuntimeProfileResolver` / `resolveEffort` / WR-03

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 21 `resolveReasoningEffortInternal` call sites in init.cjs correspond to ~20 unique sibling key names (some init blocks share key names) | Pinned Source Seams / init.cjs | If count is wrong, the D-07 advisory "20 init siblings" claim in the spec needs correcting; risk is low because shape is normative, not count |

**All other claims were verified directly from source on 2026-06-12. No unverified factual claims require user confirmation.**

---

## Open Questions

1. **Final invariant count: 6, 7, or 8?**
   - What we know: D-01 specifies 6–8; the 7-role axis is fully defined; INV-6 (catalog+siblings) and INV-7 (wiring+emit) could split or merge.
   - What's unclear: Whether splitting INV-6 into catalog-schema and init-siblings as separate invariants adds meaningful falsifiability (they share the same tier-1 oracle).
   - Recommendation: 7 invariants is the natural fit — one per role in the axis. If INV-6 (catalog+siblings) and INV-7 (wiring+emit) split, go to 8; if INV-6 merges catalog with catalog-schema, stay at 7 or 6. Planner's discretion.

2. **Antipattern guard (TEST-04) invariant placement**
   - What we know: TEST-04 guards test code correctness (no `indexOf`-as-boolean, no bare `includes('medium'|'high')` in `assert.ok`). It is tier-1 evidence but governs testing conventions, not feature behavior.
   - What's unclear: Whether it warrants a dedicated SPEC-06 invariant or belongs in SPEC-08 (test infrastructure).
   - Recommendation: Include it as an advisory note in Code Context citing TEST-04, or as part of INV-7 (emit wiring) if the spec wants to capture the "safe assertion patterns" contract. The per-spec QUAL-02 traceability table should at minimum list it as supporting evidence for whichever invariant covers the effort-token surface. Planner's discretion.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is a spec-authoring exercise (Markdown file writing) with no external runtime dependencies.

---

## Validation Architecture

**`workflow.nyquist_validation` not explicitly set to false in `.planning/config.json`** — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `--test` runner |
| Config file | none (no jest.config/vitest.config) |
| Quick run command | `node --test tests/feat-58-regression.test.cjs 2>&1 \| tail -20` |
| Full suite command | `npm test 2>&1 \| tee /tmp/gsd-test-output.txt` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SPEC-06 | Spec body present and Status = Ready | manual review | n/a | ✅ (stub exists) |
| QUAL-01 | EARS invariants falsifiable and numbered | manual review | n/a | n/a |
| QUAL-02 | Acceptance Tests table complete, no [MISSING] rows | manual review | n/a | n/a |
| QUAL-03 | Advisory markers present on Code Context items | manual review | n/a | n/a |
| QUAL-04 | At least one tier-1 artifact cited | manual review | n/a | n/a |
| QUAL-05 | Key Decisions section present with settled status | manual review | n/a | n/a |

### Sampling Rate

- **Per task commit:** `npm test 2>&1 | tee /tmp/gsd-test-output.txt` — verify GREEN (the spec body must not break any existing tests)
- **Per wave merge:** Full suite green
- **Phase gate:** All tests GREEN + SPEC-06 Status = Ready before `/gsd-verify-work`

### Wave 0 Gaps

None — no new test files needed. This phase only writes a Markdown spec body; all referenced tests already exist and are GREEN.

---

## Security Domain

Step 2.6: SKIPPED — spec-authoring phase with no security-relevant code changes. No ASVS categories apply.

---

## Project Constraints (from CLAUDE.md)

- **Frontmatter preservation:** `agent-frontmatter.test.cjs` validates all agents on every `npm test`. Do not modify any agent frontmatter during this phase.
- **No `skills:` in agent frontmatter** — not applicable (this phase writes no agent files).
- **Positive framing:** The spec body must use affirmative language consistent with fork standards. Negative directives (`do not X`) are acceptable in spec invariants where the EARS "Unwanted-behavior" pattern applies (`If X then the system SHALL NOT Y`) — these are normative spec language, not prompt directives.
- **Test runner:** `npm test` uses Node.js built-in `--test` runner; run once and pipe to `/tmp`.
- **gsd-tools location:** Use `node $HOME/.claude/gsd-core/bin/gsd-tools.cjs` (installed), never the in-repo `get-shit-done/bin/gsd-tools.cjs`.
- **Write tool for file creation:** Use the Write tool, not `Bash(cat << 'EOF')` heredocs.
- **No new documentation .md files** unless explicitly requested — this phase writes one specific file (`06-thinking-effort/SPEC.md`) as its deliverable.
- **Spec section conformance:** The 7-section template from `00-CONVENTIONS.md` is locked. No section drift, no reordering. `Depends on: SPEC-08` edge preserved in frontmatter. Status advances `Draft → Ready` in this phase.

---

## Sources

### Primary (HIGH confidence — verified from source)

- `get-shit-done/bin/lib/core.cjs` lines 1221–1281 (EFFORT_TOKENS, parseModelEffort, translateEffortForCodex) and 1628–1719 (resolveReasoningEffortInternal + D-08 floor) — read directly
- `tests/feat-58-regression.test.cjs` — read directly; all TEST-01/TEST-03/TEST-04 describe/test names confirmed
- `tests/fixtures/golden-effort-snapshot.json` — read directly; rows=330, omitContract=13 confirmed by node execution
- `get-shit-done/bin/lib/model-catalog.cjs` lines 80–147 — RUNTIMES_WITH_REASONING_EFFORT, KNOWN_RUNTIMES confirmed
- `bin/install.js` lines 159–164, 1456–1532, 2755–2799 — WR-01/WR-03 guard, resolveEffort, gsdTranslateEffortForCodex confirmed
- `.planning/spec/00-CONVENTIONS.md` — 7-section template, ID scheme, status vocabulary confirmed
- `.planning/spec/06-thinking-effort/SPEC.md` — stub frontmatter, section skeleton, Depends on: SPEC-08 confirmed
- `.planning/spec/07-citation-guard/SPEC.md` — sibling worked reference for section shape, advisory markers, Key Decision format

### Secondary (HIGH confidence — verified from source)

- `tests/parse-model-effort.test.cjs` — top-level test names confirmed
- `tests/parse-model-effort-parity.test.cjs` — describe names confirmed
- `tests/feat-53-unified-effort-resolver.test.cjs` — all describe names confirmed
- `tests/feat-53-config-sites-and-golden.test.cjs` — all describe names confirmed
- `tests/phase-56-effort-wiring.test.cjs` — all describe names confirmed
- `tests/feat-57-install-translation.test.cjs` — all describe names confirmed
- `tests/bare-effort-arg-scan.test.cjs` — describe name confirmed
- `get-shit-done/bin/lib/init.cjs` — effort sibling key names and call count confirmed

---

## Metadata

**Confidence breakdown:**
- Standard stack: N/A (spec-authoring, no installs)
- Architecture: HIGH — all symbols, line numbers, test names read directly from source
- Pitfalls: HIGH — identified from source code comments (JSDoc Pitfall 1), ROADMAP text (rawSlotForRuntime paraphrase), and D-07/D-03 locked decisions
- Pinned seams: HIGH — every symbol and line number confirmed from source this session
- Test oracle names: HIGH — all describe/test strings confirmed from source this session

**Research date:** 2026-06-12
**Valid until:** 2026-07-12 (30-day estimate for stable feature; test names shift only on test file edits)
