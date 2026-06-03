# Requirements: GSD — Per-Agent Thinking Effort (v2.1.0-e)

**Defined:** 2026-05-31
**Core Value:** Every agent, command, and workflow file on `main` meets the fork's prompt engineering quality bar before it ships.

## v1 Requirements

Requirements for milestone v2.1.0-e. Each maps to a roadmap phase. The work is **purely additive** — extending existing functions in `core.cjs` and the catalog JSON; bare configs must resolve identically to today.

> **Delimiter decision (2026-05-31):** The effort suffix is joined to the model with a semicolon — `model;effort` (e.g. `opus;high`), **not** a colon. The `;` is chosen so provider IDs that legitimately contain colons (e.g. `openrouter:anthropic/claude-opus`, `bedrock:us.anthropic...`) are never ambiguous: no colon is ever treated as an effort delimiter. The combined `model;effort` string lives only in catalog JSON / config and is parsed immediately into separate fields, so it never reaches a raw shell where `;` is special (planner to verify).

### Parser & Slot Resolution

- [x] **PARSE-01**: `parseModelEffort(slot)` splits a `model;effort` string on `lastIndexOf(';')` and strips the suffix only when it is an exact member of `{low, medium, high, xhigh, max}`. When a `;` is present but the suffix is NOT a valid token (a typo like `opus;hihg`), the parser strips to the base model (`opus`), returns `effort: null`, and emits a one-time typo warning — a non-token suffix after `;` is unambiguously a malformed effort, never a provider ID. A string with no `;` returns the whole string as the model with `effort: null`.
- [x] **PARSE-02**: `parseModelEffort` returns `{ model, effort: null }` for bare model strings with no recognized effort suffix (backward-compatible omit)
- [x] **PARSE-03**: A shared `_resolveAgentSlot(cwd, agentType)` helper returns the single raw slot string so model and effort always derive from the same resolved tier entry (structurally eliminates the #3023 model/effort divergence class)
- [x] **PARSE-04**: `parseModelEffort` is exported from the JS lib and mirrored in `sdk/src/model-catalog.ts` with identical semantics

### Effort Resolution

- [x] **RESOLVE-01**: The effort resolver emits effort for the `claude` runtime — the Claude gate is lifted via an explicit `{claude, codex}` allowlist, never a data-derived "any tier carrying reasoning_effort" set
- [x] **RESOLVE-02**: Effort resolution follows the same precedence chain as model: per-agent override → phase-type slot → profile slot → adaptiveTierMap → omit
- [x] **RESOLVE-03**: Profile-slot effort overrides Codex `runtimeTierDefaults.codex.reasoning_effort`; the per-tier Codex value is used only as fallback when the resolved slot carries no effort suffix
- [x] **RESOLVE-04**: `max` effort maps to `xhigh` when emitted for Codex, and `xhigh` is never emitted for the Codex haiku tier (`gpt-5.4-mini`)
- [x] **RESOLVE-05**: Runtimes outside the `{claude, codex}` allowlist always omit effort (hard no-op for the 8 null-tier runtimes)
- [x] **RESOLVE-06**: The `inherit` profile and bare adaptive entries omit effort

### Config Overrides

- [x] **CONFIG-01**: `model_overrides.<agent>` accepts the `model;effort` form, parsed via `parseModelEffort` (bare fully-qualified IDs still omit effort)
- [x] **CONFIG-02**: `models.<phase-type>` accepts the `model;effort` form
- [x] **CONFIG-03**: `model_profile_overrides.<runtime>` accepts the `model;effort` form (string shorthand or entry object)
- [x] **CONFIG-04**: Config validation rejects/warns on malformed effort tokens (outside `{low, medium, high, xhigh, max}`), consistent with existing tier-typo handling

### Catalog Encoding

- [x] **CATALOG-01**: `model-catalog.json` profile slots (`golden`/`balanced`/`budget`) and `adaptiveTierMap` entries support inline `model;effort` labels; the schema/type widens from the fixed alias union to a string
- [x] **CATALOG-02**: Per-agent effort values are assigned across all 33 agents' slots **by the user during an execution handover** (guidance heuristic: heavy → high, light → none/low, default → medium; higher is not monotonically better)
- [x] **CATALOG-03**: `sdk/src/model-catalog.ts` mirror widened to accept `model;effort` slot strings

### SDK & Tools Exposure

- [x] **EXPOSE-01**: The init JSON exposes a `*_effort` sibling for every resolved `*_model` field consumed by workflows
- [x] **EXPOSE-02**: `cmdResolveModel` / agent-skills output includes a canonical resolved `effort` field
- [x] **EXPOSE-03**: SDK (`sdk/src/`) and CLI (`bin/lib/`) resolution produce identical model+effort shapes

### Spawn Wiring

- [ ] **SPAWN-01**: The verified Claude effort carrier — subagent frontmatter `effort:` vs an `Agent()` argument, resolved at plan time against the current Agent/Task API — is wired so resolved effort reaches spawned agents
- [ ] **SPAWN-02**: Spawn templates across `agents/`, `commands/`, and `get-shit-done/workflows/` pass effort conditionally, omitting it entirely when absent
- [ ] **SPAWN-03**: Spawn-template edits preserve the fork quality gates (agent-frontmatter, negative-framing, step-numbering, eta-include) — achieved by extending existing `model=` lines rather than renumbering steps

### Install Translation

- [ ] **INSTALL-01**: `bin/install.js` translates Claude `effort` to Codex `reasoning_effort` only at the Codex emit boundary; the runtime-agnostic resolver stays effort-format-neutral
- [ ] **INSTALL-02**: Effort materializes correctly per runtime at install time — Claude effort preserved, Codex translated, unsupported runtimes omit

### Validation & Tests

- [ ] **TEST-01**: A pre-change golden snapshot of model resolution proves the change is additive (existing bare configs resolve identically before and after)
- [ ] **TEST-02**: Parser fixtures cover effort suffixes, bare models, and colon-containing provider IDs
- [ ] **TEST-03**: Precedence and omit-contract tests per runtime (claude emits, codex translates with `max`→`xhigh`, others omit)
- [ ] **TEST-04**: Regression assertions avoid the `indexOf`-as-boolean false-pass and substring collisions on `medium`/`high`
- [ ] **TEST-05**: Full `npm test` passes with zero new regressions; ≥70% line coverage on `get-shit-done/bin/lib/*.cjs` maintained

## v2 Requirements

Acknowledged but deferred — not in this roadmap.

### Future Effort Extensions

- **NEXT-01**: Gemini `thinkingLevel` (LOW/MEDIUM/HIGH) mapping as a third effort-emitting runtime
- **NEXT-02**: A `custom_profiles` block in `config.json` for fully user-defined named profiles with per-agent `model;effort`
- **NEXT-03**: An effort-escalation axis tied to `dynamic_routing` (currently effort rides the resolved tier; no separate escalation)

## Out of Scope

| Feature | Reason |
|---------|--------|
| `custom_profiles` block | Explicitly deferred; the 5 built-in profiles plus config overrides cover this milestone |
| Effort on Gemini/OpenCode/Qwen/Copilot | Only `{claude, codex}` have a GSD-owned effort surface; others omit |
| Coupling effort to `taskBudget`/`max_tokens` | Effort is a soft signal, not a hard cap — keep them decoupled |
| Defaulting agents to `high` | Higher effort is not monotonically better; documented overthinking regressions |
| Separate effort-escalation axis in `dynamic_routing` | Effort rides the escalated tier's own slot; no parallel axis |
| Claude `thinking`/ThinkingConfig and `taskBudget` params | Set `effort` only; leave the other two spawn controls untouched |

## Traceability

Populated during roadmap creation (2026-05-31). All 30 v1 requirements mapped to phases 52–58; each requirement maps to exactly one phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PARSE-01 | Phase 52 | Complete |
| PARSE-02 | Phase 52 | Complete |
| PARSE-03 | Phase 52 | Complete |
| PARSE-04 | Phase 52 | Complete |
| RESOLVE-01 | Phase 53 | Complete |
| RESOLVE-02 | Phase 53 | Complete |
| RESOLVE-03 | Phase 53 | Complete |
| RESOLVE-04 | Phase 53 | Complete |
| RESOLVE-05 | Phase 53 | Complete |
| RESOLVE-06 | Phase 53 | Complete |
| CONFIG-01 | Phase 53 | Complete |
| CONFIG-02 | Phase 53 | Complete |
| CONFIG-03 | Phase 53 | Complete |
| CONFIG-04 | Phase 53 | Complete |
| EXPOSE-01 | Phase 54 | Complete |
| EXPOSE-02 | Phase 54 | Complete |
| EXPOSE-03 | Phase 54 | Complete |
| CATALOG-01 | Phase 55 | Complete |
| CATALOG-02 | Phase 55 (USER-HANDOVER) | Complete |
| CATALOG-03 | Phase 55 | Complete |
| SPAWN-01 | Phase 56 | Pending |
| SPAWN-02 | Phase 56 | Pending |
| SPAWN-03 | Phase 56 | Pending |
| INSTALL-01 | Phase 57 | Pending |
| INSTALL-02 | Phase 57 | Pending |
| TEST-01 | Phase 58 | Pending |
| TEST-02 | Phase 58 | Pending |
| TEST-03 | Phase 58 | Pending |
| TEST-04 | Phase 58 | Pending |
| TEST-05 | Phase 58 | Pending |

**Coverage:**

- v1 requirements: 30 total
- Mapped to phases: 30 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-31*
*Last updated: 2026-05-31 after roadmap creation (traceability populated, phases 52–58)*
