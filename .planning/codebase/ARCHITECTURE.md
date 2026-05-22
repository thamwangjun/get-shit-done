# Architecture

**Analysis Date:** 2026-04-15

## Pattern Overview

**Overall:** Meta-prompting framework with layered orchestration and file-based state

**Key Characteristics:**
- Four discrete layers: Commands → Workflows → Agents → CLI Tools
- All state is human-readable Markdown/JSON stored in `.planning/` — no database, no server
- Fresh 200K-token context window per spawned agent (solves "context rot")
- Thin orchestrators: workflows only coordinate, agents do the heavy lifting
- Absent = enabled pattern for all feature flags in `config.json`

## Layers

**Command Layer:**
- Purpose: User-facing entry points that bootstrap workflow execution
- Location: `commands/gsd/*.md`
- Contains: YAML frontmatter (name, description, allowed-tools) + prompt body that reads matching workflow
- Depends on: Workflow layer via `@~/.claude/get-shit-done/workflows/*.md` references
- Used by: AI coding tool runtime (Claude Code slash commands, Codex skills, Copilot slash commands)

**Workflow Layer:**
- Purpose: Orchestration logic — never does heavy lifting, only coordinates
- Location: `get-shit-done/workflows/*.md`
- Contains: Step-by-step orchestration: init → spawn agents → collect results → update state
- Depends on: CLI tools layer (`gsd-tools.cjs init <workflow>`) and Agent layer (via `Task(subagent_type=...)`)
- Used by: Command layer (commands read and execute workflows)

**Agent Layer:**
- Purpose: Specialized task executors, each spawned with a fresh context window
- Location: `agents/*.md` (31 agents), `sdk/prompts/agents/` (SDK variants)
- Contains: YAML frontmatter (`name`, `description`, `tools`, `color`, optional `hooks`) + role instructions
- Depends on: CLI tools layer via Bash calls to `gsd-tools.cjs`, file-based state in `.planning/`
- Used by: Workflow layer orchestrators

**CLI Tools Layer:**
- Purpose: Low-level Node.js interface between agents/workflows and `.planning/` state
- Location: `get-shit-done/bin/gsd-tools.cjs` (entry point), `get-shit-done/bin/lib/*.cjs` (modules)
- Contains: State CRUD, phase operations, roadmap parsing, config, template filling, verification
- Depends on: `.planning/` directory on filesystem
- Used by: Workflows (via Bash in init step), agents (via Bash for state reads/writes)

## Data Flow

**Standard Phase Execution Flow:**

1. User runs `/gsd-execute-phase N` → command at `commands/gsd/execute-phase.md` activates
2. Command reads `get-shit-done/workflows/execute-phase.md`
3. Workflow calls `node ~/.claude/get-shit-done/bin/gsd-tools.cjs init execute-phase N` to load context as JSON
4. Workflow discovers plans in `.planning/phases/phase-N/` and groups into dependency waves
5. Workflow spawns `gsd-executor` agent(s) in parallel per wave via `Task(subagent_type="gsd-executor")`
6. Each executor agent runs independently with fresh context, reads PLAN.md, executes tasks, commits
7. Executor writes SUMMARY.md to `.planning/phases/phase-N/`
8. Workflow verifier agent (`gsd-verifier`) checks outcomes against phase goals
9. Workflow calls `gsd-tools.cjs state update` to advance checkpoint in STATE.md

**Planning Flow:**

1. `/gsd-plan-phase N` → `get-shit-done/workflows/plan-phase.md`
2. Workflow spawns `gsd-phase-researcher` (optional, if research needed)
3. Workflow spawns `gsd-planner` with phase scope from ROADMAP.md + research results
4. Workflow spawns `gsd-plan-checker` to validate plan quality
5. If checker fails: revision loop (max 3 iterations) back to `gsd-planner`
6. Final PLAN.md written to `.planning/phases/phase-N/`

**State Management:**
- STATE.md is the central project checkpoint file at `.planning/STATE.md`
- File-locked via `.planning/STATE.md.lock` for parallel-safe writes during wave execution
- `state.cjs` provides CRUD, checkpoint progression, and metrics
- Lock cleanup registered via `process.on('exit')` to prevent stale locks

## Key Abstractions

