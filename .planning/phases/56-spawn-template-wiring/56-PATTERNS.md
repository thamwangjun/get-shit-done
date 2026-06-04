# Phase 56: Spawn-Template Wiring - Pattern Map

**Mapped:** 2026-06-04
**Files analyzed:** 20 (1 core.cjs, 1 gsd-tools.cjs, 1 commands.cjs, 17 workflow/agent spawn-site files)
**Analogs found:** 20 / 20

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `get-shit-done/bin/lib/core.cjs` (resolveReasoningEffortInternal) | utility | transform | same file — existing precedence chain steps 1–6 | self-analog (insertion) |
| `get-shit-done/bin/lib/commands.cjs` (cmdResolveModelEffort) | utility | request-response | `cmdResolveModel` in same file (lines 236–252) | exact |
| `get-shit-done/bin/gsd-tools.cjs` (resolve-model-effort case) | config | request-response | `case 'resolve-model':` in same file (lines 621–624) | exact |
| `get-shit-done/workflows/audit-milestone.md` | workflow | request-response | same file — existing `resolve-model` + `Agent()` block (lines 37–98) | self-analog (extension) |
| `get-shit-done/workflows/debug.md` | workflow | request-response | `audit-milestone.md` lines 37–98 (Group B, legacy jq form) | role-match |
| `get-shit-done/workflows/docs-update.md` | workflow | request-response | `audit-milestone.md` lines 37–98 (Group B — standalone shell call preferred per RESEARCH.md Option A) | role-match |
| `get-shit-done/workflows/scan.md` | workflow | request-response | `audit-milestone.md` lines 37–98 (Group B) | role-match |
| `get-shit-done/workflows/secure-phase.md` | workflow | request-response | `audit-milestone.md` lines 37–98 (Group B, --raw form) | exact |
| `get-shit-done/workflows/ui-phase.md` | workflow | request-response | `audit-milestone.md` lines 37–98 (Group B, --raw form) | exact |
| `get-shit-done/workflows/ui-review.md` | workflow | request-response | `audit-milestone.md` lines 37–98 (Group B, --raw form) | exact |
| `get-shit-done/workflows/validate-phase.md` | workflow | request-response | `audit-milestone.md` lines 37–98 (Group B, --raw form) | exact |
| `get-shit-done/workflows/discuss-phase/modes/advisor.md` | workflow | request-response | `audit-milestone.md` lines 37–98 (Group B, --raw form) | exact |
| `agents/gsd-debug-session-manager.md` | agent/orchestrator | request-response | `debug.md` (legacy jq form) | exact |
| `get-shit-done/workflows/execute-phase.md` | workflow | request-response | same file — existing init JSON parse + `Agent()` blocks (lines 85–88, 540–548, 1392–1395) | self-analog (Group A extension) |
| `get-shit-done/workflows/execute-plan.md` | workflow | request-response | `execute-phase.md` Group A pattern | role-match |
| `get-shit-done/workflows/plan-phase.md` | workflow | request-response | `execute-phase.md` Group A pattern | role-match |
| `get-shit-done/workflows/new-project.md` | workflow | request-response | `execute-phase.md` Group A pattern | role-match |
| `get-shit-done/workflows/new-milestone.md` | workflow | request-response | `execute-phase.md` Group A pattern | role-match |
| `get-shit-done/workflows/verify-work.md` | workflow | request-response | `execute-phase.md` Group A pattern | role-match |
| `get-shit-done/workflows/map-codebase.md` | workflow | request-response | `execute-phase.md` Group A pattern | role-match |
| `get-shit-done/workflows/quick.md` | workflow | request-response | `execute-phase.md` Group A pattern | role-match |

---

## Pattern Assignments

### `get-shit-done/bin/lib/core.cjs` — medium floor insertion (D-08)

**Analog:** Same function — `resolveReasoningEffortInternal`, lines 1683–1692 (the existing runtime-tier fallback + final return null).

**Current fallthrough pattern** (lines 1683–1692 — the exact block being modified):
```javascript
  // 5. Runtime-tier entry fallback (CONFIG-03 / RESOLVE-03): _resolveRuntimeTier
  //    merges user model_profile_overrides with built-in runtime defaults
  //    (field-merge). Only reached when the catalog slot carries NO effort suffix —
  //    e.g. a bare 'opus' slot on codex. reasoning_effort present → return it.
  //    For claude runtime, RUNTIME_PROFILE_MAP has no entry → returns null.
  const entry = _resolveRuntimeTier(config, bareTier);
  if (entry?.reasoning_effort) return entry.reasoning_effort;

  return null;   // ← THIS LINE becomes the medium floor (D-08)
}
```

**Insertion point:** Replace `return null;` at line 1691 with the D-08 floor. The allowlist gate at line 1617 and the inherit-null at line 1635 are untouched.

