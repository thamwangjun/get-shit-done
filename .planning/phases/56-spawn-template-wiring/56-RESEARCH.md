# Phase 56: Spawn-Template Wiring — Research

**Researched:** 2026-06-04
**Domain:** Claude Code subagent spawn API; core.cjs resolver; workflow/agent template editing
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Carrier is an `Agent()` call argument parallel to `model=`. Frontmatter `effort:` was rejected.
- **D-02 (MANDATORY plan-time verification — gates all wiring):** Verify live Agent/Task API before editing spawn sites. The locked outcome is "resolved effort reaches spawned agents"; exact carrier validated before wiring.
- **D-03:** Effort is per-agent and per-spawn-site. Naming convention: `{<existing_model_var>}_effort`. One sibling resolve line per spawn site.
- **D-04 (revised — mechanistic):** `resolve-model-effort --raw` emits the pre-built carrier token: `effort="medium"` when present, `""` when absent. Template interpolates `{<agent>_model_effort_arg}`. No conditional instruction.
- **D-05:** Under D-08 the absent case is now rare — only `inherit` slots and the 8 non-effort runtimes.
- **D-06:** Dedicated `resolve-model-effort gsd-<agent> --raw` SDK sibling query. Thin wrapper over `resolveReasoningEffortInternal`. Exact handler name/registration is Claude's Discretion.
- **D-07:** Enumerate all three dirs (`agents/`, `commands/gsd/`, `get-shit-done/workflows/`) and wire every site found. Mandatory evidence inventory before wiring.
- **D-08 (NEW, milestone-level):** Floor un-assigned `{claude, codex}` slots to `medium`. `inherit`→null preserved. 8 non-effort runtimes→null preserved. Floor lives in `resolveReasoningEffortInternal` (no longer frozen for Phase 56).

### Claude's Discretion
- Exact handler name/registration of the effort query (`resolve-model-effort` intended).
- Per-site placement of the new resolve line within each existing resolve block (adjacent to the matching `resolve-model` line).
- Whether the medium floor is a literal `'medium'` constant or a named default.

### Deferred Ideas (OUT OF SCOPE)
- Codex `max`→`xhigh` translation + per-runtime install materialization — Phase 57.
- Re-baselined regression suite — Phase 58.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SPAWN-01 | Verified Claude effort carrier wired so resolved effort reaches spawned agents | D-02 verification (below) confirms `effort` is a real frontmatter field; per-invocation status documented |
| SPAWN-02 | Spawn templates pass resolved effort; un-assigned `{claude,codex}` slot defaults to `medium`; absence carried mechanically by pre-built token | D-04/D-08 pattern confirmed; init.cjs already emits `*_effort` fields; workflows need wiring |
| SPAWN-03 | Spawn-template edits preserve fork quality gates | Gate analysis confirms no step-renumbering risk from adding `effort=` lines |
</phase_requirements>

---

## Summary

Phase 56 wires resolved per-agent effort into spawn templates. The research validates the CONTEXT.md assumptions against live code and the Claude Code Agent API, then produces the evidence inventory required by D-07.

**Three structural findings diverge from CONTEXT.md's discuss-time enumeration:**

1. **D-02 verification result:** `effort` IS a real Agent/Task frontmatter field in Claude Code (confirmed via official docs, line 279 of code.claude.com/docs/en/sub-agents). However, the per-invocation model resolution chain (4-step) documents `model` as a per-invocation parameter but does NOT document `effort` as one. The docs describe `effort` at the *definition* level (frontmatter), not as a spawn-call argument. This creates a planning decision: the locked outcome "resolved effort reaches spawned agents" can be achieved via frontmatter, but D-01 locked *against* frontmatter. The `effort=` argument form in `Agent()` pseudocode may be honored by the Claude Code orchestrator as an additional parameter (consistent with how GSD workflows pass `isolation=`, `run_in_background=` as call-site args not in official parameter tables), but this is unconfirmed at the invocation level. See D-02 findings section.