**Phase:**
- Purpose: Represents a unit of work with a plan, research, and execution artifacts
- Examples: `.planning/phases/phase-1/PLAN.md`, `.planning/phases/phase-1/SUMMARY.md`
- Pattern: Decimal sub-phases supported (e.g., `phase-1.1`, `phase-2.3`). Directories sorted numerically by `comparePhaseNum()` in `get-shit-done/bin/lib/phase.cjs`

**Wave:**
- Purpose: Group of plans with no inter-dependencies, safe to execute in parallel
- Examples: Referenced in `get-shit-done/workflows/execute-phase.md`
- Pattern: Workflow performs dependency analysis on `task.depends_on` fields in PLAN.md frontmatter, groups independent tasks into waves, executes each wave's agents in parallel

**Gate:**
- Purpose: Mandatory quality checkpoints before progressing between pipeline stages
- Examples: `get-shit-done/references/gates.md`, `get-shit-done/references/gate-prompts.md`
- Pattern: Four canonical gate types — Confirm, Quality, Safety, Transition — wired into `gsd-plan-checker` and `gsd-verifier` agents

**Reference:**
- Purpose: Shared knowledge fragments injected via `@-reference` syntax into workflows and agents
- Examples: `get-shit-done/references/verification-patterns.md`, `get-shit-done/references/model-profiles.md`
- Pattern: Workflows include `<required_reading>` blocks; agents read references before acting

**Template:**
- Purpose: Pre-structured Markdown boilerplate for planning artifacts
- Examples: `get-shit-done/templates/project.md`, `get-shit-done/templates/phase-prompt.md`
- Pattern: Filled by `gsd-tools.cjs template fill` with project context

## Entry Points

**Installer:**
- Location: `bin/install.js` (3,400+ lines)
- Triggers: `npx get-shit-done` or direct invocation during setup
- Responsibilities: Detect runtime, copy agents/workflows/commands/hooks to runtime-specific install paths, transform tool names/hook events/frontmatter per target runtime

**CLI Entry Point:**
- Location: `get-shit-done/bin/gsd-tools.cjs`
- Triggers: Called via Bash by workflows/agents — e.g., `node ~/.claude/get-shit-done/bin/gsd-tools.cjs state load`
- Responsibilities: Route subcommands (`init`, `state`, `phase`, `roadmap`, `config`, `verify`, `template`, `scaffold`, `frontmatter`, `validate`) to corresponding lib modules

**Hooks:**
- Location: `hooks/*.js` (source), `hooks/dist/` (built output installed to runtime)
- Triggers: AI tool hook events (PostToolUse / AfterTool depending on runtime)
- Responsibilities: `gsd-statusline.js` (terminal status), `gsd-context-monitor.js` (context exhaustion tracking), `gsd-check-update.js` (version checks), `gsd-workflow-guard.js` (workflow file protection)

## Error Handling

**Strategy:** Fail-fast with explicit error messages; lock cleanup on any exit; workflow-level retry loops

**Patterns:**
- `error()` in `get-shit-done/bin/lib/core.cjs` calls `process.exit(1)` with message — all lib modules use this
- Lock files tracked in `_heldStateLocks` / `_heldPlanningLocks` Sets, removed on `process.on('exit')`
- Plan revision loop (max 3 iterations) in `plan-phase.md` workflow when `gsd-plan-checker` fails
- Agent fallback: if named subagent type unavailable, workflows detect via `agents_installed` from init JSON and may fall back to inline execution
- Wave execution: if agent completes but signal is lost, workflow verifies via filesystem (commits + SUMMARY.md exist) and continues

## Cross-Cutting Concerns

**Logging:** `output()` in `get-shit-done/bin/lib/core.cjs` — writes JSON to stdout for structured consumption by orchestrators; `error()` writes to stderr and exits

**Validation:** `get-shit-done/bin/lib/verify.cjs` — plan-structure, phase-completeness, artifact references, commit verification. Called via `gsd-tools.cjs verify`

**Authentication:** Not applicable — no auth layer. Runtime credentials (API keys, model access) are managed by the AI tool itself, not by GSD

**Runtime Adaptation:** `bin/install.js` transforms all installed files at install time per target runtime — tool names (`Read`→`read`), hook events (`PostToolUse`↔`AfterTool`), agent frontmatter format, install paths

---

*Architecture analysis: 2026-04-15*