**Pattern to copy — D-08 floor replacing line 1691:**
```javascript
  // D-08: floor un-assigned {claude,codex} slots to 'medium'.
  // The allowlist gate (line 1617) already ensures we are on a supported runtime.
  // inherit slots returned null at line 1635 — they never reach here.
  return 'medium';
```

**Comment to update — line 1609** (back-compat invariant that D-08 intentionally drops):
```javascript
// Back-compat invariant: bare claude configs without catalog slot effort → null.
```
Replace with:
```javascript
// D-08: bare {claude,codex} slots floor to 'medium' (milestone amendment 2026-06-04).
// inherit slots and non-effort runtimes still return null (steps 1, 2 above).
```

---

### `get-shit-done/bin/lib/commands.cjs` — new `cmdResolveModelEffort` function

**Analog:** `cmdResolveModel` (lines 236–252) — identical structure: guard agentType, call resolver, call output().

**Exact analog to copy from** (lines 236–252):
```javascript
function cmdResolveModel(cwd, agentType, raw) {
  if (!agentType) {
    error('agent-type required');
  }

  const config = loadConfig(cwd);
  const profile = config.model_profile || 'balanced';
  const model = resolveModelInternal(cwd, agentType);
  const reasoningEffort = resolveReasoningEffortInternal(cwd, agentType);

  const agentModels = MODEL_PROFILES[agentType];
  const result = agentModels
    ? { model, profile }
    : { model, profile, unknown_agent: true };
  result.effort = reasoningEffort ?? null;
  output(result, raw, model);
}
```

**New function to create (place immediately after cmdResolveModel, before cmdCommit at line 254):**
```javascript
function cmdResolveModelEffort(cwd, agentType, raw) {
  if (!agentType) {
    error('agent-type required');
  }
  const effort = resolveReasoningEffortInternal(cwd, agentType);
  const token = effort !== null ? `effort="${effort}"` : '';
  output({ effort, token }, raw, token);
}
```

**Export registration** — add `cmdResolveModelEffort` to the `module.exports` object at line 1024 alongside `cmdResolveModel`. Pattern: single trailing `module.exports = { ... }` per lib file.

**Imports:** `resolveReasoningEffortInternal` is already imported from `core.cjs` at line 7 — no new imports needed.

---

### `get-shit-done/bin/gsd-tools.cjs` — new `resolve-model-effort` case

**Analog:** `case 'resolve-model':` block (lines 621–624) — three lines: case label, dispatch, break.

**Exact analog to copy from** (lines 621–624):
```javascript
    case 'resolve-model': {
      commands.cmdResolveModel(cwd, args[1], raw);
      break;
    }
```

**New case to insert (immediately after the `resolve-model` case, before `case 'find-phase'` at line 626):**
```javascript
    case 'resolve-model-effort': {
      commands.cmdResolveModelEffort(cwd, args[1], raw);
      break;
    }
```

**Help string** (line 465) — add `resolve-model-effort` to the help listing alongside `resolve-model`:
```
'profile-sample, progress, prompt-budget, requirements, resolve-model, resolve-model-effort, roadmap, scaffold, state, '
```

---

### Group B workflows — standalone resolve pattern

Applies to: `audit-milestone.md`, `debug.md`, `docs-update.md`, `scan.md`, `secure-phase.md`, `ui-phase.md`, `ui-review.md`, `validate-phase.md`, `discuss-phase/modes/advisor.md`, `agents/gsd-debug-session-manager.md`.

**Analog:** `audit-milestone.md` lines 37–98 — the complete resolve + Agent() block.

**Existing resolve line + Agent() block** (audit-milestone.md lines 37–98):
```
Resolve integration checker model:
```bash
integration_checker_model=$($GSD_SDK query resolve-model gsd-integration-checker --raw)
```

...

```
Agent(
  prompt="...",
  subagent_type="gsd-integration-checker",
  model="{integration_checker_model}"
)
```
```

**Pattern to copy — extend to:**
```
Resolve integration checker model:
```bash
integration_checker_model=$($GSD_SDK query resolve-model gsd-integration-checker --raw)
integration_checker_model_effort_arg=$($GSD_SDK query resolve-model-effort gsd-integration-checker --raw)
```

...

```
Agent(
  prompt="...",
  subagent_type="gsd-integration-checker",
  model="{integration_checker_model}",
  {integration_checker_model_effort_arg}
)
```
```

**For legacy jq-form sites** (`debug.md`, `agents/gsd-debug-session-manager.md`) — the effort line always uses `--raw` regardless of the model line form:
```bash
# Existing (legacy — do not change this line):
debugger_model=$($GSD_SDK query resolve-model gsd-debugger 2>/dev/null | jq -r '.model' 2>/dev/null || true)
# New (adjacent — always --raw form):
debugger_model_effort_arg=$($GSD_SDK query resolve-model-effort gsd-debugger --raw 2>/dev/null || echo "")
```

Agent() extension for legacy sites is identical to the --raw form above.

---

### Group A workflows — init-fed pattern

