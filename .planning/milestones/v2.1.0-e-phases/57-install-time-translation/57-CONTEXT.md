# Phase 57: Install-Time Translation - Context

**Gathered:** 2026-06-05
**Status:** Ready for planning
**Milestone:** v2.1.0-e Per-Agent Thinking Effort

<domain>
## Phase Boundary

Phase 57 makes `bin/install.js` materialize per-agent effort correctly **per runtime at install time**, translating canonical Claude-form effort → Codex `model_reasoning_effort` **only at the Codex emit boundary** (`generateCodexAgentToml`, install.js ~2740–2750). The runtime-agnostic resolver stays effort-format-neutral (Claude form: `low|medium|high|max`).

**Why the installer needs effort resolution at all:** Codex `spawn_agent` has **no inline `model`/`effort` parameter** (install.js:2643 — "omit"). Codex reads model + `model_reasoning_effort` from the per-agent `.toml` the installer writes. That static TOML is Codex's *only* effort surface — there is no runtime spawn-arg carrier to fall back on (unlike Claude, where Phase 56 wired effort into the live `Agent()` call). So for Codex, effort can only be materialized at install time, inside install.js.

**In scope:**
- Source per-agent canonical effort at install from the **core resolver** (single source of truth) — same floored, allowlist-gated, haiku-excluded path the SDK uses.
- Translate `max`→`xhigh` for opus/sonnet tiers via a shared `translateEffortForCodex` helper, invoked only at the Codex TOML emit.
- Enforce the omit guard: 8 non-effort runtimes emit zero effort; bare `{claude,codex}` emit `medium` (Phase 56 D-08 floor); **haiku-tier always omits** (new, see D-03).

**Out of scope:**
- Claude install path — Codex-emit-only change (D-04). Claude effort is carried by Phase 56 spawn templates, resolved live at spawn; install.js does nothing Claude-side.
- Spawn-template wiring (Phase 56, done); regression re-baseline (Phase 58).
</domain>

<decisions>
## Implementation Decisions

### Effort sourcing at install (INSTALL-01)
- **D-01:** `install.js` obtains per-agent canonical effort by **reusing the core resolver** (`resolveReasoningEffortInternal` / `resolveTierEntry` in `core.cjs`), the same path the SDK uses — including the Phase 56 medium floor, the `{claude,codex}` allowlist gate, and the haiku exclusion (D-03). One source of truth; install translates to Codex form only at the emit boundary. Reading catalog slots locally via `resolveTierEntry` to re-derive effort was rejected — it re-implements the floor/allowlist and risks the SDK-vs-install divergence Phase 56 called out.

### Codex translation shape (INSTALL-01)
- **D-02:** The `max`→`xhigh` translation lives in a **shared `translateEffortForCodex(effort)` helper in `core.cjs`**, invoked only at the Codex TOML emit in install.js. Resolver stays Claude-form-neutral; translation is one small unit-testable function. Inlining at the emit site was rejected (not independently testable, not reusable). Because haiku is already `null` from the resolver (D-03), this helper only ever sees opus/sonnet effort.

### Haiku tier — effort unsupported (INSTALL-02; refines Phase 56 D-08)
- **D-03:** **Haiku supports no effort values at all.** The exclusion is **tier-based**: any slot resolving to the **haiku tier omits effort entirely on every runtime**, and there is **no `medium` floor for haiku** — a bare haiku slot stays `null`, it does not floor to `medium`. This **overrides Phase 56 D-08's floor** for haiku-tier slots (D-08's floor was runtime-gated by `{claude,codex}` but not tier-gated). Since D-01 makes the core resolver the single source of truth, both the haiku omit and the floor exclusion live **in the resolver** — so by the time the Codex boundary sees a value, haiku is already `null`. The ROADMAP's "haiku tier never `xhigh`" is a weaker statement of this real rule (haiku omits, full stop).

### Claude-side materialization (INSTALL-02)
- **D-04:** **Codex-emit-only.** install.js changes are confined to the Codex TOML emit. "Claude effort preserved" means the resolver passes Claude-form effort through unchanged and the Phase 56 spawn templates carry it (resolved live at spawn); install.js does nothing on the Claude install path.

