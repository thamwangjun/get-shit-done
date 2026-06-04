# Phase 56: Spawn-Template Wiring - Context

**Gathered:** 2026-06-04
**Status:** Ready for planning
**Milestone:** v2.1.0-e Per-Agent Thinking Effort

<domain>
## Phase Boundary

Phase 56 wires resolved per-agent **effort** into spawn templates so it reaches spawned agents. The plumbing to *produce* effort already exists (Phase 53 resolver + Phase 54 JSON exposure); Phase 56 forwards that value into the `Agent()` spawn call at each site, alongside the existing `model=` argument.

**⚠ MILESTONE-LEVEL AMENDMENT (decided 2026-06-04, supersedes locked invariants — see D-08):**
This phase **abolishes effort omission for effort-supporting runtimes.** The earlier back-compat invariant ("bare catalog → effort `null` → zero emission → byte-identical behavior", locked in Phases 53–55) is **intentionally dropped.** The new rule: on `{claude, codex}`, an un-assigned slot **floors to `medium`** rather than omitting. Effort is therefore (almost) always present on the Claude spawn carrier.

**Residual omission (still required):** the 8 non-effort runtimes (opencode, gemini, etc. — RESOLVE-05 hard no-op) **still emit nothing** — they have no reasoning-effort concept; this is incompatibility, not preference. Explicit `inherit` slots **stay effort-free** (inherit means inherit effort too). These two are the only paths where effort is absent.

**In scope:** A `medium` floor in effort resolution gated by the `{claude, codex}` allowlist (D-08); the effort carrier wired into every spawn site that passes `model=` (SPAWN-01); a thin SDK query emitting the resolved effort token; all fork quality gates preserved by extending existing `model=` blocks rather than renumbering steps (SPAWN-03).

**Out of scope:** Codex `max`→`xhigh` translation + per-runtime install materialization (Phase 57, where the non-effort-runtime omission is enforced at the emit boundary); the regression suite, now re-baselined (Phase 58).
</domain>

<decisions>
## Implementation Decisions

### Effort carrier mechanism (SPAWN-01)
- **D-01:** The carrier is an **`Agent()` call argument, parallel to `model=`** — each spawn block gains an `effort=...` line next to its `model="{<agent>_model}"` line. Mirrors the only carrier that exists today; agents/commands carry no `model:`/`effort:` frontmatter, so frontmatter was rejected.
- **D-02 (MANDATORY plan-time verification — gates all wiring):** The in-session Agent/Task tool schema exposes a `model` override but **no `effort` parameter.** Before any spawn site is edited, research/planner MUST verify against the **live Agent/Task API** whether an `effort` argument is honored. If it is **not**, fall back to the verified carrier the API does accept rather than wiring a no-op. The locked outcome is "resolved effort reaches spawned agents"; the exact carrier is validated before wiring. This is the ROADMAP plan-time-verification item — NOT yet closed.

### Per-agent, per-site effort (SPAWN-01)
- **D-03:** Effort is **per-agent and per-spawn-site — never a single global value.** A workflow spawning three agents resolves three independent effort vars, each possibly different. Naming convention `{<existing_model_var>}_effort`:
  ```
  debugger_model=$($GSD_SDK query resolve-model gsd-debugger --raw)
  debugger_model_effort=$($GSD_SDK query resolve-model-effort gsd-debugger --raw)
  ...
  Agent(
    subagent_type="gsd-debugger",
    model="{debugger_model}",
    effort="{debugger_model_effort}",
    ...
  )
  ```

### Omission mechanism — pre-built fragment (SPAWN-02)
- **D-04 (revised — mechanistic):** Because the `Agent()` block is **orchestrator-interpreted pseudocode** (not code that builds the call string), there is no mechanistic enforcement point at spawn time. The most deterministic carrier available is a **pre-built fragment**: `resolve-model-effort --raw` emits the **whole token** — `effort="medium"` when present, **empty string** when absent — and the template interpolates `{<agent>_model_effort_arg}` with **no conditional instruction.** The orchestrator only substitutes a string; empty var → nothing rendered. This requires zero per-spawn judgment.
  - *Rationale for choosing fragment over an inline "render-only-when-non-empty" directive:* the directive asks the orchestrator to evaluate a condition (LLM fidelity, not deterministic); the fragment removes that judgment entirely. The earlier "fragment fights the grain" critique applies only to bash-concatenating the call, not to interpolating a single pre-built token.