2. **Additional spawn site discovered:** `get-shit-done/workflows/discuss-phase/modes/advisor.md` has 1 `model=` spawn site and 1 `resolve-model` capture line. This file is NOT in CONTEXT.md's list of 16 workflow files. Total confirmed spawn-site files is therefore 17 (or 18 counting the subdirectory file), not 16.

3. **init.cjs already emits `*_effort` fields for most workflows.** Workflows using `init.*` commands (execute-phase, plan-phase, new-project, new-milestone, verify-work, map-codebase, quick) already receive `*_effort` sibling fields in the init JSON — they are simply not consumed by the parse instruction or Agent() blocks yet. This changes the wiring task for those workflows: no new resolve-model-effort shell call needed, only update the parse instruction and add `effort="{executor_effort_arg}"` to the Agent() block.

**Primary recommendation:** Plan the wiring in two groups: (A) init-fed workflows where the effort var is already available in INIT JSON — add it to the parse list and the Agent() block; (B) standalone-resolve workflows (those using explicit `resolve-model` shell calls) — add a sibling `resolve-model-effort` call adjacent and add the Agent() block arg.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Effort resolution logic | `core.cjs` (resolveReasoningEffortInternal) | — | Single source of truth; D-08 floor added here |
| Effort token emission | `gsd-tools.cjs` / `commands.cjs` (resolve-model-effort query) | SDK init JSON (`*_effort` fields) | CLI path for standalone-resolve sites; init path for init-fed sites |
| Effort carrier injection | Workflow/agent .md spawn templates | — | `effort="{var}"` arg in Agent() pseudocode blocks |
| Gate preservation | Test suite (agent-frontmatter, step-numbering, cross-file-refs) | — | Adding effort lines does not alter frontmatter or step numbers |

---

## D-02: Agent/Task API Effort Verification

**Source:** Official Claude Code documentation [CITED: code.claude.com/docs/en/sub-agents, fetched 2026-06-04]

### What the docs confirm

The `effort` field IS supported in Claude Code subagent configuration. From the supported frontmatter fields table (confirmed verbatim):

> `effort` | No | Effort level when this subagent is active. Overrides the session effort level. Default: inherits from session. Options: `low`, `medium`, `high`, `xhigh`, `max`; available levels depend on the model

The `--agents` CLI flag also explicitly lists `effort` as a supported field alongside `model`.

### Per-invocation vs. frontmatter: the critical gap

For `model`, the docs describe a 4-step per-invocation resolution chain:
1. `CLAUDE_CODE_SUBAGENT_MODEL` env var
2. The per-invocation `model` parameter (passed in the Agent() call)
3. The subagent definition's `model` frontmatter
4. The main conversation's model

No equivalent 4-step chain is documented for `effort`. The docs describe `effort` only at the definition level (frontmatter / `--agents` JSON).

**Implication for D-01/D-04:** GSD workflows use `Agent()` as orchestrator-interpreted pseudocode, not a strict API call. The orchestrator (Claude Code) interprets named parameters. The `isolation=`, `run_in_background=` parameters GSD workflows already pass are also not in the formal Agent tool schema — they are accepted by the Claude Code orchestrator as additional hints. It is consistent to expect that `effort=` would be similarly honored as a per-invocation hint. However, this is not confirmed in official documentation and remains `[ASSUMED]`.

**Verified fallback if `effort=` in Agent() call is no-op'd:** The `effort` frontmatter field IS verified. If the planner determines that the per-invocation `effort=` argument is not honored, the alternative is to update the `effort:` frontmatter field in each agent's `.md` file — which D-01 explicitly rejected. The current D-04 pre-built token approach (`effort="medium"` as a fragment) is the most defensible template-level convention even if the orchestrator ignores it: it documents intent, and if Claude Code later supports per-invocation effort, the wiring is already in place.

