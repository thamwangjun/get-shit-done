---
quick_id: 260606-x8b
status: ready
---

# Quick Task 260606-x8b: Add effort= to Agent invocations in prompt files - Context

**Gathered:** 2026-06-06
**Status:** Ready for planning

<domain>
## Task Boundary

Find all prompt files (`.md` files in `agents/`, `get-shit-done/workflows/`, and any other prompt directories) that have `{*_effort_arg}` patterns inside Agent() invocations. Add `effort=` before each `{*_effort_arg}` token so the call reads `effort={*_effort_arg}` instead of bare `{*_effort_arg}`.

</domain>

<decisions>
## Implementation Decisions

### Prose descriptions of Agent calls
- YES — update prose lines that describe how to invoke Agent (e.g. Pattern A in execute-plan.md line 111: `spawn Agent(..., {executor_model_effort_arg})`). These serve as instructions to the AI and must show the correct syntax.

### Meta-documentation about tokens
- Leave as-is — lines that discuss the token's semantics (e.g. execute-phase.md line 87: "The `{executor_model_effort_arg}` tokens are empty when effort is absent") are explanatory, not invocation patterns, and should not be changed.

### Shell script variable definitions
- Leave as-is — lines like `executor_model_effort_arg=$(...)` that define the shell variable are not Agent() calls and must not be modified.

### Claude's Discretion
- Scope: search `agents/` and `get-shit-done/workflows/` directories. Commands (`commands/gsd/`) and skills (`.claude/skills/`) showed no matching patterns in initial scan.
- Handle both standalone-line patterns (`  {planner_model_effort_arg}` on its own line in a multi-line Agent call) and inline patterns (`Agent(..., {code_fixer_model_effort_arg} prompt=...)`).

</decisions>

<specifics>
## Specific Ideas

Pattern to fix (multi-line Agent call, standalone effort_arg line):
```
Agent(
  subagent_type="gsd-executor",
  model=executor_model,
  {executor_model_effort_arg}   ← becomes: effort={executor_model_effort_arg}
  description="..."
)
```

Pattern to fix (inline):
```
Agent(subagent_type="gsd-executor", model=executor_model, {executor_model_effort_arg} description="...")
→ Agent(subagent_type="gsd-executor", model=executor_model, effort={executor_model_effort_arg} description="...")
```

Pattern to fix (prose description of Agent invocation):
```
spawn Agent(subagent_type="gsd-executor", model=executor_model, {executor_model_effort_arg}) with prompt...
→ spawn Agent(subagent_type="gsd-executor", model=executor_model, effort={executor_model_effort_arg}) with prompt...
```

Pattern to LEAVE ALONE (meta-documentation):
```
The `{executor_model_effort_arg}` tokens are empty when effort is absent
```

Pattern to LEAVE ALONE (shell variable definition):
```
executor_model_effort_arg=$([ -n "$executor_effort" ] && ...)
```

</specifics>