Applies to: `execute-phase.md`, `execute-plan.md`, `plan-phase.md`, `new-project.md`, `new-milestone.md`, `verify-work.md`, `map-codebase.md`, `quick.md`.

**Analog:** `execute-phase.md` lines 85–88 (parse instruction) and lines 540–548, 1392–1395 (Agent() blocks).

**Existing parse instruction** (execute-phase.md line 85):
```
Parse JSON for: `executor_model`, `verifier_model`, `commit_docs`, ...
```

**Existing Agent() block** (execute-phase.md lines 540–548):
```text
Agent(
  subagent_type="gsd-executor",
  description="Execute plan {plan_number} of phase {phase_number}",
  # Only include model= when executor_model is an explicit model name.
  # When executor_model is "inherit", omit this parameter entirely so
  # Claude Code inherits the orchestrator model automatically.
  model="{executor_model}",  # omit this line when executor_model == "inherit"
  isolation="worktree",
  prompt="..."
)
```

**Existing verifier Agent() block** (execute-phase.md lines 1392–1395):
```text
Agent(
  ...,
  subagent_type="gsd-verifier",
  model="{verifier_model}"
)
```

**Pattern to copy — Group A wiring (two changes per workflow):**

1. Extend the parse instruction to include effort vars — add `executor_effort`, `verifier_effort` etc. adjacent to the corresponding model vars:
```
Parse JSON for: `executor_model`, `executor_effort`, `verifier_model`, `verifier_effort`, `commit_docs`, ...
```

2. Add a shell assignment to build the pre-built token from the init-JSON effort var (placed after the parse block, before the first Agent() call):
```bash
executor_model_effort_arg=$([ -n "$executor_effort" ] && [ "$executor_effort" != "null" ] && echo "effort=\"$executor_effort\"" || echo "")
verifier_model_effort_arg=$([ -n "$verifier_effort" ] && [ "$verifier_effort" != "null" ] && echo "effort=\"$verifier_effort\"" || echo "")
```

3. Extend each Agent() block with the effort arg line adjacent to model=:
```text
Agent(
  subagent_type="gsd-executor",
  model="{executor_model}",
  {executor_model_effort_arg}
  isolation="worktree",
  prompt="..."
)
```

> **Alternative per RESEARCH.md:** Use an explicit `resolve-model-effort` shell call even for Group A sites (makes all sites uniform, eliminates the shell conditional). The init JSON `*_effort` fields remain for EXPOSE-01 compliance but the resolve call drives the token. Planner decides which form to standardize.

---

## Shared Patterns

### Naming convention for effort vars

**Source:** CONTEXT.md D-03 + RESEARCH.md D-06 naming section.
**Apply to:** All spawn-site files.

| Existing var | New resolve var | New token var |
|---|---|---|
| `executor_model` | (from init JSON: `executor_effort`) | `executor_model_effort_arg` |
| `integration_checker_model` | `integration_checker_model_effort` (from shell) | `integration_checker_model_effort_arg` |
| `debugger_model` | `debugger_model_effort` (from shell) | `debugger_model_effort_arg` |

Rule: `{existing_model_var}_effort_arg` for the pre-built token; `{existing_model_var}_effort` for the raw resolved value.

### Token format

**Source:** RESEARCH.md D-06 handler spec.
**Apply to:** All sites — the token emitted by `resolve-model-effort --raw` and the shell conditional form must match.

- Present: `effort="medium"` (quoted, matches model="..." convention)
- Absent: `""` (empty string — never the literal `null`)

### Model resolution omit-when-inherit instruction

**Source:** `execute-phase.md` line 87 — existing instruction that must be extended to cover effort.

**Existing instruction:**
```
**Model resolution:** If `executor_model` is `"inherit"`, omit the `model=` parameter from all `Agent()` calls...
```

**Extension pattern** (add adjacent sentence):
```
**Effort resolution:** The `{executor_model_effort_arg}` token is empty when effort is absent (inherit slot or non-effort runtime) — interpolating an empty token renders nothing, requiring no conditional. Pass `{executor_model_effort_arg}` unconditionally.
```

### output() call form for new CLI handler

**Source:** `cmdResolveModel` lines 251 — `output(result, raw, model)` where the third arg is the raw-mode value.
**Apply to:** `cmdResolveModelEffort` — `output({ effort, token }, raw, token)` where `token` is the raw-mode value (never `null`).

---

## No Analog Found

None — all files have direct analogs in the codebase.

---

## Metadata

**Analog search scope:** `get-shit-done/bin/lib/`, `get-shit-done/bin/gsd-tools.cjs`, `get-shit-done/workflows/`, `agents/`
**Files read for pattern extraction:** `core.cjs` (lines 1605–1692), `commands.cjs` (lines 1–11, 236–252), `gsd-tools.cjs` (lines 460–467, 618–626), `audit-milestone.md` (lines 35–100), `execute-phase.md` (lines 83–95, 538–548, 1388–1398)
**Pattern extraction date:** 2026-06-04
