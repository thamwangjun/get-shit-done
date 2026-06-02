# Phase 54: SDK & Tools JSON Exposure - Research

**Researched:** 2026-06-02
**Domain:** JSON-exposure plumbing — surfacing Phase 53's resolved effort in init/resolve-model JSON, SDK↔CLI parity
**Confidence:** HIGH (all cited line numbers validated against live code; bare-catalog inertness confirmed by execution)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (LOCKED):** Effort fields are **always present with explicit `null`** on a bare catalog — NOT omitted. Every `*_model` gets a visible `*_effort` sibling; `cmdResolveModel`/agent-skills always emit a canonical `effort` field (value `null` when unresolved). Uniform self-documenting contract — consumers never distinguish "absent" from "null."
- **D-02 (consequence, accepted):** Explicit-null **adds new keys** to bare-catalog init/resolve JSON. Additive (no existing value changes) but NOT byte-identical to pre-change JSON. **Phase 58 note:** the "additive-only" golden assertion must compare existing-field *values* and treat new `null` effort siblings as an additive superset — NOT whole-JSON byte-equality.
- **D-03:** Change `cmdResolveModel` (`commands.cjs:250`) from omit-when-falsy (`if (reasoningEffort) result.reasoning_effort = ...`) to always-emit (`result.effort = reasoningEffort ?? null`).
- **D-04 (LOCKED):** Canonical field name is **`effort`**. In `cmdResolveModel`/agent-skills the field is `effort`; in init context objects the siblings are `<role>_effort` (replace `_model` suffix with `_effort`, e.g. `executor_model` → `executor_effort`).
- **D-05:** **Rename** existing `reasoning_effort` → `effort` in `cmdResolveModel` output. Verified safe (no GSD consumer reads it; Codex install path resolves its own). No dual emission / alias.
- **D-06 (LOCKED):** **Blanket coverage** — every `*_model` field in every init builder gets a `*_effort` sibling, derived from the **same agent** via `resolveReasoningEffortInternal` (same-slot invariant, avoids #3023).
- **D-07 (LOCKED):** **Port the minimal effort-resolution logic into the SDK** (`config-query.ts` `resolveModel` + init handlers) so the SDK emits identical `effort`/`*_effort` to the CLI.
- **D-08:** **Reuse the existing read-only golden parity harness** — extend it to cover the new effort fields. A dedicated effort-parity fixture is only a fallback if the golden harness cannot cover the `resolve-model` surface.

### Claude's Discretion
- Exact internal structure of the SDK effort-resolver port, helper extraction, and where `?? null` defaulting lives — provided D-01/D-03 (explicit-null), D-04/D-05 (naming+rename), D-06 (blanket coverage), D-07/D-08 (byte-identical shapes) all hold.

### Deferred Ideas (OUT OF SCOPE)
- Catalog schema widening + user hand-assignment — Phase 55 (CATALOG-01..03).
- Spawn-template wiring / Codex install translation — Phase 56/57 (SPAWN-*, INSTALL-*).
- Milestone-wide regression suite — Phase 58 (TEST-*).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXPOSE-01 | Init JSON exposes a `*_effort` sibling for every resolved `*_model` field | All 21 `*_model` sites located in `init.cjs` (table below); each pairs 1:1 with `resolveReasoningEffortInternal(cwd, <same agent>)` |
| EXPOSE-02 | `cmdResolveModel`/agent-skills output includes a canonical resolved `effort` field | `cmdResolveModel` confirmed at `commands.cjs:236-252`; the rename+always-emit edit is mechanical. **Open question:** `cmdAgentSkills` emits a raw text block, not JSON — see Open Questions Q1 |
| EXPOSE-03 | SDK and CLI resolution produce identical model+effort shapes | Golden harness already parity-checks `resolve-model` (row 21); init builders are NOT yet covered — see Validation Architecture |
</phase_requirements>

## Summary

Phase 54 is a low-risk, mechanical exposure layer over Phase 53's resolver. All cited file references in CONTEXT.md were validated against the live codebase and are **accurate** — no drift. The CLI side is the easy part: 21 `*_model` sites in `init.cjs` (each calling `resolveModelInternal(cwd, <agent>)`) each gain a sibling `*_effort: resolveReasoningEffortInternal(cwd, <same agent>) ?? null`, and `cmdResolveModel` flips one line from conditional `reasoning_effort` to unconditional `effort`.

The non-trivial work is **SDK parity (D-07)**. The SDK's effort surface has drifted from the CLI in a way directly relevant to this phase: `sdk/src/model-catalog.ts:64` `runtimesWithReasoningEffort()` is **data-derived** (scans `runtimeTierDefaults` for any tier carrying `reasoning_effort`) — exactly the anti-pattern Phase 53 (D-07 of phase 53) replaced in the CLI with a static `{claude, codex}` allowlist. The SDK `resolveModel` (`config-query.ts:227-314`) only emits `reasoning_effort` from the Codex `runtimeTier` branch (line 283-285); it has no per-agent-override or slot-effort path mirroring `resolveReasoningEffortInternal`. The SDK port must reconcile this allowlist and mirror the CLI precedence chain, then rename its emitted field to `effort`.

The third concern is the **parity vehicle (D-08)**. The golden harness `READ_ONLY_JSON_PARITY_ROWS` already covers `resolve-model gsd-planner` with a full `toEqual` — so EXPOSE-02/EXPOSE-03 for the resolve-model surface get parity coverage *automatically* once both sides emit `effort`. However, **no init context builder** (e.g. `init phase-op`) is in the golden rows — only `init.list-workspaces`, which emits no `*_model`. So the EXPOSE-01 init siblings have NO existing parity coverage; the planner must add an init-builder golden row or fall back to a dedicated effort-parity fixture (D-08 fallback clause).

**Primary recommendation:** Land the CLI edits first (21 init siblings + `cmdResolveModel` rename), prove inertness on a bare catalog with a unit test asserting all siblings are `null`. Then port the resolver into the SDK reconciling the data-derived → static allowlist, rename SDK `reasoning_effort` → `effort`, and extend the golden harness with at least one init-builder row to cover EXPOSE-01 parity.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Effort resolution (logic) | CLI lib (`core.cjs`) | SDK (`config-query.ts`) | `resolveReasoningEffortInternal` is the canonical resolver (Phase 53); SDK ports a mirror for parity |
| Init JSON `*_effort` siblings | CLI lib (`init.cjs`) | SDK (`handlers/init/*`) | init builders own the JSON consumed by workflows; SDK mirrors for parity |
| Canonical `effort` field | CLI lib (`commands.cjs`) | SDK (`config-query.ts`) | `cmdResolveModel` is the resolve-model surface |
| Parity verification | SDK test (`golden/`) | — | golden harness is the cross-language equality gate |
| Effort → Codex `reasoning_effort` translation | install (`bin/install.js`) | — | **OUT OF SCOPE** (Phase 56/57); install resolves its own from catalog |

## Standard Stack

No new packages. This phase edits existing CommonJS lib modules and TypeScript SDK modules. Test runners already present: Node `--test` (CLI) and `vitest` (SDK).

## Package Legitimacy Audit

Not applicable — no external packages installed by this phase.

## Architecture Patterns

### Pattern 1: Same-slot 1:1 sibling derivation (D-06 / #3023 fix)
**What:** Every `*_effort` sibling derives from the SAME agent as its adjacent `*_model`.
**Why:** Phase 52/53 established `_resolveAgentSlot` so model and effort always share one resolved slot. A sibling that resolved effort for a *different* agent would reintroduce the #3023 model/effort divergence class (PITFALLS Pitfall 3).
**Pattern (CLI, `init.cjs`):**
```js
// VERIFIED: init.cjs:197-198 (live)
executor_model:  resolveModelInternal(cwd, 'gsd-executor'),
executor_effort: resolveReasoningEffortInternal(cwd, 'gsd-executor') ?? null,  // ADD — same agent
verifier_model:  resolveModelInternal(cwd, 'gsd-verifier'),
verifier_effort: resolveReasoningEffortInternal(cwd, 'gsd-verifier') ?? null,  // ADD — same agent
```
The `?? null` is belt-and-suspenders: `resolveReasoningEffortInternal` already returns `null` on a bare catalog (verified by execution), so the coalesce only guards against an `undefined` leak. Keep it per D-01's explicit-null contract.

### Pattern 2: Always-emit with `?? null` (D-03)
**What:** `cmdResolveModel` emits `effort` unconditionally.
**Pattern (`commands.cjs:250`):**
```js
// CURRENT (VERIFIED commands.cjs:250):
if (reasoningEffort) result.reasoning_effort = reasoningEffort;
// AFTER (D-03/D-04/D-05): rename + always-emit
result.effort = reasoningEffort ?? null;
```

### Pattern 3: SDK resolver port reconciling the allowlist (D-07)
**What:** SDK must mirror `resolveReasoningEffortInternal`'s precedence chain AND switch from data-derived to static allowlist.
**Why:** `sdk/src/model-catalog.ts:64-67 runtimesWithReasoningEffort()` filters `runtimeTierDefaults` for tiers carrying `reasoning_effort` — the data-derived anti-pattern RESOLVE-01 forbids. The CLI's `RUNTIMES_WITH_REASONING_EFFORT` is now the static `{claude, codex}` set (verified by execution). For byte-identical parity the SDK allowlist must match.
**Note:** Changing `runtimesWithReasoningEffort()` affects `config-query.ts:208-210` (the Codex `reasoning_effort` delete guard). Verify that branch still behaves once the set is `{claude, codex}`.

### Anti-Patterns to Avoid
- **Different-agent effort sibling:** Never resolve effort for an agent other than the adjacent `*_model`'s agent — reintroduces #3023.
- **Conditional emit on the canonical field:** Per D-01, `effort` and `*_effort` are ALWAYS present; do not reintroduce `if (effort)`.
- **Dual emission / alias:** D-05 forbids keeping `reasoning_effort` alongside `effort`. One canonical name.
- **Data-derived SDK allowlist:** Do not leave `runtimesWithReasoningEffort()` as the parity source if it diverges from the static CLI set.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Effort resolution | A new resolver in init.cjs | `resolveReasoningEffortInternal` (core.cjs, exported) | Phase 53's canonical resolver; same-slot invariant baked in |
| SDK↔CLI equality check | A bespoke effort-diff harness | Existing `read-only-parity.integration.test.ts` `toEqual` | D-08 — reuse Phase 52 cross-language precedent |
| Slot parsing in SDK | New parser | `parseModelEffort` (sdk/src/model-catalog.ts, already mirrored) | PARSE-04 already ported it |

## Runtime State Inventory

Not applicable — this is a greenfield JSON-additive phase, not a rename/refactor. No stored data, live-service config, OS-registered state, secrets, or build artifacts carry effort field names. The only "rename" (D-05: `reasoning_effort` → `effort` in resolve-model output) is verified to have zero live consumers — `commands/`, `get-shit-done/workflows/`, `agents/` have no references, and the Codex install path (`bin/install.js:2748-2749`) resolves `reasoning_effort` from the catalog `runtimeTierDefaults` independently of `cmdResolveModel`.

## Validated `*_model` Field Inventory (EXPOSE-01 / D-06)

**All 21 sites VERIFIED against live `init.cjs` at the CONTEXT-cited line numbers — zero drift.**

| Line | Builder context (region) | `*_model` field | Agent slot (for sibling) |
|------|--------------------------|-----------------|---------------------------|
| 197 | execute-phase builder | `executor_model` | `gsd-executor` |
| 198 | execute-phase builder | `verifier_model` | `gsd-verifier` |
| 343 | plan-phase builder | `researcher_model` | `gsd-phase-researcher` |
| 344 | plan-phase builder | `planner_model` | `gsd-planner` |
| 345 | plan-phase builder | `checker_model` | `gsd-plan-checker` |
| 530 | research builder | `researcher_model` | `gsd-project-researcher` |
| 531 | research builder | `synthesizer_model` | `gsd-research-synthesizer` |
| 532 | research builder | `roadmapper_model` | `gsd-roadmapper` |
| 583 | research builder (variant) | `researcher_model` | `gsd-project-researcher` |
| 584 | research builder (variant) | `synthesizer_model` | `gsd-research-synthesizer` |
| 585 | research builder (variant) | `roadmapper_model` | `gsd-roadmapper` |
| 640 | full-pipeline builder | `planner_model` | `gsd-planner` |
| 641 | full-pipeline builder | `executor_model` | `gsd-executor` |
| 642 | full-pipeline builder | `checker_model` | `gsd-plan-checker` |
| 643 | full-pipeline builder | `verifier_model` | `gsd-verifier` |
| 762 | plan builder | `planner_model` | `gsd-planner` |
| 763 | plan builder | `checker_model` | `gsd-plan-checker` |
| 1096 | codebase-map builder | `mapper_model` | `gsd-codebase-mapper` |
| 1552 | quick builder | `executor_model` | `gsd-executor` |
| 1553 | quick builder | `planner_model` | `gsd-planner` |

Note: `init.cjs:8` already imports `resolveModelInternal` but NOT `resolveReasoningEffortInternal` — the planner must **add the import** from `./core.cjs` (the function is exported, verified at core.cjs export block). The agent slot for each sibling is the second argument of the adjacent `resolveModelInternal` call — derive mechanically, do not invent.

## SDK Mirror Inventory (D-07)

The SDK mirrors the CLI init builders in `sdk/src/handlers/init/composer.ts` and `complex.ts`. `*_model` emission sites located:

| File | Lines | Fields |
|------|-------|--------|
| `composer.ts` | 449-450 | `executor_model`, `verifier_model` |
| `composer.ts` | 556-558 | `researcher_model`, `planner_model`, `checker_model` |
| `composer.ts` | 648-650 | `researcher_model`, `synthesizer_model`, `roadmapper_model` |
| `composer.ts` | 713-716 | `planner_model`, `executor_model`, `checker_model`, `verifier_model` |
| `composer.ts` | 788-789 | `planner_model`, `checker_model` |
| `composer.ts` | 1115 | `mapper_model` |
| `complex.ts` | 317-319 | `researcher_model`, `synthesizer_model`, `roadmapper_model` |
| `complex.ts` | 492-493 | `executor_model`, `planner_model` |

Both files resolve via a local `getModelAlias(agentType, projectDir)` helper that calls `resolveModel([agentType], projectDir)` (composer.ts:43-47, complex.ts:53). The SDK port needs a parallel `getEffort(agentType, projectDir)` helper that mirrors `resolveReasoningEffortInternal` and a `*_effort` field next to each `*_model`. Planner's discretion (per CONTEXT) on whether the effort logic lives inside `config-query.ts` `resolveModel`'s return or a new exported helper.

## Common Pitfalls

### Pitfall 1: SDK allowlist divergence breaks parity silently
**What goes wrong:** The SDK keeps `runtimesWithReasoningEffort()` (data-derived) as its gate while the CLI uses static `{claude, codex}`. On a catalog where `runtimeTierDefaults` happens to carry `reasoning_effort` only for some runtimes, the two sets differ and parity fails — or worse, passes on the bare catalog and fails only after Phase 55 assigns efforts.
**How to avoid:** Switch the SDK to the same static `{claude, codex}` set (or a single shared constant). The golden `resolve-model` parity row will catch divergence once both emit `effort`.
**Warning sign:** `toEqual` parity green on bare catalog but red after a `;effort` suffix appears.

### Pitfall 2: #3023 model/effort divergence via wrong agent slot
**What goes wrong:** Copy-paste error assigns `executor_effort` the effort of `gsd-verifier`.
**How to avoid:** Sibling's agent arg MUST equal the adjacent `*_model`'s agent arg. The inventory table above is the canonical mapping.
**Warning sign:** A unit test resolving model and effort for the same agent yields mismatched tiers.

### Pitfall 3: agent-skills surface ambiguity (EXPOSE-02)
**What goes wrong:** Adding `effort` to `cmdAgentSkills` — but it emits a raw `<agent_skills>` TEXT block (`init.cjs:1829`, `1836-1850`), not JSON. There is no model field there to pair with.
**How to avoid:** Treat the resolve-model JSON surface (`cmdResolveModel`) as the EXPOSE-02 target (CONTEXT explicitly offers "the resolve-model surface" as the location). Do NOT inject `effort` into the text block. See Open Questions Q1 — confirm with planner before touching `cmdAgentSkills`.

### Pitfall 4: Phase 58 snapshot assumes byte-equality (D-02)
**What goes wrong:** A future golden-snapshot test asserts whole-JSON byte-equality against a pre-milestone snapshot and fails on the new `null` keys.
**How to avoid:** This is a Phase 58 concern, but document the additive-superset contract now (already in D-02). Any snapshot written in THIS phase must compare existing-field values + treat effort siblings as additive.

## Code Examples

### Verifying inertness on a bare catalog (SC#4 proof)
```js
// Unit test pattern — proves the exposure layer is inert until Phase 55.
// VERIFIED behavior: on this repo's bare catalog, resolveReasoningEffortInternal
// returns null for every agent.
const core = require('./get-shit-done/bin/lib/core.cjs');
for (const agent of ['gsd-executor','gsd-verifier','gsd-planner','gsd-plan-checker',
                      'gsd-phase-researcher','gsd-project-researcher',
                      'gsd-research-synthesizer','gsd-roadmapper','gsd-codebase-mapper']) {
  assert.strictEqual(core.resolveReasoningEffortInternal(cwd, agent), null);
}
// => every *_effort sibling resolves to null; no *_model value changes.
```

### resolve-model parity is already wired (D-08, EXPOSE-03)
```ts
// VERIFIED: sdk/src/golden/read-only-golden-rows.ts:21
{ canonical: 'resolve-model', sdkArgs: ['gsd-planner'], cjs: 'resolve-model', cjsArgs: ['gsd-planner'] },
// read-only-parity.integration.test.ts:26 does expect(sdkResult.data).toEqual(gsdOutput)
// => once BOTH sides emit `effort: null`, this row enforces EXPOSE-02/03 for resolve-model
//    with no new test code. If only one side emits, the row goes red — a useful tripwire.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CLI data-derived `RUNTIMES_WITH_REASONING_EFFORT` | Static `{claude, codex}` allowlist | Phase 53 (RESOLVE-01) | CLI done; SDK still data-derived — the D-07 drift to fix |
| `cmdResolveModel` conditional `reasoning_effort` | Unconditional `effort: x ?? null` | This phase (D-03) | Additive new key |

**Deprecated/outdated in scope of this phase:**
- SDK `runtimesWithReasoningEffort()` data-derived set — should be reconciled to the static allowlist for parity (not yet done).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | EXPOSE-02 targets the `cmdResolveModel` JSON surface, not the `cmdAgentSkills` text block | Pitfall 3 / Open Q1 | If the user intends a JSON agent-skills surface, additional plumbing is needed; the text block has no model field to pair with |
| A2 | The SDK init builders in `composer.ts`/`complex.ts` are the only SDK init `*_model` sites needing siblings | SDK Mirror Inventory | A missed builder would fail init-builder parity (if such a golden row is added) |

## Open Questions

1. **EXPOSE-02 surface: resolve-model JSON vs agent-skills text block?**
   - What we know: `cmdAgentSkills` (`init.cjs:1836-1850`) emits a raw `<agent_skills>` text block via `process.stdout.write` — no JSON, no model field. `cmdResolveModel` emits `{ model, profile, ... }` JSON. CONTEXT lists "the resolve-model surface" as a valid EXPOSE-02 location.
   - What's unclear: Whether the user wants `effort` exposed in any agent-skills output at all, or whether "agent-skills output" in the requirement is shorthand for the resolve-model JSON that workflows pair with skills.
   - Recommendation: Plan EXPOSE-02 against `cmdResolveModel` JSON (mechanical, parity already wired). Flag to user/discuss-phase before touching `cmdAgentSkills`.

2. **Init-builder parity coverage (EXPOSE-01 / D-08).**
   - What we know: The golden rows cover `resolve-model` and `init.list-workspaces` only. No init context builder that emits `*_model` is in `READ_ONLY_JSON_PARITY_ROWS`. So `*_effort` siblings have NO existing parity coverage.
   - What's unclear: Whether to add a new golden row for an init builder (e.g. an `init` family command with deterministic args) or use the D-08 fallback dedicated effort-parity fixture. Init builders carry volatile fields (timestamps, branch names) — see `init-golden-normalize.ts` `INIT_QUICK_VOLATILE_KEYS` — so a new row likely needs a normalize/strip step.
   - Recommendation: Prefer extending the harness with one init-builder row + a strip for volatile keys (reuse `omitInitQuickVolatile` pattern). Fall back to a dedicated fixture only if no init builder can be invoked deterministically in-process.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | CLI lib + tests | ✓ | >=22 (root) / >=20 (SDK) | — |
| vitest | SDK golden parity test | ✓ (sdk devDep) | per sdk/package.json | — |
| tsc | SDK compile | ✓ | 5.7 | — |

No external services. Purely code/test changes.

## Validation Architecture

> nyquist_validation is enabled (not set to false). Section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework (CLI) | Node built-in `--test` runner |
| Framework (SDK) | vitest |
| Config file | none for CLI (`npm test`); vitest config in `sdk/` |
| Quick run command | `node --test tests/commands.test.cjs tests/core.test.cjs` |
| Full suite command | `npm test` (CLI) + SDK vitest run |

### Success Criteria → Test Map
| SC / Req | Behavior | Test Type | Automated Command | Exists? |
|----------|----------|-----------|-------------------|---------|
| EXPOSE-01 / SC#1 | Every `*_model` in init JSON has a `*_effort` sibling | unit | assert each init builder's output object has matching `*_effort` keys (1:1 with `*_model`) | ❌ Wave 0 |
| EXPOSE-02 / SC#2 | `cmdResolveModel` emits canonical `effort` (always present) | unit | `node get-shit-done/bin/gsd-tools.cjs resolve-model gsd-planner` → assert `effort` key present | ❌ Wave 0 |
| EXPOSE-03 / SC#3 | SDK and CLI emit identical model+effort shapes | integration (parity) | `read-only-parity.integration.test.ts` `resolve-model` row `toEqual` + NEW init-builder row | ⚠️ partial (resolve-model covered; init not) |
| SC#4 (inertness) | Bare catalog → every effort value `null`, no `*_model` value change | unit | loop `resolveReasoningEffortInternal` over all 9 agents, assert `null`; snapshot `*_model` values unchanged | ❌ Wave 0 |
| D-05 (rename safety) | No live consumer of `reasoning_effort` from resolve-model | static | grep `commands/ get-shit-done/workflows/ agents/` → 0 refs (VERIFIED this session) | ✓ (manual, re-assert) |

### What the parity test asserts
- `resolve-model gsd-planner`: SDK `resolveModel` data `toEqual` CLI `cmdResolveModel` output — including the new `effort` key. Both must emit `effort: null` on a bare catalog. **This row is the EXPOSE-02 + EXPOSE-03 enforcement for the resolve-model surface, already present (no new test code).**
- NEW init-builder row (to be added): SDK init handler output `toEqual` CLI `init` output after stripping volatile keys — enforces EXPOSE-01 parity for `*_effort` siblings.

### Proving additive-only / inert-on-bare-catalog (SC#4 + D-02)
- **Additive proof:** Capture pre-change `*_model` values for a representative builder; after the change, assert those same keys have identical values AND new `*_effort` keys are all `null`. This is the additive-superset assertion D-02 mandates — NOT byte-equality.
- **Inertness proof:** The unit loop over all 9 agent slots returning `null` (verified live this session) proves the exposure layer is a no-op until Phase 55 assigns `;effort` suffixes.

### Sampling Rate
- **Per task commit:** `node --test tests/commands.test.cjs tests/core.test.cjs tests/init.test.cjs`
- **Per wave merge:** full `npm test` + SDK vitest (`read-only-parity.integration.test.ts`)
- **Phase gate:** Full suite green; golden parity green; ≥70% line coverage on `get-shit-done/bin/lib/*.cjs` maintained (CLAUDE.md / TEST-05).

### Wave 0 Gaps
- [ ] Unit test: init builders emit `*_effort` sibling per `*_model` (EXPOSE-01) — likely `tests/init.test.cjs`
- [ ] Unit test: `cmdResolveModel` always emits `effort` key (EXPOSE-02) — `tests/commands.test.cjs`
- [ ] Unit test: bare-catalog inertness loop over 9 agents (SC#4) — `tests/core.test.cjs` or `tests/commands.test.cjs`
- [ ] Golden row: init context builder added to `READ_ONLY_JSON_PARITY_ROWS` + volatile-key strip (EXPOSE-03 for init siblings) — `sdk/src/golden/`
- [ ] Re-assert D-05 grep (no `reasoning_effort` consumer) as a guard test or documented manual check

## Project Constraints (from CLAUDE.md)

- **CommonJS only** in `get-shit-done/bin/lib/*.cjs` and tests (`require`/`module.exports`). SDK is TypeScript (ES2022).
- **≥70% line coverage** on `get-shit-done/bin/lib/*.cjs` (c8) — new branches need test coverage (TEST-05).
- **Positive framing:** any new comments/docs state correct behavior affirmatively, not "do not X."
- **Frontmatter preserved exactly** — N/A here (no agent files edited), but if any agent/workflow `.md` is touched, `agent-frontmatter.test.cjs` must stay green.
- **No `skills:` in agent frontmatter** — N/A.
- **Function design:** `cwd` first param, `raw` (output-format boolean) last on CLI-facing functions — follow when adding helpers.
- **Run tests efficiently:** `npm test 2>&1 | tee /tmp/gsd-test-output.txt`, then read the file.
- **GSD workflow required:** all edits go through a GSD workflow (this is research only).

## Security Domain

> `security_enforcement` not configured `false` — section included, scoped to this phase.

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V5 Input Validation | minimal | Effort tokens already validated by `parseModelEffort` against `EFFORT_TOKENS` (Phase 52); this phase adds no new untrusted input parsing |
| V6 Cryptography | no | — |
| V2/V3/V4 (auth/session/access) | no | — |

No new threat surface: this phase emits already-resolved values into JSON. The only injected data (`effort` strings) is constrained to `{low, medium, high, xhigh, max}` or `null` by the upstream resolver. No shell interpolation of effort values occurs (the `;effort` combined form never reaches a raw shell — REQUIREMENTS.md delimiter note).

## Sources

### Primary (HIGH confidence — verified this session)
- `get-shit-done/bin/lib/init.cjs:8,197-198,343-345,530-532,583-585,640-643,762-763,1096,1552-1553,1836-1850` — all `*_model` sites + agent-skills text block (read)
- `get-shit-done/bin/lib/commands.cjs:236-252` — `cmdResolveModel` current logic (read)
- `get-shit-done/bin/lib/core.cjs:1596-1635` + export block — `resolveReasoningEffortInternal`, `RUNTIMES_WITH_REASONING_EFFORT` exported (read)
- `sdk/src/query/config-query.ts:174-314` — SDK `resolveModel`, `resolveRuntimeTier`, data-derived gate usage (read)
- `sdk/src/model-catalog.ts:64-67` — `runtimesWithReasoningEffort()` data-derived set (read)
- `sdk/src/handlers/init/composer.ts`, `complex.ts` — SDK init `*_model` sites (read)
- `sdk/src/golden/read-only-parity.integration.test.ts`, `init-golden-normalize.ts`, `read-only-golden-rows.ts` — parity harness + rows (read)
- `bin/install.js:2743-2749` — Codex install resolves own `reasoning_effort` independently (confirms D-05 rename safe)
- **Execution:** `resolve-model gsd-planner` emits no effort field today; `resolveReasoningEffortInternal` returns `null` for all agents; CLI allowlist is `['claude','codex']` (run this session)

### Secondary
- CONTEXT.md (D-01..D-08), REQUIREMENTS.md (EXPOSE-01..03), Phase 53 CONTEXT (resolver decisions)

## Metadata

**Confidence breakdown:**
- Field inventory / line numbers: HIGH — every cited line validated against live code, zero drift
- CLI edits: HIGH — mechanical, behavior confirmed by execution
- SDK port: MEDIUM-HIGH — drift identified (data-derived vs static allowlist) but exact port structure is Claude's discretion
- Parity vehicle: HIGH for resolve-model (row exists); MEDIUM for init siblings (no row yet — fallback path documented)

**Research date:** 2026-06-02
**Valid until:** ~2026-07-02 (stable internal codebase; revalidate line numbers if init.cjs/config-query.ts churn before planning)
