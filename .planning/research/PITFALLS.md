# Pitfalls Research

**Domain:** Adding a `model:effort` thinking-effort dimension to GSD's existing model-routing machinery (v2.1.0-e)
**Researched:** 2026-05-31
**Confidence:** HIGH (grounded in the actual source: `core.cjs`, `model-catalog.cjs`, `model-catalog.json`, `bin/install.js`, plus the documented #3023/#2517/#3030 comment trail)

> Scope note: This is a SUBSEQUENT milestone bolting one dimension onto a system with a documented bug history (#2517, #2609, #3023, #3030, #3031) and strict fork test gates. Most risk is regression risk, not greenfield risk. Each pitfall below maps to existing code the change will touch.

## Critical Pitfalls

### Pitfall 1: Naive `split(':')` shreds fully-qualified model IDs that contain colons

**What goes wrong:**
A parser like `const [model, effort] = label.split(':')` corrupts every real-world full ID that legitimately contains a colon. `model_overrides` and `model_profile_overrides` carry IDs such as `anthropic/claude-opus-4-7` and `openai/gpt-5.4` (no colon today, so they survive split by luck), but the same fields also accept provider-prefixed forms providers commonly ship: `openrouter:anthropic/claude-opus`, `bedrock:us.anthropic.claude...`, `vertex:gemini-3-pro`. A leading-colon split treats `openrouter` as the model and `anthropic/claude-opus` as the "effort". `split(':')[0]` truncates any such ID the moment it lands in `model_overrides`.

**Why it happens:**
The effort syntax `opus:medium` *looks* like a clean two-token split, and the happy-path catalog values (`opus`, `sonnet`) have no colon. The trap: the SAME field (`model_overrides.<agent>`) accepts BOTH bare tier aliases AND fully-qualified provider IDs — `resolveModelInternal` step 1 returns `config.model_overrides?.[agentType]` verbatim precisely so "users who set fully-qualified model IDs get exactly that." A colon-splitting parser breaks that contract.

**How to avoid:**
Parse effort by matching ONLY a known-effort suffix, never by splitting on the first (or any) colon:

```js
const EFFORT_TOKENS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);
function parseModelEffort(label) {
  if (typeof label !== 'string') return { model: label, effort: null };
  const idx = label.lastIndexOf(':');
  if (idx === -1) return { model: label, effort: null };
  const suffix = label.slice(idx + 1);
  if (!EFFORT_TOKENS.has(suffix)) return { model: label, effort: null }; // colon belongs to the model ID
  return { model: label.slice(0, idx), effort: suffix };
}
```

Rules: (1) split on `lastIndexOf(':')`, not the first colon; (2) strip the suffix ONLY when it is an exact member of the effort allowlist — otherwise return the whole string as the model and `effort: null`. Then `openrouter:anthropic/claude-opus` → model `openrouter:anthropic/claude-opus`, effort `null`; `opus:medium` → model `opus`, effort `medium`; `anthropic/claude-opus-4-7:high` → model `anthropic/claude-opus-4-7`, effort `high`.

**Warning signs:**
- Any `.split(':')` on a model string in `core.cjs` / `model-catalog.cjs` / `install.js`.
- A full ID like `openai/gpt-5.4` appearing truncated in init JSON or a Codex `model = "..."` TOML line.
- Tests that only assert `opus:medium` parsing and never feed a provider-prefixed colon ID.

**Phase to address:**
Parser phase (first). Add a regression test feeding `openrouter:anthropic/claude-opus`, `vertex:gemini-3-pro`, and `anthropic/claude-opus-4-7:high`, asserting model/effort split. Must land before any caller uses the parser.

---

### Pitfall 2: Effort leaks into runtimes that cannot accept it (omit-when-absent contract violated)

**What goes wrong:**
A unified parser that returns `effort` for every label causes `effort=` / `model_reasoning_effort` to be emitted for Gemini, OpenCode, Copilot, and the 8 `null`-tier runtimes (kilo, cline, cursor, windsurf, augment, trae, codebuddy, antigravity) — none of which accept a reasoning-effort field. The current `resolveReasoningEffortInternal` is gated by `RUNTIMES_WITH_REASONING_EFFORT` (derived dynamically from which catalog runtimes have a `reasoning_effort` key — today only `codex`). The milestone explicitly says "lift the Claude block." Lifting the gate without keeping a per-runtime allowlist propagates effort everywhere.

**Why it happens:**
`RUNTIMES_WITH_REASONING_EFFORT` (model-catalog.cjs lines 87–91) is computed by scanning for any tier entry with a `reasoning_effort` key. The milestone adds inline effort to Claude profile slots. The instant a Claude tier entry carries effort, the dynamic derivation adds `claude` to the set — and any Gemini/OpenCode entry that later gains effort would silently opt-in too. The gate that was a safety net becomes a leak vector once catalog data changes shape.

**How to avoid:**
- Keep an explicit, runtime-keyed capability allowlist for effort emission. Lifting "the Claude block" means *Claude becomes allowed*, NOT *all runtimes become allowed*. After the change the allowlist should be `{ claude, codex }` (the two runtimes with an effort channel); every other runtime returns `null` / omits.
- Preserve the omit contract at the emission site: emit `effort` (Agent spawn) / `model_reasoning_effort` (Codex TOML) ONLY when the resolver returns a non-null value. Mirror the existing `if (entry.reasoning_effort) { lines.push(...) }` guard at `install.js:2748` for every new emit path.
- Treat the 8 `null`-tier runtimes as hard no-ops — they have no tier entries, so resolution must short-circuit on a missing tier entry (the existing `if (!builtin && !userEntry) return null` in `resolveTierEntry` already does this; preserve it).

**Warning signs:**
- A Gemini/OpenCode install emitting any effort field.
- `RUNTIMES_WITH_REASONING_EFFORT` growing to include unintended runtimes after catalog is hand-edited.
- An `Agent()` spawn template that always renders `effort=...` instead of conditionally.

**Phase to address:**
Resolution/unification phase. Add regression tests that load a config per non-effort runtime and assert the resolver returns `null` (or omits the field) even when that runtime's tier slot carries effort.

---

### Pitfall 3: Model/effort divergence — the #3023 class re-opened by a new code path

**What goes wrong:**
`model` and `effort` resolve from *different tier sources*. The #3023 bug was exactly this: on Codex, `models.<phase_type>` overrode the model's tier but `reasoning_effort` was still derived from the profile tier, so a phase-type `opus` override produced an opus model with sonnet's effort. The fix mirrored the phase-type tier lookup in BOTH `resolveModelInternal` and `resolveReasoningEffortInternal`. A new `model:effort` path that computes effort independently (parsing it off the label in one place but resolving the model through the precedence chain in another) re-introduces divergence.

**Why it happens:**
Five tier inputs must agree: per-agent override → phase-type slot → profile → adaptive → inherit. The two resolvers already duplicate this logic with subtle differences (e.g., `resolveModelInternal` synthesizes `tier='inherit'` on phase-type `inherit`; `resolveReasoningEffortInternal` *returns null* on phase-type `inherit` at line 1492). Adding effort as a THIRD derivation widens the surface for disagreement. Inline effort in catalog slots helps (single source) only if both model and effort read the SAME resolved tier entry.

**How to avoid:**
- Resolve the tier ONCE, then read both `model` and `effort` from the SAME resolved `entry` (the `resolveTierEntry` return). The milestone's "profile-slot effort is single source of truth" is correct — enforce it by making effort a field on the resolved entry, never a separately-computed value.
- When a label carries inline effort (`opus:medium`), the parsed effort must travel WITH the parsed model through the identical precedence chain — don't parse the model in step 1 and apply effort in a later step.
- Replicate #3023/#3030 phase-type handling exactly: phase-type `inherit` opts OUT of effort (return null); a valid phase-type tier wins for BOTH model and effort. Add a test matching the #3023 fixture: `{ model_profile: 'inherit', models: { execution: 'opus' } }` must yield opus model AND opus's effort.

**Warning signs:**
- Effort computed in a function that does not also return the model.
- A test asserting model resolution but never co-asserting that effort came from the same tier.
- `models.<phase-type>` override changing the model but not the effort (or vice versa) in init JSON.

**Phase to address:**
Resolution/unification phase, immediately after the parser. Highest-severity correctness pitfall — it has already shipped as a bug once (#3023).

---

### Pitfall 4: Backward-compat regressions on bare strings, existing overrides, and existing Codex effort

**What goes wrong:**
Four concrete regressions:
1. **Bare `"opus"` configs break.** Existing `model_profile_overrides` / `model_overrides` carry bare aliases (`opus`, `sonnet`, `haiku`) and bare full IDs. If parsing assumes a colon, bare strings lose their tier or get an empty model.
2. **The 17-agent `model_overrides` mapped to bare `opus`.** `resolveModelInternal` step 1 returns these verbatim. If the new path post-processes overrides through the effort parser and reconstructs the string, a bare `opus` override could be altered.
3. **Existing Codex per-tier `reasoning_effort` silently changes.** The catalog sets Codex `opus → xhigh`, `sonnet/haiku → medium`. The milestone makes profile-slot effort override Codex per-tier effort. If profile-slot effort is added but Codex per-tier values aren't reconciled, an agent that previously got Codex `xhigh` could now get a profile effort — a behavior change for existing Codex users who never opted in.
4. **`max` → `xhigh` Codex mapping forgotten.** Effort tokens are `low/medium/high/xhigh/max`, but Codex's native enum tops out at `xhigh`. A profile slot `model:max` must map to `xhigh` on Codex emit, or Codex rejects the value.

**Why it happens:**
The system has years of accreted config shapes (string shorthand, partial-object overrides, the `resolveTierEntry` field-merge). The #2609 review already caught two silent-drop bugs in this exact merge logic. Adding a dimension that "overrides" an existing one (Codex effort) is a behavior change by definition; it's easy to ship it for new users while regressing existing ones.

**How to avoid:**
- The parser must be total over the existing input set: a bare string (alias OR full ID, with or without colon) returns `{ model: <whole string>, effort: null }`. Never reconstruct override strings — return them verbatim from step 1, parse effort as a *read-only* side channel.
- Add a precedence test: profile-slot effort beats Codex per-tier `reasoning_effort` ONLY when present; when the profile slot has no effort, Codex falls back to its catalog per-tier value (no behavior change for untouched configs).
- Add an explicit `max → xhigh` Codex mapping at the Codex emit boundary (mirror `install.js:2748`), with a test that `model:max` on Codex emits `model_reasoning_effort = "xhigh"`.
- Snapshot-test the resolved (model, effort) for all ~33 agents under `quality`/`balanced`/`budget`/`inherit` BEFORE the change; assert no model changes after — only additive effort.

**Warning signs:**
- Any existing model-resolution test changing its expected MODEL value (effort additions should be purely additive on model).
- Codex installs producing different `model_reasoning_effort` than before for a config not using the new syntax.
- A bare `opus` override producing empty model or `effort: 'pus'`-style corruption.

**Phase to address:**
Backward-compat / regression phase. Build the pre-change golden snapshot first, then assert additive-only changes.

---

### Pitfall 5: Spawn-template + install edits trip the fork's negative-framing / step-numbering / eta-include / frontmatter gates

**What goes wrong:**
The milestone edits spawn templates across `agents/`, `commands/`, `get-shit-done/workflows/` to pass `effort` to `Agent()`. Touching many prompt-content files risks four fork-specific gate failures:
1. **Negative-framing scanner (99/99).** Conditional prose like "do NOT pass effort when absent" is a negative directive the scanner flags (`must not`, `never`, `avoid`, `don't`, `prohibited`, `forbidden` are all detected).
2. **Step-numbering scanner (632/632).** Inserting a new step into a numbered workflow shifts subsequent numbers; decimal/letter-suffix/out-of-order are violations. Cross-file step refs (219/219) can go stale.
3. **Eta-include syntax.** Only `<%~ include() %>` is allowed; `{%~` is banned (`eta-template-syntax.test.cjs`). Hand-edits near include tags can introduce the banned form.
4. **`agent-frontmatter.test.cjs` (155/155).** Frontmatter shape (`name/description/tools/color/hooks`) must stay exact; no `skills:` key; file-writing agents must retain `Only use the Write tool`.

**Why it happens:**
These gates exist precisely because this fork mass-edits prompt content. The omit-when-absent contract naturally invites negative phrasing ("do not emit effort" is a violation). Inserting Agent-spawn steps invites renumbering.

**How to avoid:**
- Phrase every effort instruction affirmatively: "Pass `effort=<value>` only when the resolved effort is present; emit the `Agent()` call without an `effort` argument otherwise." Run the negative-framing scanner BEFORE editing (scanner-first precedent) to know the clean baseline, and after each batch.
- Prefer appending effort to EXISTING `model=` lines in spawn templates rather than inserting new numbered steps — avoids renumbering. Where a new step is unavoidable, run `scripts/normalize-step-numbers.cjs --dry-run` and the cross-file-ref scanner.
- Conditionally render effort with eta `<%~ %>` only; verify no `{%~` survives.
- Keep all frontmatter untouched; effort is body/spawn-call content, not frontmatter.
- Run the full gate set after every batch, not just at the end.

**Warning signs:**
- Scanner count drifting from 99/99, 632/632, 219/219, or 155/155 after a content edit.
- A diff that renumbers steps in a workflow.
- An eta `{%~` appearing in any source file.

**Phase to address:**
Spawn-template phase (after resolution is correct). Treat gate-runs as the phase's verification step.

---

### Pitfall 6: Silent test false-passes — `indexOf`-returns-truthy and substring leniency

**What goes wrong:**
A test like `assert(output.indexOf('opus:medium'))` passes whenever the substring is found at any index EXCEPT 0, and a found-at-0 match returns `0` (falsy) — wrong in BOTH directions. More broadly, loose substring checks (`output.includes('medium')`) false-pass because `medium` already appears in the catalog (Codex `sonnet`/`haiku` map to `medium`). A test meant to prove "opus got high effort" can pass on the pre-existing `medium` Codex default.

**Why it happens:**
The project already has a documented `indexOf`-returns-truthy risk (many test files use `indexOf`). Effort tokens (`medium`, `high`) are short, common substrings colliding with existing catalog values. Effort is also frequently *absent* (omit contract), and asserting absence via substring is especially error-prone.

**How to avoid:**
- Assert against parsed structure, not raw substrings: deep-equality on the resolver's returned `{ model, effort }`, or `=== 'high'` on the resolved field.
- For presence/absence, assert exact equality (`assert.strictEqual(effort, null)` for omit; `assert.strictEqual(effort, 'high')` for present) rather than `includes`.
- For emit-site tests (Codex TOML, Agent spawn), parse the emitted line and assert the field VALUE (extract `model_reasoning_effort = "xhigh"` and compare) instead of `toml.includes('xhigh')`.
- Forbid `indexOf(...)`-as-boolean in new effort tests; use `!== -1` explicitly or prefer `includes`/`strictEqual` on parsed values. Audit any copied scaffold for `indexOf` truthiness.
- Verify each new test fails RED before the implementation lands (TDD red gate is established fork precedent).

**Warning signs:**
- `if (str.indexOf(x))` or `assert(str.indexOf(x))` in any new test.
- An effort test that passes against the pre-change baseline (it should fail RED first).
- Substring assertions on `medium`/`high` that could match Codex's pre-existing defaults.

**Phase to address:**
Every phase's verification step; explicitly the regression-coverage phase. Add a meta-check rejecting `indexOf`-as-boolean in the new effort test files.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `split(':')` first-colon parser | Trivial; passes happy-path | Corrupts every colon-bearing provider ID; data-loss class bug | Never |
| Lift effort gate to "all runtimes" instead of explicit `{claude, codex}` allowlist | One fewer conditional | Effort leaks to Gemini/OpenCode/null-tier runtimes; violates omit contract | Never |
| Compute effort in a separate function from model | Smaller diff per call site | Re-opens #3023 divergence | Never |
| Substring (`includes`) assertions in tests | Fast to write | False-passes on `medium`/`high` collisions | Only for "must NOT contain a clearly-unique token" checks |
| Insert new numbered spawn steps instead of extending `model=` lines | Reads explicitly | Triggers step-renumbering + cross-file-ref churn | When a genuinely new step is required and normalizer is run |
| Hand-edit catalog effort without tolerating partial assignment | User retains control | Partially-assigned catalog crashes resolver if it assumes presence | Acceptable BY DESIGN here — plumbing MUST treat missing effort as `null`, never throw |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Codex TOML emit (`install.js:2748`) | Emitting `model_reasoning_effort` unconditionally, or passing `max` raw | Emit only when effort present; map `max → xhigh` at the Codex boundary |
| `Agent()` spawn (Claude) | Passing `effort="inherit"` or empty `effort=` | Omit the `effort` argument entirely when resolved effort is null (mirror the `model=` omit-on-inherit rule at `execute-phase.md:87`) |
| `resolveTierEntry` field-merge | Re-deriving effort outside the merge, dropping it like the #2609 silent-drop bugs | Read effort as a field of the merged entry; user-field-wins / builtin-fills-gaps applies to effort too |
| init / agent-skills JSON (`core.cjs`, `commands.cjs`, `gsd-tools.cjs`, `sdk/src/model-catalog.ts`) | Exposing `model` but forgetting `effort`, or exposing `effort` for runtimes that omit it | Expose resolved `effort` alongside `model`, `null` when absent; keep SDK + CLI shapes identical |
| `model_profile_overrides.<runtime>` accepting `model:effort` | Parsing override at write-time and storing split fields | Store verbatim; parse at resolve-time via the suffix-only parser |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-parsing the label per resolver call | Negligible at GSD scale | Parse once per resolution | Not a real concern — resolution runs per-spawn |
| Two `loadConfig(cwd)` calls per spawn (model+effort resolvers) | Already the case | Acceptable; matches existing pattern | N/A — file-based, tiny configs |

> Performance is not a meaningful axis here: resolution is per-agent-spawn over small JSON. The dominant risk is correctness, not speed.

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Allowing an arbitrary effort token through to runtime emit | Runtime rejects spawn / undefined behavior on Codex | Validate effort against `{low,medium,high,xhigh,max}` allowlist; reject malformed tokens (milestone requirement) |
| Effort gate bypassable via user override (#3 review finding) | A `runtime` typo + matching override leaks effort to a Claude/unknown install | Keep effort propagation behind the explicit runtime allowlist; overrides cannot bypass the gate (preserve `RUNTIMES_WITH_REASONING_EFFORT.has(...)` semantics) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Silent acceptance of malformed effort (`opus:meduim`) | User thinks effort applied; it silently did nothing | Validation rejects malformed effort tokens with a clear error (milestone requirement) |
| Catalog partially hand-assigned, resolver throws on missing effort | User's mid-handover catalog breaks every spawn | Treat missing effort as `null` gracefully — never assume presence (explicit milestone constraint) |
| Bare `opus` user surprised by new effort behavior | Existing project changes behavior without opt-in | Effort is additive-only; bare strings carry no effort and resolve exactly as before |

## "Looks Done But Isn't" Checklist

- [ ] **Parser:** Often missing colon-in-ID handling — verify `openrouter:anthropic/claude-opus` and `anthropic/claude-opus-4-7:high` parse correctly (model vs effort).
- [ ] **Omit contract:** Often missing the absent-effort path — verify Gemini/OpenCode/null-tier runtimes emit NO effort field even when a catalog slot carries one.
- [ ] **#3023 parity:** Often missing — verify `{ model_profile: 'inherit', models: { execution: 'opus' } }` yields opus model AND opus effort (same tier source).
- [ ] **Codex `max`:** Often missing — verify `model:max` emits `model_reasoning_effort = "xhigh"` on Codex.
- [ ] **Backward-compat:** Often missing the golden snapshot — verify all ~33 agents resolve to the SAME model as pre-change under every profile.
- [ ] **Codex per-tier override:** Often missing — verify profile-slot effort overrides Codex per-tier effort only when present; otherwise Codex catalog effort unchanged.
- [ ] **Gates:** Often missing a post-edit gate run — verify negative-framing 99/99, step-numbering 632/632, cross-file-refs 219/219, agent-frontmatter 155/155, eta-syntax all green.
- [ ] **Tests RED-first:** Often missing — verify each new effort test failed before implementation (no false-pass via `indexOf`/substring).
- [ ] **Partial catalog:** Often missing — verify resolver returns `null` (not throw) when an effort slot is unassigned mid-handover.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Colon-split corrupted IDs shipped | MEDIUM | Replace with suffix-only parser; add provider-ID regression fixtures; re-resolve overrides |
| Effort leaked to non-effort runtime | MEDIUM | Restore explicit `{claude, codex}` allowlist; add per-runtime omit tests; rebuild affected installs |
| #3023 divergence reintroduced | HIGH | Re-unify model+effort onto a single resolved tier entry; restore #3023/#3030 phase-type parity tests |
| Backward-compat model change | HIGH | Diff against pre-change golden snapshot; revert any non-additive model change; re-assert additive-only |
| Gate breakage (framing/step/eta/frontmatter) | LOW–MEDIUM | Run scanner-first to baseline, reword affirmatively, run normalizer for steps, restore frontmatter exactly |
| `indexOf` false-pass test | LOW | Convert to deep-equality / strictEqual on parsed `{model, effort}`; confirm RED-first |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Colon-in-ID parsing | Parser phase (1st) | Provider-prefixed colon ID fixtures parse model/effort correctly |
| Effort leak / omit contract | Resolution/unification phase | Per-runtime resolver returns null for non-effort runtimes |
| #3023 model/effort divergence | Resolution/unification phase | Model + effort read same resolved tier; #3023 fixture parity test |
| Backward-compat regressions | Regression phase | Pre-change all-agent golden snapshot additive-only; Codex `max→xhigh`; Codex per-tier preserved when no profile effort |
| Test-gate breakage | Spawn-template phase | negative-framing 99/99, step 632/632, xref 219/219, frontmatter 155/155, eta-syntax green |
| `indexOf` / substring false-pass | All phases' verification | New effort tests fail RED first; assertions use parsed-structure equality |

## Sources

- `get-shit-done/bin/lib/core.cjs` — `resolveModelInternal` (precedence chain, #3023/#3030 comments), `resolveReasoningEffortInternal` (lines 1454–1504, the Claude block + runtime allowlist gate), `resolveTierEntry` field-merge (#2517/#2609)
- `get-shit-done/bin/lib/model-catalog.cjs` — `RUNTIMES_WITH_REASONING_EFFORT` (dynamic derivation, lines 87–91), `MODEL_ALIAS_MAP`, `RUNTIME_PROFILE_MAP`
- `sdk/shared/model-catalog.json` — runtime tier defaults (Codex `xhigh`/`medium`; OpenCode/Hermes provider-prefixed IDs `anthropic/...`; 8 null-tier runtimes), agent profile slots
- `bin/install.js` — Codex TOML emit path (lines 2739–2752, conditional `model_reasoning_effort`), `model=` omit-on-inherit pattern
- `.planning/PROJECT.md` — milestone v2.1.0-e definition, fork test gates (99/99, 632/632, 219/219, 155/155), positive-framing + eta-include constraints
- `CLAUDE.md` — fork constraints (frontmatter exactness, no `skills:`, positive framing replacement rule, ≥70% bin/lib coverage)

---
*Pitfalls research for: per-agent `model:effort` thinking-effort dimension in GSD model machinery*
*Researched: 2026-05-31*