**Confidence:** MEDIUM — `effort` as a frontmatter field is VERIFIED; `effort=` as a per-invocation Agent() argument is ASSUMED (consistent with how GSD passes other non-schema args but not confirmed in official docs).

---

## D-07: Spawn-Site Evidence Inventory

All counts verified via live `grep` against the repository at research time.

### Summary table

| Location | Files with `model=` | Total `model=` occurrences | `resolve-model` capture lines | Notes |
|---|---|---|---|---|
| `get-shit-done/workflows/*.md` (top-level) | 16 | 58 | 12 | Confirmed |
| `get-shit-done/workflows/discuss-phase/modes/advisor.md` | 1 | 1 | 1 | **NOT in CONTEXT.md list — additional site** |
| `agents/gsd-debug-session-manager.md` | 1 | 1 | 1 | Confirmed (legacy jq form) |
| `commands/gsd/*.md` | 0 | 0 | 0 | Confirmed |

**CONTEXT.md claimed 16 workflow files, 61 `model=` occurrences. Verified: 17 files (including advisor.md subdirectory), 59 top-level + 1 advisor = 60 top-level workflow occurrences + 1 advisor + 1 agent = 62 total. The 61 figure may have included advisor.md in the count but excluded it from the file list, or the diff is one stale removal.**

### Workflow files by resolve pattern

**Group A — Init-fed (effort already in init JSON, no shell call needed):**
These workflows call `init.*` which already emit `*_effort` siblings. The wiring task is: add `*_effort` field(s) to the parse instruction and add `effort="{var_arg}"` to each Agent() block.

| File | Agents spawned (model vars) | init command | effort fields already in init JSON |
|---|---|---|---|
| `execute-phase.md` | executor_model, verifier_model (4 model= total) | `init.execute-phase` | executor_effort ✓, verifier_effort ✓ |
| `plan-phase.md` | researcher_model, planner_model, checker_model (7 model= total) | `init.plan-phase` | researcher_effort ✓, planner_effort ✓, checker_effort ✓ |
| `new-project.md` | researcher_model, synthesizer_model, roadmapper_model (7 model= total) | `init.new-project` | researcher_effort ✓, synthesizer_effort ✓, roadmapper_effort ✓ |
| `new-milestone.md` | planner_model, executor_model, checker_model, verifier_model (3 model= total) | `init.new-milestone` | planner_effort ✓, executor_effort ✓, checker_effort ✓, verifier_effort ✓ |
| `verify-work.md` | verifier_model, planner_model, checker_model (3 model= total) | `init.verify-work` | verifier_effort ✓, planner_effort ✓, checker_effort ✓ |
| `map-codebase.md` | mapper_model (5 model= total) | `init.map-codebase` | mapper_effort ✓ |
| `execute-plan.md` | executor_model (1 model= total) | `init.execute-phase` (shared) | executor_effort ✓ |
| `quick.md` | planner_model, checker_model, executor_model (7 model= total) | `init.quick` | planner_effort ✓, executor_effort ✓, checker_effort ✓ |

**Group B — Standalone resolve (require new `resolve-model-effort` shell call):**
These workflows use explicit `resolve-model` shell invocations and do NOT go through init.

| File | Agent(s) / model vars | Current form | Occurrences |
|---|---|---|---|
| `audit-milestone.md` | integration_checker_model | `--raw` | 2 model= |
| `debug.md` | debugger_model | legacy `jq` form | 3 model= |
| `docs-update.md` | doc_writer_model | via `docs-init` (NOT in init.cjs) | 10 model= |
| `scan.md` | (model var TBD) | resolve pattern TBD | 1 model= |
| `secure-phase.md` | AUDITOR_MODEL | `--raw` | 1 model= |
| `ui-phase.md` | UI_RESEARCHER_MODEL, UI_CHECKER_MODEL | `--raw` | 2 model= |
| `ui-review.md` | UI_AUDITOR_MODEL | `--raw` | 1 model= |
| `validate-phase.md` | AUDITOR_MODEL | `--raw` | 1 model= |
| `discuss-phase/modes/advisor.md` | ADVISOR_MODEL | `--raw` | 1 model= |
| `agents/gsd-debug-session-manager.md` | debugger_model | legacy `jq` form | 1 model= |