- **D-05:** Under D-08 the absent case is now **rare** — only `inherit` slots and the 8 non-effort runtimes. On the Claude carrier, effort is non-empty for nearly every spawn, so the carrier is effectively unconditional. The fragment form handles the residual `inherit` omit case mechanically (empty token → empty string).

### Medium floor — milestone amendment (D-08, drives SPAWN-02 semantics)
- **D-08 (NEW, milestone-level):** Effort resolution **floors un-assigned slots to `medium`**, gated by the `{claude, codex}` allowlist. Precisely:
  - `{claude, codex}` + no effort assigned (bare slot) → **`medium`**
  - explicit assignment (`;effort` suffix or catalog value) → that value (unchanged)
  - explicit `inherit` slot → **stays effort-free** (null) — inherit semantics preserved
  - the 8 non-effort runtimes → **still null** (RESOLVE-05 hard no-op; cannot emit effort)
  - **Floor location (planner decision, recommendation noted):** prefer applying the floor in the **core resolver** (`resolveReasoningEffortInternal`) so `resolve-model`, `resolve-model-effort`, and SDK surfaces all agree on one source of truth. The alternative (floor only in the new query) creates divergence where `resolve-model` says `null` but `resolve-model-effort` says `medium`. **This reopens the Phase 53 resolver — it is NO LONGER frozen for Phase 56.** Planner confirms placement against the precedence chain (the floor is the new step-4 default, replacing the old `null` fallthrough, but only inside the allowlist gate and only for non-`inherit` slots).

### Resolve-call shape (SPAWN-01 / SPAWN-02)
- **D-06:** Add a **dedicated SDK sibling query parallel to `resolve-model`** — `resolve-model-effort gsd-<agent> --raw` — emitting the **pre-built carrier token** (D-04): `effort="<value>"` when present, `""` when absent. Thin wrapper over `resolveReasoningEffortInternal` (now flooring to medium per D-08), NOT new resolution logic. Adds **one resolve line per spawn site**, does **not** renumber workflow steps (preserves gates — SPAWN-03). Planner confirms exact handler name/registration and that `--raw` emits the full token (or `""`), never the literal `null`.

### Edit-surface scope (SPAWN-02)
- **D-07:** **Enumerate all three dirs, wire where spawns exist.** The ROADMAP plan-time grep across `agents/`, `commands/gsd/`, `get-shit-done/workflows/` is a **mandatory planner deliverable producing an evidence inventory**, then every site found is wired. Discuss-time enumeration already proved a stray spawn site lives outside workflows.

### Verified edit inventory (discuss-time grep — confirm/expand at plan time)
- **16 workflow files** with `model=` spawn sites (61 `model=` occurrences, 12 `resolve-model` capture lines): `audit-milestone.md`, `debug.md`, `docs-update.md`, `execute-phase.md`, `execute-plan.md`, `map-codebase.md`, `new-milestone.md`, `new-project.md`, `plan-phase.md`, `quick.md`, `scan.md`, `secure-phase.md`, `ui-phase.md`, `ui-review.md`, `validate-phase.md`, `verify-work.md`.
- **1 agent file:** `agents/gsd-debug-session-manager.md` — itself a spawning orchestrator (resolves `gsd-debugger`, passes `model=` at lines ~86–96).
- **`commands/gsd/*.md`:** zero spawn sites.

### Claude's Discretion
- Exact handler name/registration of the effort query (`resolve-model-effort` intended).
- Per-site placement of the new resolve line within each existing resolve block (adjacent to the matching `resolve-model` line).
- Whether the medium floor is a literal `'medium'` constant or a named default — provided it floors only within the allowlist and preserves `inherit`→null.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### ⚠ Locked artifacts this phase supersedes — UPDATE REQUIRED (D-08)
The medium-floor amendment contradicts currently-locked text. These need amending (via `/gsd-phase` edit or a requirements update) so the milestone stays coherent — flag to the user, do not silently diverge:
- `.planning/REQUIREMENTS.md` — **SPAWN-02** ("omitting it entirely when absent") must become "defaulting to `medium` when absent on `{claude,codex}`; non-effort runtimes still omit."
- `.planning/ROADMAP.md` §Phase 53 & §Phase 56 & §Phase 58 — the "bare catalog → null → zero emission / byte-identical" invariant language is **dropped on purpose**; Phase 58's golden snapshot must be **re-baselined** (pre ≠ post is now expected for bare configs on `{claude,codex}`).