### Claude's Discretion
- Exact name/signature/registration of `translateEffortForCodex` (intended name; confirm against core.cjs export conventions).
- Precise wiring point inside `generateCodexAgentToml` (the existing `entry.reasoning_effort` block at install.js:2748–2749 is the natural seam — it currently sources from `RUNTIME_PROFILE_MAP` per-tier; Phase 57 redirects the source to the floored core resolver and routes the value through `translateEffortForCodex`).
- How the haiku tier is detected in the resolver (alias `haiku` vs the bare-tier lookup already present in `resolveTierEntry`).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### ⚠ Locked artifacts this phase refines — flag, do not silently diverge
- `.planning/phases/56-spawn-template-wiring/56-CONTEXT.md` §D-08 — the medium floor is **runtime-gated** (`{claude,codex}`) but **not tier-gated**. Phase 57 D-03 adds a **haiku-tier exclusion to the floor itself** (bare haiku → `null`, never `medium`). This is a refinement Phase 56 did not capture; planner must apply it in the core resolver where the floor lives.
- `.planning/ROADMAP.md` §Phase 57 — Success Criterion 2 says "haiku tier never `xhigh`"; the real locked rule (D-03) is stronger: haiku omits effort entirely. Criterion 3's `medium` floor for bare `{claude,codex}` excludes haiku.

### Requirements & Roadmap (locked)
- `.planning/REQUIREMENTS.md` — INSTALL-01, INSTALL-02 (lines ~55–56)
- `.planning/ROADMAP.md` §"Phase 57: Install-Time Translation" — goal, depends-on (Phase 53; parallel after 54), 3 success criteria

### Prior phase decisions (carry forward)
- `.planning/phases/53-unified-effort-resolver/53-CONTEXT.md` — precedence chain, `{claude,codex}` allowlist gate, `max` verbatim on Claude / clamp at Codex emit boundary.
- `.planning/phases/54-sdk-tools-json-exposure/54-CONTEXT.md` — `effort` canonical field name + explicit-null contract.
- `.planning/phases/56-spawn-template-wiring/56-CONTEXT.md` — D-08 medium floor, allowlist gate, the live-spawn carrier (Claude path); the floor location decision (core resolver).

### Source / templates to modify
- `bin/install.js` — `generateCodexAgentToml` (~2719–2761), the `entry.reasoning_effort` emit at ~2748–2749; `readGsdRuntimeProfileResolver` (~1449–1512) and `gsdResolveTierEntry` import (~161).
- `get-shit-done/bin/lib/core.cjs` — `resolveReasoningEffortInternal`, `resolveTierEntry` (~1295), `parseModelEffort` (~1242): add haiku exclusion to the floor; add `translateEffortForCodex` + export (~2080).

### Fork quality gates that MUST stay green
- `tests/agent-frontmatter.test.cjs`, negative-framing, step-numbering, cross-file-refs — preserved (this phase touches `.js`/`.cjs` only, no prompt-content renumbering).
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `resolveTierEntry({runtime, tier, overrides})` (core.cjs:1295) — shared by core.cjs and install.js; already strips `;effort` and field-merges built-in + user overrides. The hook point for the haiku exclusion + canonical effort sourcing.
- `readGsdRuntimeProfileResolver(targetDir)` (install.js:1449) — returns `{ runtime, resolve(agentName) -> { model, reasoning_effort? } }`; the install-side resolver wrapper to redirect through the core floored path.
- `generateCodexAgentToml(...)` (install.js:2719) — the single Codex per-agent TOML writer; the **only** Codex effort emit site (`model_reasoning_effort`, line 2749).

### Established Patterns
- Codex carries model + effort via static `.toml` (no inline spawn args) — install-time materialization is mandatory for Codex, optional/absent for inline-arg runtimes like Claude.
- `--raw` queries / resolver helpers emit Claude-form tokens; Codex-form translation is a boundary concern (max→xhigh), kept out of the neutral resolver.

### Integration Points
- The `entry.reasoning_effort` conditional (install.js:2748–2749) currently sources from `RUNTIME_PROFILE_MAP` per-tier — the milestone overrides this with the canonical catalog-slot effort (floored, haiku-excluded), translated via `translateEffortForCodex`.
</code_context>

<specifics>
## Specific Ideas

- User clarification (load-bearing): **haiku supports no effort values at all** — drove D-03's tier-based exclusion and the floor override. Not "clamp xhigh to high"; omit entirely.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.
</deferred>

---

*Phase: 57-install-time-translation*
*Context gathered: 2026-06-05*