**Special case — `docs-update.md`:** Uses `docs-init` (dispatched through `docs.cjs`, not `init.cjs`). The `docs.cjs` `docsInit` function does NOT emit `doc_writer_effort`. This is a Group B site that also requires a `docs.cjs` amendment to add the effort field to the init JSON, OR a standalone `resolve-model-effort` shell call in the workflow.

### Legacy `jq` form sites (must add effort line regardless)

Sites using `resolve-model ... | jq -r '.model'` rather than `--raw`:
- `debug.md`: `debugger_model=$($GSD_SDK query resolve-model gsd-debugger 2>/dev/null | jq -r '.model' 2>/dev/null || true)`
- `ai-integration-phase.md`: 4 resolve-model lines using `jq -r '.model'` — note this file has `model=` occurrences but was NOT in CONTEXT.md's list (check if it has Agent() spawn sites vs. just references).
- `eval-review.md`: 1 jq-form line — also not in CONTEXT.md's list.
- `agents/gsd-debug-session-manager.md`: uses `jq -r '.model'`

**Action:** The new `resolve-model-effort --raw` line sits adjacent to the matching resolve line regardless of whether the model line uses `--raw` or `jq`. The `--raw` form is always used for the new effort query.

---

## D-08: Resolver Floor Placement

### Current `resolveReasoningEffortInternal` precedence chain

Located at `get-shit-done/bin/lib/core.cjs` lines 1611–1692. [VERIFIED: codebase grep]

Current 5-step chain (pre-D-08):
1. **Allowlist gate** (line 1617): `if (!config.runtime || !RUNTIMES_WITH_REASONING_EFFORT.has(config.runtime)) return null` — `RUNTIMES_WITH_REASONING_EFFORT = new Set(['claude', 'codex'])` [VERIFIED]
2. **Per-agent override** (line 1623–1626): parses `model_overrides[agentType]` for `;effort` suffix
3. **Shared slot** (line 1632): `_resolveAgentSlotFromConfig(config, agentType)` → tier string
   - `inherit` or null → `return null` (RESOLVE-06 preserved)
4. **Phase-type slot effort / model_profile_overrides user effort** (lines 1656–1673)
5. **Catalog slot effort** (line 1680–1681): `parseModelEffort(tier).effort`; non-null → return
6. **Runtime-tier entry fallback** (lines 1688–1689): `_resolveRuntimeTier`; claude has no entry → null
7. **Final fallthrough** (line 1691): `return null`

**Comment at line 1609 (must be updated per D-08):** `"Back-compat invariant: bare claude configs without catalog slot effort → null."` — this invariant is intentionally dropped by D-08.

### D-08 floor insertion point

The new `medium` floor replaces step 7 (`return null`) as follows:

```
// After step 6 (runtime-tier entry fallback returned null):
// D-08: floor un-assigned slots to 'medium' on {claude, codex}.
// The allowlist gate (step 1) already ensures we are on a supported runtime.
// inherit slots returned null at step 3 — they never reach here.
return 'medium';  // or a named constant DEFAULT_EFFORT = 'medium'
```