### Requirements & Roadmap (locked)
- `.planning/REQUIREMENTS.md` — SPAWN-01, SPAWN-02 (see amendment above), SPAWN-03
- `.planning/ROADMAP.md` §"Phase 56: Spawn-Template Wiring" (lines ~458–470) — goal, depends-on (Phase 55), 3 success criteria, plan-time grep enumeration note

### Prior phase decisions (carry forward — but note D-08 supersession)
- `.planning/phases/53-unified-effort-resolver/53-CONTEXT.md` — precedence chain, `{claude,codex}` allowlist gate, `max` verbatim on Claude / clamp at Codex emit boundary. **The "back-compat null" invariant from here is superseded by D-08; the allowlist gate is RETAINED and is what scopes the medium floor.**
- `.planning/phases/54-sdk-tools-json-exposure/54-CONTEXT.md` — `effort` canonical field name + explicit-null contract; `resolve-model` exposes `effort` (will now show `medium` for bare claude/codex slots once D-08 lands).
- `.planning/phases/55-catalog-schema-user-handover/55-CONTEXT.md` — catalog accepts `model;effort`; the `inherit`/`none` guidance heuristic now interacts with the floor (only `inherit` stays effort-free).

### Source / templates to modify (confirm full set via D-07)
- `get-shit-done/bin/lib/core.cjs` — `resolveReasoningEffortInternal`: add the `medium` floor (D-08), allowlist-gated, `inherit`→null preserved. **No longer frozen for Phase 56.**
- `get-shit-done/bin/gsd-tools.cjs` + SDK query layer — register `resolve-model-effort` emitting the pre-built carrier token (D-04/D-06).
- `get-shit-done/workflows/*.md` — the 16 files in D-07; extend each `Agent()` block with the per-agent `effort=` fragment + matching resolve line.
- `agents/gsd-debug-session-manager.md` — the one agent-side spawn site (~86–96).

### Fork quality gates that MUST stay green (SPAWN-03)
- `tests/agent-frontmatter.test.cjs` (155/155), negative-framing (99/99), step-numbering (632/632), cross-file-refs (219/219), eta-include — preserved by extending existing `model=` lines, never renumbering steps or altering frontmatter.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `resolve-model gsd-<agent>` — emits `{model, profile, effort}`; effort currently null on bare catalog, will read `medium` for bare claude/codex slots after D-08.
- `resolveReasoningEffortInternal(cwd, agentType)` (`core.cjs`) — Phase 53; **modified in Phase 56** to add the allowlist-gated medium floor (D-08).

### Established Patterns
- Spawn sites resolve a model var in shell and interpolate `model="{x_model}"` inside an orchestrator-interpreted `Agent()` block. Effort mirrors this: one sibling resolve line + one interpolated pre-built token per site.
- `--raw` queries emit a bare string. The carrier token form (`effort="medium"` / `""`) keeps omission mechanical (D-04).

### Integration Points
- The `Agent()` block is orchestrator-interpreted pseudocode — conditional omission is avoided by the pre-built fragment (D-04), so the residual `inherit`/non-effort-runtime omit needs no LLM judgment.
- Some sites use the legacy `resolve-model ... | jq -r '.model'` form (e.g. `debug.md`, `gsd-debug-session-manager.md`); the new effort line sits adjacent regardless.

</code_context>

<specifics>
## Specific Ideas

- User directive (load-bearing): **abolish effort omission** — "when no effort is specified, it will be at least `medium`." Applied within `{claude, codex}`; non-effort runtimes still emit nothing; `inherit` stays effort-free (D-08).
- User directive: carrier is an `Agent()` argument parallel to `model=`, fed by a dedicated `resolve-model-effort` SDK query, one per-agent var per spawn site (D-01/D-03/D-06).
- User concern that drove D-04: the omission must be **mechanistic**, not reliant on orchestrator fidelity → pre-built carrier token rather than a conditional render instruction.

</specifics>

<deferred>
## Deferred Ideas

- Codex `max`→`xhigh` translation + per-runtime install materialization, including enforcing the non-effort-runtime omission at the emit boundary — Phase 57 (INSTALL-01/02).
- Re-baselined regression suite + golden snapshot reflecting the new floor (bare claude/codex → medium) — Phase 58 (TEST-01..05).

None are scope creep — they are downstream phases, now adjusted for the D-08 amendment.

</deferred>

---

*Phase: 56-spawn-template-wiring*
*Context gathered: 2026-06-04*
