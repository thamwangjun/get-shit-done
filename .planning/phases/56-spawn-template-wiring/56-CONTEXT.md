# Phase 56: Spawn-Template Wiring - Context

**Gathered:** 2026-06-04
**Status:** Ready for planning
**Milestone:** v2.1.0-e Per-Agent Thinking Effort

<domain>
## Phase Boundary

Phase 56 wires resolved per-agent **effort** into spawn templates so it reaches spawned agents, conditionally omitting it entirely when absent — without breaking any fork quality gate.

The plumbing to *produce* effort already exists: the Phase 53 resolver (`resolveReasoningEffortInternal`) and the Phase 54 JSON exposure already emit a canonical `effort` field (`resolve-model gsd-X` → `{"model":"opus","effort":null}` on a bare catalog). Phase 56 only has to **forward** that value into the `Agent()` spawn call at each site, alongside the existing `model=` argument.

**Back-compat invariant (inherited from Phases 53–55, load-bearing):** On a bare catalog (no `;effort` suffixes assigned), every resolved effort is `null` ⇒ **zero emission** ⇒ spawn output byte-identical to today. The wiring is inert until the user assigns effort values.

**In scope:** Effort carrier wired into every spawn site that passes `model=` (SPAWN-01), conditional omission when effort is null/absent (SPAWN-02), all fork quality gates preserved by extending existing `model=` blocks rather than renumbering steps (SPAWN-03). A thin SDK sibling query that emits raw effort.

**Out of scope:** Codex `max`→`xhigh` translation and install-time materialization (Phase 57); the full regression suite + golden snapshot (Phase 58); changes to `resolveReasoningEffortInternal` itself (Phase 53, frozen).
</domain>

<decisions>
## Implementation Decisions

### Effort carrier mechanism (SPAWN-01)
- **D-01:** The carrier is an **`Agent()` call argument, parallel to `model=`** — each spawn block gains an `effort="{<agent>_model_effort}"` line next to its `model="{<agent>_model}"` line. This mirrors the only carrier that exists today; agents/commands carry no `model:`/`effort:` frontmatter, so frontmatter was rejected as the carrier.
- **D-02 (MANDATORY plan-time verification — gates all wiring):** The current Agent/Task tool schema observed in-session exposes a `model` override but **no `effort` parameter**. Before any spawn site is edited, research/planner MUST verify against the **live Agent/Task API** whether an `effort` argument is actually honored by the runtime. If it is **not** honored, the planner falls back to the verified carrier the API does accept (e.g. frontmatter or another mechanism) rather than wiring a no-op argument. The requirement that is locked is the *outcome* (resolved effort reaches spawned agents, omitted when absent); the exact carrier is validated before wiring, not assumed. This is the ROADMAP plan-time-verification item ("resolved at plan time against the current Agent/Task API") — it is NOT yet closed.

### Per-agent, per-site effort (SPAWN-01)
- **D-03:** Effort is **per-agent and per-spawn-site — never a single global value.** A workflow that spawns three different agents resolves three independent effort vars, each possibly different or absent. Each site resolves and interpolates its own pair, e.g.:
  ```
  debugger_model=$($GSD_SDK query resolve-model gsd-debugger --raw)
  debugger_model_effort=$($GSD_SDK query resolve-model-effort gsd-debugger --raw)
  ...
  Agent(
    subagent_type="gsd-debugger",
    model="{debugger_model}",
    effort="{debugger_model_effort}",   # render only when non-empty
    ...
  )
  ```
  A different block in the same workflow resolves `doc_writer_model_effort` for `gsd-doc-writer`, and so on. The naming convention is `{<existing_model_var>}_effort` so it reads symmetrically with the existing model var.

### Conditional-omission style (SPAWN-02)
- **D-04:** Omission uses an **inline conditional placeholder + instruction.** The spawn template carries an `effort="{<agent>_model_effort}"` line annotated with an explicit directive: *render this line only when `{<agent>_model_effort}` is non-empty; omit the entire line when absent.* This matches how the orchestrator already renders conditional template content. **Rationale (load-bearing):** the `Agent()` block is **pseudocode the orchestrator interprets** — it is not literal bash string-building of the call. So a rigid shell-fragment concatenation approach fights the grain; the natural mechanism is a conditional instruction the orchestrator honors at render time.
- **D-05:** The omit contract is **byte-identical bare-config output**: when effort is null/absent, the rendered `Agent()` call contains no `effort` line at all — identical to today's spawn. The `resolve-model-effort --raw` step (D-06) emits an **empty string** (not the literal `null`) when effort is absent, so the inline conditional naturally suppresses the line.

### Resolve-call shape (SPAWN-01 / SPAWN-02)
- **D-06:** Add a **dedicated SDK sibling query parallel to `resolve-model`** — `resolve-model-effort gsd-<agent> --raw` — that emits the raw effort string (empty when null). It is a **thin wrapper over the existing `resolveReasoningEffortInternal` resolver**, NOT new resolution logic; effort is already present in `resolve-model`'s JSON. Chosen over `jq -r '.effort'` on the existing call for symmetry/grep-ability: one var per concern, one resolve line per concern. Planner verifies exact handler name + registration and that `--raw` emits `""` (not `null`) for absent effort. This adds **one resolve line per spawn site** and **does not renumber workflow steps** (preserves the gates — SPAWN-03).

### Edit-surface scope (SPAWN-02)
- **D-07:** **Enumerate all three dirs, wire where spawns exist.** The ROADMAP plan-time grep across `agents/`, `commands/gsd/`, and `get-shit-done/workflows/` is a **mandatory planner deliverable producing an evidence inventory** (count not pre-assumed), then every site found is wired. The discuss-time enumeration already proved this matters: a stray spawn site lives **outside** workflows.