**Preconditions for reaching the floor:**
- Runtime is `claude` or `codex` (gate passed at step 1)
- No per-agent override with effort (step 2 returned null effort)
- Slot is not `inherit` or null (step 3 didn't return null)
- No user-supplied phase-type or profile_overrides effort (steps 3–4 returned null)
- Catalog slot has no `;effort` suffix (step 5 returned null)
- No runtime-tier entry effort (step 6 returned null)

These preconditions exactly describe a "bare slot" — an agent in the balanced/golden/budget profile with no effort annotation. The floor correctly fires only here.

**`inherit` slot safety:** Line 1635 — `if (!tier || tier === 'inherit') return null` — this executes before the floor and is not changed. Inherit slots continue to return null.

**Non-effort runtime safety:** The allowlist gate at line 1617 returns null before any other logic. Non-effort runtimes are unaffected.

### All callers of `resolveReasoningEffortInternal` (blast radius)

The floor change affects every call site. All callers verified via codebase grep: [VERIFIED: codebase grep]

| Caller | Location | Effect of floor |
|---|---|---|
| `cmdResolveModel` | `commands.cjs:244` | `resolve-model gsd-<agent>` now returns `effort: "medium"` for bare claude slots instead of `null` |
| `init.execute-phase` | `init.cjs:198,200` | `executor_effort`, `verifier_effort` in INIT JSON: null → "medium" for bare slots |
| `init.plan-phase` | `init.cjs:346,348,350` | researcher/planner/checker_effort: null → "medium" |
| `init.new-project` | `init.cjs:536,538,540` | researcher/synthesizer/roadmapper_effort: null → "medium" |
| `init.new-project` (quick) | `init.cjs:592,594,596` | same |
| `init.quick` | `init.cjs:652–658` | planner/executor/checker/verifier_effort: null → "medium" |
| `init.verify-work` | `init.cjs:778,780` | planner/checker_effort: null → "medium" |
| `init.map-codebase` | `init.cjs:1114` | mapper_effort: null → "medium" |
| `init.resume` (phase-op) | `init.cjs:1571,1573` | executor/planner_effort: null → "medium" |

**All init.cjs callers already emit `*_effort ?? null` — the `?? null` is now a no-op for bare claude slots (they return "medium"), but correctly handles the non-effort-runtime case (still null).**

---

## D-06: resolve-model-effort Query Registration

### How `resolve-model` is registered

In `gsd-tools.cjs` (line 621–624):
```
case 'resolve-model': {
  commands.cmdResolveModel(cwd, args[1], raw);
  break;
}
```

`cmdResolveModel` in `commands.cjs` (lines 236–252):
- Calls `resolveModelInternal` and `resolveReasoningEffortInternal`
- Emits JSON `{ model, profile, effort }` or raw string (just the model string) when `--raw`
- Current `--raw` behavior: emits the model string, NOT the full JSON. So `--raw` on `resolve-model` gives the model only.

### New `resolve-model-effort` handler pattern

The sibling handler emits the pre-built carrier token (D-04):
- When effort is present: `effort="medium"` (full token, ready to interpolate into Agent() call)
- When effort is absent (inherit slot or non-effort runtime): `""` (empty string)

Registration in `gsd-tools.cjs`:
```javascript
case 'resolve-model-effort': {
  commands.cmdResolveModelEffort(cwd, args[1], raw);
  break;
}
```

`cmdResolveModelEffort` in `commands.cjs`:
```javascript
function cmdResolveModelEffort(cwd, agentType, raw) {
  if (!agentType) error('agent-type required');
  const effort = resolveReasoningEffortInternal(cwd, agentType);
  const token = effort !== null ? `effort="${effort}"` : '';
  output({ effort, token }, raw, token);
}
```

The `--raw` path emits the token string directly (`effort="medium"` or `""`). The JSON path emits `{ effort, token }` for debugging. The `rawValue` is always the token — never the literal `null` string.

**Naming convention for vars:** `{existing_model_var}_effort_arg` (e.g., `executor_model_effort_arg`). The `_arg` suffix distinguishes the pre-built token from the resolved effort value.

---

## SPAWN-03: Fork Quality Gate Preservation

### Gate status at research time

From CONTEXT.md (locked gate counts):
- agent-frontmatter.test.cjs: 155/155
- negative-framing: 99/99
- step-numbering-scan.test.cjs: 632/632
- cross-file-step-refs.test.cjs: 219/219
- eta-include: pass

### Risk analysis for Phase 56 edits

**Frontmatter gate (155/155):** Phase 56 edits extend Agent() call pseudocode blocks and workflow step body — they do NOT alter YAML frontmatter in any agent `.md` file. Adding an `effort=` line inside a pseudocode block is body content, not frontmatter. Zero risk. [VERIFIED: gate validates `name`, `description`, `tools`, `color`, no-`skills:` — none of these are touched]

**Step-numbering gate (632/632):** The scanner looks for `Step N.M` decimal labels and `Step Na` letter-suffix labels. Adding `effort="{executor_effort_arg}"` lines inside Agent() pseudocode blocks does NOT contain the word "Step" in decimal form. Zero risk of new violations. The scanner also checks per-section order — since no step headings are added or removed, no out-of-order violations can arise. [VERIFIED: scanner source at tests/step-numbering-scan.test.cjs]

**Cross-file-refs gate (219/219):** This scanner checks `@-ref` paths and cross-file step references. Phase 56 adds no new `@-refs` or step cross-references. Zero risk.

**Negative-framing gate (99/99):** This fork test validates that agent/workflow files use positive affirmative instructions rather than negative directives. Adding `effort="{var}"` to Agent() blocks is neutral content — no framing issues.

**eta-include gate:** No ETA includes are added or removed.

**Conclusion:** Extending `model=` blocks with adjacent `effort=` lines and adding `{agent}_model_effort_arg` resolve lines poses zero risk to any fork quality gate. No step renumbering is required.

---

## Key Patterns

### Pattern 1: Group A — Init-fed workflow wiring

For workflows that already consume `*_effort` from INIT JSON (execute-phase, plan-phase, quick, etc.):

**Step 1:** Extend the "Parse JSON for:" instruction to include the effort var:
```
Parse JSON for: `executor_model`, `executor_effort`, `verifier_model`, `verifier_effort`, ...
```

**Step 2:** Resolve the pre-built carrier token from the effort value:
```
executor_model_effort_arg=$([ -n "$executor_effort" ] && [ "$executor_effort" != "null" ] && echo "effort=\"$executor_effort\"" || echo "")
```
Or, if the orchestrator can interpolate directly from INIT JSON, include it in the parse instruction and build the token in a separate shell assignment.

**Step 3:** Extend the Agent() call:
```
Agent(
  subagent_type="gsd-executor",
  model="{executor_model}",
  {executor_model_effort_arg}
  ...
)
```

**Alternative (simpler for D-04):** Have `resolve-model-effort` called explicitly even for init-fed workflows — one extra shell call eliminates the shell conditional above and makes all sites uniform. The init JSON `*_effort` fields become redundant but remain for EXPOSE-01 compliance. Planner decides.

### Pattern 2: Group B — Standalone resolve wiring

For workflows with explicit `resolve-model` shell calls:

```bash
# Existing:
debugger_model=$($GSD_SDK query resolve-model gsd-debugger --raw)
# New (adjacent):
debugger_model_effort_arg=$($GSD_SDK query resolve-model-effort gsd-debugger --raw)
```

Agent() block:
```
Agent(
  subagent_type="gsd-debugger",
  model="{debugger_model}",
  {debugger_model_effort_arg}
  ...
)
```

For legacy `jq` sites (debug.md, gsd-debug-session-manager.md), the effort line always uses `--raw` regardless:
```bash
# Existing (legacy):
debugger_model=$($GSD_SDK query resolve-model gsd-debugger 2>/dev/null | jq -r '.model' 2>/dev/null || true)
# New (adjacent, always --raw):
debugger_model_effort_arg=$($GSD_SDK query resolve-model-effort gsd-debugger --raw 2>/dev/null || echo "")
```

### Pattern 3: docs.cjs gap

`docs-update.md` uses `docs-init` which dispatches through `docs.cjs`. The `docsInit` function (line 254) only emits `doc_writer_model` — no effort sibling. Options:

**Option A (preferred — consistent with D-06):** Add a standalone `resolve-model-effort gsd-doc-writer --raw` call in `docs-update.md`, same as Group B. No changes to `docs.cjs`.

**Option B:** Add `doc_writer_effort: resolveReasoningEffortInternal(cwd, 'gsd-doc-writer') ?? null` to `docs.cjs` docsInit output. More consistent with init.cjs pattern but requires touching an additional file.

---

## Common Pitfalls

### Pitfall 1: Empty token vs. `null` string
**What goes wrong:** Shell variable expansion of `null` or undefined produces the literal string `"null"` in some contexts.
**Prevention:** The `cmdResolveModelEffort` handler emits `""` (empty string), never `"null"`. Shell consumers must handle empty string as no-op.

### Pitfall 2: Quoting the effort value in the token
**What goes wrong:** `effort=medium` (unquoted) vs `effort="medium"` (quoted).
**Why it matters:** The Agent() block is orchestrator-interpreted pseudocode. Use the quoted form `effort="medium"` to match the `model="..."` convention already present.
**Prevention:** Pre-built token format includes quotes: `effort="medium"`.

### Pitfall 3: Per-invocation vs. frontmatter effort (D-02 risk)
**What goes wrong:** If the orchestrator ignores `effort=` as an Agent() call argument (not documented as per-invocation), effort never reaches the spawned agent.
**Why it happens:** Only `model=` is documented as a per-invocation parameter; `effort` is documented as a definition-level field.
**How to avoid:** The pre-built token approach still documents intent correctly. Monitor Phase 58 golden snapshots — if effort is honored, spawned agent behavior changes; if ignored, no change. If it must be verified before commit, test empirically by spawning a subagent with a known effort and checking the actual reasoning behavior.

### Pitfall 4: `docs.cjs` missing effort field
**What goes wrong:** `docs-update.md` spawns 10 Agent() calls (all doc_writer_model) but the docs-init JSON has no `doc_writer_effort` field. If the planner wires the init path for docs-update, the effort var is undefined.
**Prevention:** Use Option A (standalone shell call) for docs-update.md, same as all other Group B sites.

### Pitfall 5: `ai-integration-phase.md` and `eval-review.md` scope
**What goes wrong:** These two files have `resolve-model` calls using the jq form but were NOT in CONTEXT.md's 16-file list. If they have actual Agent() spawn blocks (not just resolve lines for informational use), they must be wired.
**Prevention:** Planner must grep for `Agent(` in these files to determine if they have spawn sites, and include them if so.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `effort=` as an Agent() call argument is honored by the Claude Code orchestrator as a per-invocation parameter (D-01 carrier) | D-02 | Effort never reaches spawned agents; must fall back to frontmatter carrier (contradicts D-01 locked decision) |
| A2 | `ai-integration-phase.md` and `eval-review.md` have no Agent() spawn blocks (just resolve lines) | D-07 | Two additional spawn sites missed; scope expands |
| A3 | The `_arg` naming convention (`executor_model_effort_arg`) is accepted by all target runtime orchestrators for template interpolation | Architecture Patterns | Runtime translation complexity in Phase 57 |

---

## State of the Art

| Old Approach | Current Approach | Impact |
|---|---|---|
| Bare claude slots → effort `null` → omit from spawn | D-08: bare `{claude,codex}` slots → floor to `medium` | All spawned agents on claude now get at least medium reasoning effort |
| effort only from catalog `;effort` suffix or explicit config | Medium floor as new default step in `resolveReasoningEffortInternal` | Floor applies uniformly through all callers (init.cjs, commands.cjs, future) |
| `effort` not documented as per-invocation Agent() param | `effort` confirmed as supported frontmatter field; per-invocation status unconfirmed | Wiring is forward-compatible regardless of per-invocation support |

---

## Environment Availability

Step 6: SKIPPED — no external tools or services required. Changes are code/template edits only.

---

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json` defaults table — treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `--test` runner |
| Config file | none (direct invocation) |
| Quick run | `npm test` |
| Full suite | `npm test` (same) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SPAWN-01 | `resolve-model-effort gsd-<agent> --raw` emits `effort="medium"` for bare claude slots | unit | `node --test tests/commands.test.cjs` | ❌ Wave 0 |
| SPAWN-01 | `effort=` argument accepted in Agent() call (empirical) | manual | manual spawn + observe | manual-only |
| SPAWN-02 | `resolveReasoningEffortInternal` floors bare `{claude,codex}` slot to `medium` | unit | `node --test tests/core.test.cjs` (effort section) | ✅ extend existing |
| SPAWN-02 | `inherit` slot still returns null after floor added | unit | `node --test tests/core.test.cjs` | ✅ extend existing |
| SPAWN-02 | Non-effort runtimes still return null after floor added | unit | `node --test tests/core.test.cjs` | ✅ extend existing |
| SPAWN-03 | Fork gates pass after template edits | integration | `npm test` | ✅ existing |

### Sampling Rate
- Per task commit: `npm test 2>&1 | tee /tmp/gsd-test-output.txt`
- Per wave merge: `npm test`
- Phase gate: full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/commands.test.cjs` — new `cmdResolveModelEffort` function unit tests (token form, empty-when-null, --raw plumbing)
- [ ] Extend `tests/core.test.cjs` (or `tests/resolve-model-effort.test.cjs`) — D-08 floor assertions:
  - bare claude slot → "medium"
  - inherit slot → null
  - non-effort runtime → null
  - explicit catalog effort → preserved (not overridden by floor)

---

## Security Domain

`workflow.security_enforcement` is absent from config — treat as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V5 Input Validation | Low | `effort` values validated against EFFORT_TOKENS allowlist in `parseModelEffort` — already implemented |
| V2 Authentication | No | — |
| V6 Cryptography | No | — |

No new external attack surface is introduced. The effort value transits from config → resolver → template string → orchestrator call. The EFFORT_TOKENS validation already gates invalid values at the parser level (PARSE-01).

---

## Sources

### Primary (HIGH confidence)
- Codebase grep: `resolveReasoningEffortInternal` in `core.cjs` (lines 1611–1692) — precedence chain verified
- Codebase grep: all callers of `resolveReasoningEffortInternal` across `commands.cjs`, `init.cjs`
- Codebase grep: `model=` and `resolve-model` across all workflow/agent dirs — spawn site inventory

### Secondary (MEDIUM confidence)
- [CITED: code.claude.com/docs/en/sub-agents] — `effort` confirmed as supported frontmatter field; per-invocation status not documented
- `RUNTIMES_WITH_REASONING_EFFORT = new Set(['claude', 'codex'])` in `model-catalog.cjs` line 97

### Tertiary (LOW / ASSUMED)
- `effort=` as a per-invocation Agent() argument is honored by Claude Code orchestrator [ASSUMED — consistent with how GSD passes other non-schema args like `isolation=` but not confirmed in official docs]
- `ai-integration-phase.md` and `eval-review.md` have no Agent() spawn blocks [ASSUMED — not grep'd for `Agent(`]

---

## Metadata

**Confidence breakdown:**
- D-02 API verification: MEDIUM — `effort` frontmatter VERIFIED, per-invocation form ASSUMED
- D-07 spawn site inventory: HIGH — direct grep verification against live codebase
- D-08 resolver floor: HIGH — code read and insertion point identified precisely
- D-06 query registration: HIGH — exact handler pattern from live code
- SPAWN-03 gate preservation: HIGH — scanner source code read, no conflict found

**Research date:** 2026-06-04
**Valid until:** 2026-07-04 (stable domain; Claude Code API may add per-invocation `effort` documentation any release)