### Verified edit inventory (discuss-time grep — confirm/expand at plan time)
- **16 workflow files** with `model=` spawn sites (61 `model=` occurrences, 12 `resolve-model` capture lines): `audit-milestone.md`, `debug.md`, `docs-update.md`, `execute-phase.md`, `execute-plan.md`, `map-codebase.md`, `new-milestone.md`, `new-project.md`, `plan-phase.md`, `quick.md`, `scan.md`, `secure-phase.md`, `ui-phase.md`, `ui-review.md`, `validate-phase.md`, `verify-work.md`.
- **1 agent file:** `agents/gsd-debug-session-manager.md` — itself a spawning orchestrator (resolves `gsd-debugger`, passes `model=` at lines ~86–96). A workflows-only scope would have missed it.
- **`commands/gsd/*.md`:** zero spawn sites — "across all three" is satisfied vacuously for commands.

### Claude's Discretion
- Exact handler name/registration of the effort query (`resolve-model-effort` is the intended name; planner confirms it fits the SDK query namespace) and whether it shells through the same code path as `resolve-model`.
- Exact wording of the inline conditional render directive, provided it is uniform across all sites and grep-verifiable.
- Per-site placement of the new resolve line within each existing resolve block (kept adjacent to the matching `resolve-model` line).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap (locked)
- `.planning/REQUIREMENTS.md` — SPAWN-01, SPAWN-02, SPAWN-03 (locked requirements for this phase)
- `.planning/ROADMAP.md` §"Phase 56: Spawn-Template Wiring" (lines ~458–470) — goal, depends-on (Phase 55), 3 success criteria, and the **plan-time verification note** mandating the grep-based edit-list enumeration across all three dirs

### Prior phase decisions (carry forward — DO NOT re-litigate)
- `.planning/phases/53-unified-effort-resolver/53-CONTEXT.md` — resolver precedence chain, `{claude,codex}` allowlist gate, `max` verbatim on Claude / clamp at Codex emit boundary, back-compat invariant. The resolver is **frozen** in Phase 56.
- `.planning/phases/54-sdk-tools-json-exposure/54-CONTEXT.md` — `effort` canonical field name + explicit-null contract; `resolve-model` already exposes `effort`. The new `resolve-model-effort` query reuses this.
- `.planning/phases/55-catalog-schema-user-handover/55-CONTEXT.md` — catalog now accepts `model;effort` slots; bare-catalog ⇒ null effort invariant the omit guard depends on.

### Source / templates to modify (confirm full set via D-07 enumeration)
- `get-shit-done/workflows/*.md` — the 16 files listed in D-07; extend each `Agent()` block's `model=` site with the per-agent `effort=` line + conditional directive, and add the matching `resolve-model-effort` capture line.
- `agents/gsd-debug-session-manager.md` — the one agent-side spawn site (~86–96).
- `get-shit-done/bin/gsd-tools.cjs` + the SDK query layer — register the `resolve-model-effort` sibling query over `resolveReasoningEffortInternal` (`get-shit-done/bin/lib/core.cjs`, read-only reference for the resolver).

### Fork quality gates that MUST stay green (SPAWN-03)
- `tests/agent-frontmatter.test.cjs` (155/155), negative-framing (99/99), step-numbering (632/632), cross-file-refs (219/219), eta-include — preserved by extending existing `model=` lines, never renumbering steps or altering frontmatter.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `resolve-model gsd-<agent>` CLI / SDK query — already emits `{model, profile, effort}`; effort present (null on bare catalog). `resolve-model-effort` (D-06) is a thin sibling over the same resolver.
- `resolveReasoningEffortInternal(cwd, agentType)` (`get-shit-done/bin/lib/core.cjs`) — Phase 53; no changes in Phase 56, only a new query surface over it.

### Established Patterns
- Spawn sites resolve a model var in shell (`x_model=$($GSD_SDK query resolve-model gsd-x --raw)`) and interpolate `model="{x_model}"` inside a markdown `Agent()` pseudocode block the orchestrator translates into a real tool call. Effort wiring mirrors this exactly: one sibling resolve line + one interpolated arg per site.
- `--raw` queries emit a bare string (the omit contract requires `""` for absent effort, not the literal `null`).

### Integration Points
- The `Agent()` block is orchestrator-interpreted pseudocode, not executed code — so conditional omission is an orchestrator-render directive (D-04), not bash concatenation.
- Some spawn sites still use the legacy `resolve-model ... | jq -r '.model'` form (e.g. `debug.md`, `gsd-debug-session-manager.md`); the new effort line should sit adjacent regardless of which model-capture form a site uses.

</code_context>

<specifics>
## Specific Ideas

- User-supplied directive: the carrier is an `Agent()` argument (parallel to `model=`) **and** the SDK gains a dedicated `resolve-model-effort gsd-<agent>` query so each spawn site resolves its own per-agent effort var (e.g. `debugger_model_effort`), interpolated as a conditionally-rendered `effort=` line.
- User correction (load-bearing): effort is per-agent/per-site, never a single global `effort` value — a workflow spawning multiple agents resolves an independent effort var for each.

</specifics>

<deferred>
## Deferred Ideas

- Codex `max`→`xhigh` translation at the emit boundary and per-runtime install-time materialization — Phase 57 (INSTALL-01/02).
- Golden-snapshot proof that bare configs spawn byte-identically + full parser/precedence regression suite — Phase 58 (TEST-01..05).

None of the above are scope creep — they are already downstream phases.

</deferred>

---

*Phase: 56-spawn-template-wiring*
*Context gathered: 2026-06-04*
